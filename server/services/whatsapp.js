import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_PATH = path.join(__dirname, "..", "auth_info");

// ── Estado global ─────────────────────────────────────────────────────────────
let sock = null;
let status = "DISCONNECTED"; // DISCONNECTED | CONNECTING | QR_READY | CONNECTED | ERROR
let qrCode = null;
let connectingTimer = null;
let presenceTimer = null;

// ── Cola de mensajes con rate limit ──────────────────────────────────────────
const messageQueue = [];
const MAX_QUEUE_SIZE = 1000;
const RATE_LIMIT_MS = 3000;
let sending = false;
let lastSendTime = 0;

setInterval(async () => {
  if (sending || status !== "CONNECTED" || !sock || messageQueue.length === 0) return;
  if (Date.now() - lastSendTime < RATE_LIMIT_MS) return;

  sending = true;
  const job = messageQueue.shift();

  if (job) {
    try {
      let cleanPhone = job.phone.replace(/\D/g, "");
      let targetJid = `${cleanPhone}@s.whatsapp.net`;

      // Resolver JID real para evitar el problema del número fantasma
      const waInfo = await sock.onWhatsApp(cleanPhone);
      if (waInfo && waInfo.length > 0) {
        targetJid = waInfo[0].jid;
      } else if (cleanPhone.startsWith("549")) {
        const sinNueve = "54" + cleanPhone.substring(3);
        const waInfo2 = await sock.onWhatsApp(sinNueve);
        if (waInfo2 && waInfo2.length > 0) targetJid = waInfo2[0].jid;
      }

      await sock.sendMessage(targetJid, { text: job.message });
      lastSendTime = Date.now();
      console.log(`[WhatsApp] Mensaje enviado a ${job.phone} (JID: ${targetJid})`);
    } catch (err) {
      console.error("[WhatsApp] Error enviando mensaje:", err.message);
    }
  }
  sending = false;
}, 1000);

// ── Sincronización sesión con Supabase ────────────────────────────────────────
async function loadSessionFromDB() {
  try {
    const res = await pool.query(`SELECT session_data FROM whatsapp_session WHERE id = 'creds.json'`);
    if (!res.rows.length) { console.log("[WhatsApp] No hay sesión guardada en DB."); return; }
    if (!fs.existsSync(AUTH_PATH)) fs.mkdirSync(AUTH_PATH, { recursive: true });
    fs.writeFileSync(path.join(AUTH_PATH, "creds.json"), res.rows[0].session_data, "utf-8");
    console.log("[WhatsApp] Sesión cargada desde DB.");
  } catch (err) {
    console.error("[WhatsApp] Error cargando sesión:", err.message);
  }
}

async function saveSessionToDB() {
  try {
    const credsPath = path.join(AUTH_PATH, "creds.json");
    if (!fs.existsSync(credsPath)) return;
    const content = fs.readFileSync(credsPath, "utf-8");
    await pool.query(`
      INSERT INTO whatsapp_session (id, session_data) VALUES ('creds.json', $1)
      ON CONFLICT (id) DO UPDATE SET session_data = $1, updated_at = NOW()
    `, [content]);
    console.log("[WhatsApp] Sesión guardada en DB.");
  } catch (err) {
    console.error("[WhatsApp] Error guardando sesión:", err.message);
  }
}

function resetAuthFolder() {
  try {
    if (fs.existsSync(AUTH_PATH)) {
      fs.rmSync(AUTH_PATH, { recursive: true, force: true });
      fs.mkdirSync(AUTH_PATH, { recursive: true });
      console.log("[WhatsApp] auth_info reseteado.");
    }
  } catch (_) {}
}

// ── Iniciar conexión ──────────────────────────────────────────────────────────
export async function iniciarWhatsApp() {
  if (connectingTimer) { clearTimeout(connectingTimer); connectingTimer = null; }
  if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
  if (sock) {
    try { sock.ev.removeAllListeners(); } catch (_) {}
    try { sock.ws?.close(); } catch (_) {}
    sock = null;
  }

  if (!fs.existsSync(AUTH_PATH)) fs.mkdirSync(AUTH_PATH, { recursive: true });

  await loadSessionFromDB();
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
  const { version } = await fetchLatestBaileysVersion();

  status = "CONNECTING";
  qrCode = null;

  // Timeout de 30s si no llega el QR
  connectingTimer = setTimeout(() => {
    if (status === "CONNECTING") {
      status = "DISCONNECTED";
      qrCode = null;
      iniciarWhatsApp();
    }
  }, 30000);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.macOS("Desktop"),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 20000,
    markOnlineOnConnect: false,
  });

  sock.ev.on("creds.update", async () => {
    await saveCreds();
    await saveSessionToDB();
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      try {
        qrCode = await QRCode.toDataURL(qr);
        status = "QR_READY";
        console.log("[WhatsApp] QR generado — escaneá desde Configuración.");
      } catch {
        status = "ERROR";
      }
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;

      status = "DISCONNECTED";
      qrCode = null;
      if (connectingTimer) { clearTimeout(connectingTimer); connectingTimer = null; }

      if (loggedOut) {
        resetAuthFolder();
        await pool.query(`DELETE FROM whatsapp_session WHERE id = 'creds.json'`);
        setTimeout(iniciarWhatsApp, 3000);
      } else {
        setTimeout(iniciarWhatsApp, 5000);
      }
    }

    if (connection === "open") {
      if (connectingTimer) { clearTimeout(connectingTimer); connectingTimer = null; }
      status = "CONNECTED";
      qrCode = null;
      console.log("[WhatsApp] Conectado correctamente.");

      // Marcar unavailable para que el celular siga recibiendo notificaciones
      try { await sock.sendPresenceUpdate("unavailable"); } catch (_) {}
      if (presenceTimer) clearInterval(presenceTimer);
      presenceTimer = setInterval(async () => {
        if (sock && status === "CONNECTED") {
          try { await sock.sendPresenceUpdate("unavailable"); } catch (_) {}
        }
      }, 5 * 60 * 1000);
    }
  });
}

// ── Cerrar sesión ─────────────────────────────────────────────────────────────
export async function cerrarSesionWhatsApp() {
  resetAuthFolder();
  await pool.query(`DELETE FROM whatsapp_session WHERE id = 'creds.json'`);
  if (sock) {
    try { await sock.logout(); } catch (_) {}
    sock = null;
  }
  status = "DISCONNECTED";
  qrCode = null;
  console.log("[WhatsApp] Sesión cerrada.");
}

// ── Enviar mensaje (interfaz pública) ─────────────────────────────────────────
export async function enviarMensajeWhatsApp({ telefono, mensaje }) {
  if (status !== "CONNECTED") {
    console.warn(`[WhatsApp] No conectado (estado: ${status}). Mensaje no enviado.`);
    console.log(`[WhatsApp Mock] A: ${telefono} | Msg: ${mensaje}`);
    return { ok: true, mock: true };
  }
  if (messageQueue.length >= MAX_QUEUE_SIZE) {
    console.warn("[WhatsApp] Cola llena. Mensaje descartado.");
    return { ok: false, error: "Cola llena" };
  }
  const formateado = formatearTelefono(telefono);
  messageQueue.push({ phone: formateado, message: mensaje });
  return { ok: true, queued: true };
}

// ── Estado y QR para la UI ────────────────────────────────────────────────────
export function getEstadoWhatsApp() {
  return { estado: status, conectado: status === "CONNECTED" };
}

export function getQRWhatsApp() {
  return qrCode;
}

// ── Formatear número argentino ────────────────────────────────────────────────
export function formatearTelefono(rawPhone) {
  if (!rawPhone) return null;
  let num = rawPhone.replace(/\D/g, "");
  if (num.startsWith("549") && num.length === 13) return num;
  if (num.startsWith("54") && !num.startsWith("549") && num.length === 12) return "549" + num.substring(2);
  if (num.startsWith("549")) num = num.substring(3);
  else if (num.startsWith("54")) num = num.substring(2);
  if (num.startsWith("0")) num = num.substring(1);
  if (num.length === 10) return "549" + num;
  return num;
}
