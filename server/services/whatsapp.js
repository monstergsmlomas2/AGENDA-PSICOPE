import pkg from "@whiskeysockets/baileys";
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = pkg;

import { Boom } from "@hapi/boom";
import pool from "../config/db.js";
import QRCode from "qrcode";

// ── Estado global de la conexión ──────────────────────────────────────────────
let sock = null;
let estadoConexion = "desconectado"; // desconectado | conectando | conectado
let qrActual = null; // QR en base64 para mostrar en la UI
let reintentos = 0;
const MAX_REINTENTOS = 5;

// ── Auth store en Supabase ────────────────────────────────────────────────────
async function cargarSesion() {
  try {
    const res = await pool.query(
      "SELECT session_data FROM whatsapp_session WHERE id = 'default'"
    );
    return res.rows[0]?.session_data || null;
  } catch {
    return null;
  }
}

async function guardarSesion(data) {
  try {
    await pool.query(
      `INSERT INTO whatsapp_session (id, session_data, updated_at)
       VALUES ('default', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET session_data = $1, updated_at = NOW()`,
      [JSON.stringify(data)]
    );
  } catch (err) {
    console.error("[WhatsApp] Error guardando sesión:", err.message);
  }
}

// Auth state compatible con Baileys usando Supabase
async function useSQLAuthState() {
  const sesionGuardada = await cargarSesion();

  const state = {
    creds: sesionGuardada?.creds || {},
    keys: {
      get: (type, ids) => {
        const data = {};
        for (const id of ids) {
          const val = sesionGuardada?.keys?.[type]?.[id];
          data[id] = val !== undefined ? val : null;
        }
        return data;
      },
      set: async (data) => {
        const keys = sesionGuardada?.keys || {};
        for (const [type, typeData] of Object.entries(data)) {
          keys[type] = keys[type] || {};
          for (const [id, value] of Object.entries(typeData)) {
            if (value) keys[type][id] = value;
            else delete keys[type][id];
          }
        }
        await guardarSesion({ creds: state.creds, keys });
      },
    },
  };

  const saveCreds = async () => {
    await guardarSesion({ creds: state.creds, keys: sesionGuardada?.keys || {} });
  };

  return { state, saveCreds };
}

// ── Iniciar conexión ──────────────────────────────────────────────────────────
export async function iniciarWhatsApp() {
  if (estadoConexion === "conectado") return;
  estadoConexion = "conectando";
  qrActual = null;

  try {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useSQLAuthState();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      browser: ["AgendaPsicope", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        qrActual = await QRCode.toDataURL(qr);
        estadoConexion = "esperando_qr";
        console.log("[WhatsApp] QR generado — escaneá desde Configuración.");
      }

      if (connection === "open") {
        estadoConexion = "conectado";
        qrActual = null;
        reintentos = 0;
        console.log("[WhatsApp] Conectado correctamente.");
      }

      if (connection === "close") {
        const motivo = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const debeReconectar = motivo !== DisconnectReason.loggedOut;

        estadoConexion = "desconectado";
        qrActual = null;

        if (debeReconectar && reintentos < MAX_REINTENTOS) {
          reintentos++;
          const delay = Math.min(5000 * reintentos, 30000);
          console.log(`[WhatsApp] Desconectado. Reintentando en ${delay / 1000}s (intento ${reintentos}/${MAX_REINTENTOS})...`);
          setTimeout(iniciarWhatsApp, delay);
        } else if (motivo === DisconnectReason.loggedOut) {
          console.log("[WhatsApp] Sesión cerrada. Borrando sesión guardada...");
          await pool.query("DELETE FROM whatsapp_session WHERE id = 'default'");
        } else {
          console.error("[WhatsApp] Máximo de reintentos alcanzado.");
        }
      }
    });
  } catch (err) {
    estadoConexion = "desconectado";
    console.error("[WhatsApp] Error al iniciar:", err.message);
  }
}

// ── Enviar mensaje (misma interfaz que antes) ─────────────────────────────────
export async function enviarMensajeWhatsApp({ telefono, mensaje }) {
  if (estadoConexion !== "conectado" || !sock) {
    console.warn("[WhatsApp] No conectado. Mensaje no enviado.");
    console.log(`[WhatsApp Mock] A: ${telefono} | Msg: ${mensaje}`);
    return { ok: true, mock: true };
  }

  const jid = formatearJID(telefono);
  if (!jid) throw new Error("Teléfono inválido");

  await sock.sendMessage(jid, { text: mensaje });
  console.log(`[WhatsApp] Mensaje enviado a ${jid}`);
  return { ok: true };
}

// ── Cerrar sesión ─────────────────────────────────────────────────────────────
export async function cerrarSesionWhatsApp() {
  await pool.query("DELETE FROM whatsapp_session WHERE id = 'default'");
  if (sock) {
    await sock.logout();
    sock = null;
  }
  estadoConexion = "desconectado";
  qrActual = null;
  console.log("[WhatsApp] Sesión cerrada y datos borrados.");
}

// ── Estado y QR para la UI ────────────────────────────────────────────────────
export function getEstadoWhatsApp() {
  return { estado: estadoConexion, conectado: estadoConexion === "conectado" };
}

export function getQRWhatsApp() {
  return qrActual;
}

// ── Formatear número argentino a JID de WhatsApp ──────────────────────────────
export function formatearTelefono(tel) {
  if (!tel) return null;
  const limpio = tel.replace(/[\s\-\(\)\+]/g, "");
  let numero;
  if (limpio.startsWith("549")) {
    numero = limpio;
  } else if (limpio.startsWith("54")) {
    numero = `549${limpio.slice(2)}`;
  } else if (limpio.startsWith("0")) {
    numero = `549${limpio.slice(1)}`;
  } else {
    numero = `549${limpio}`;
  }
  return numero;
}

function formatearJID(tel) {
  const numero = formatearTelefono(tel);
  return numero ? `${numero}@s.whatsapp.net` : null;
}
