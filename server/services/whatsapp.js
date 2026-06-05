import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import pool from "../config/db.js";
import { extraerEventoDeTexto, detectarYExtraerRecordatorio } from "./aiService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_PATH = path.join(__dirname, "..", "auth_info");

// ── Estado global ─────────────────────────────────────────────────────────────
let sock = null;
let status = "DISCONNECTED"; // DISCONNECTED | CONNECTING | QR_READY | CONNECTED | ERROR
let qrCode = null;
let connectingTimer = null;
let presenceTimer = null;
let isReconnecting = false; // evita reconexiones en cascada
let intentionalDisconnect = false; // evita reconexión automática tras cerrar sesión manualmente

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
      // Construir JID directo sin consultar onWhatsApp (evita fallo de red que descarta el mensaje)
      let targetJid = `${cleanPhone}@s.whatsapp.net`;

      await sock.sendMessage(targetJid, { text: job.message });
      lastSendTime = Date.now();
      console.log(`[WhatsApp] Mensaje enviado a ${job.phone}`);
    } catch (err) {
      console.error(`[WhatsApp] Error enviando a ${job.phone}:`, err.message);
      // Reintentar hasta 3 veces antes de descartar
      const reintentos = (job.reintentos || 0) + 1;
      if (reintentos < 3) {
        console.log(`[WhatsApp] Reintento ${reintentos}/3 para ${job.phone}`);
        messageQueue.unshift({ ...job, reintentos });
      } else {
        console.error(`[WhatsApp] Descartado tras 3 intentos: ${job.phone}`);
      }
    }
  }
  sending = false;
}, 1000);

// ── Sincronización sesión completa con Supabase ───────────────────────────────
// Guarda TODOS los archivos de auth_info, no solo creds.json
async function loadSessionFromDB() {
  try {
    const res = await pool.query(`SELECT filename, file_data FROM whatsapp_session`);
    if (!res.rows.length) {
      console.log("[WhatsApp] No hay sesión guardada en DB.");
      return;
    }
    // Limpiar el disco antes de cargar: la DB es la única fuente de verdad.
    // Evita mezclar restos de una sesión vieja con la sesión guardada.
    if (fs.existsSync(AUTH_PATH)) {
      for (const f of fs.readdirSync(AUTH_PATH)) {
        if (f.endsWith(".json")) fs.rmSync(path.join(AUTH_PATH, f), { force: true });
      }
    } else {
      fs.mkdirSync(AUTH_PATH, { recursive: true });
    }
    for (const row of res.rows) {
      fs.writeFileSync(path.join(AUTH_PATH, row.filename), row.file_data, "utf-8");
    }
    console.log(`[WhatsApp] Sesión cargada desde DB (${res.rows.length} archivos).`);
  } catch (err) {
    // Tabla puede no existir aún — intentar migración automática
    if (err.message.includes("column") || err.message.includes("does not exist")) {
      await migrarTablaSession();
      await loadSessionFromDB();
    } else {
      console.error("[WhatsApp] Error cargando sesión:", err.message);
    }
  }
}

let savingSession = false;
async function saveSessionToDB() {
  // Evitar guardados concurrentes: el DELETE de uno podría pisar archivos
  // que otro acaba de escribir (creds.update se dispara en ráfaga).
  if (savingSession) return;
  savingSession = true;
  try {
    if (!fs.existsSync(AUTH_PATH)) return;
    const files = fs.readdirSync(AUTH_PATH).filter((f) => f.endsWith(".json"));

    for (const filename of files) {
      const content = fs.readFileSync(path.join(AUTH_PATH, filename), "utf-8");
      await pool.query(
        `
        INSERT INTO whatsapp_session (filename, file_data) VALUES ($1, $2)
        ON CONFLICT (filename) DO UPDATE SET file_data = $2, updated_at = NOW()
      `,
        [filename, content]
      );
    }

    // Sincronizar borrados: eliminar de la DB las pre-keys/archivos que Baileys
    // ya consumió y borró del disco. Sin esto, la DB acumula claves obsoletas que
    // corrompen la sesión tras cada reinicio (Bad MAC / Invalid PreKey ID).
    if (files.length > 0) {
      await pool.query(
        `DELETE FROM whatsapp_session WHERE filename <> ALL($1::text[])`,
        [files]
      );
    }

    console.log(`[WhatsApp] Sesión guardada en DB (${files.length} archivos, huérfanos limpiados).`);
  } catch (err) {
    console.error("[WhatsApp] Error guardando sesión:", err.message);
  } finally {
    savingSession = false;
  }
}

// Migración automática: adapta la tabla vieja (id + session_data) al nuevo esquema
async function migrarTablaSession() {
  try {
    await pool.query(`
      ALTER TABLE whatsapp_session ADD COLUMN IF NOT EXISTS filename TEXT;
      ALTER TABLE whatsapp_session ADD COLUMN IF NOT EXISTS file_data TEXT;
      UPDATE whatsapp_session SET filename = id, file_data = session_data WHERE filename IS NULL;
      ALTER TABLE whatsapp_session DROP CONSTRAINT IF EXISTS whatsapp_session_pkey;
      ALTER TABLE whatsapp_session ADD CONSTRAINT whatsapp_session_pkey PRIMARY KEY (filename);
    `);
    console.log("[WhatsApp] Tabla whatsapp_session migrada al nuevo esquema.");
  } catch (err) {
    // Si falla la migración, crear tabla nueva
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_session (
          filename TEXT PRIMARY KEY,
          file_data TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log("[WhatsApp] Tabla whatsapp_session creada.");
    } catch (e) {
      console.error("[WhatsApp] Error en migración de tabla:", e.message);
    }
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
  // Evitar múltiples reconexiones simultáneas
  if (isReconnecting) {
    console.log("[WhatsApp] Ya hay una reconexión en curso, ignorando.");
    return;
  }
  isReconnecting = true;

  if (connectingTimer) {
    clearTimeout(connectingTimer);
    connectingTimer = null;
  }
  if (presenceTimer) {
    clearInterval(presenceTimer);
    presenceTimer = null;
  }
  if (sock) {
    try {
      sock.ev.removeAllListeners();
    } catch (_) {}
    try {
      sock.end(undefined);
    } catch (_) {}
    sock = null;
  }

  if (!fs.existsSync(AUTH_PATH)) fs.mkdirSync(AUTH_PATH, { recursive: true });

  await loadSessionFromDB();
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);

  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
    console.log(`[WhatsApp] Versión WA: ${version.join(".")}`);
  } catch (err) {
    version = [2, 3000, 1015901307];
    console.warn("[WhatsApp] No se pudo obtener versión de WA — usando fallback:", version.join("."));
  }

  status = "CONNECTING";
  qrCode = null;
  isReconnecting = false;

  connectingTimer = setTimeout(() => {
    if (status === "CONNECTING") {
      console.log("[WhatsApp] Timeout esperando QR — reintentando...");
      status = "DISCONNECTED";
      qrCode = null;
      iniciarWhatsApp();
    }
  }, 60000);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: Browsers.macOS("Desktop"),
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    markOnlineOnConnect: false,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 5,
  });

  // Guardar TODOS los archivos de auth en DB al actualizarse las credenciales
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
      const boom = new Boom(lastDisconnect?.error);
      const code = boom?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      const restartRequired = code === DisconnectReason.restartRequired;
      const timedOut = code === DisconnectReason.timedOut;

      console.log(`[WhatsApp] Conexión cerrada — código: ${code} | ${DisconnectReason[code] ?? "desconocido"}`);

      status = "DISCONNECTED";
      qrCode = null;
      if (connectingTimer) {
        clearTimeout(connectingTimer);
        connectingTimer = null;
      }

      if (intentionalDisconnect) {
        console.log("[WhatsApp] Desconexión intencional — no reconectar.");
        intentionalDisconnect = false;
        return;
      }

      if (loggedOut) {
        console.log("[WhatsApp] Sesión cerrada — limpiando credenciales.");
        resetAuthFolder();
        await pool.query(`DELETE FROM whatsapp_session`);
        setTimeout(iniciarWhatsApp, 3000);
      } else if (restartRequired) {
        // Normal post-QR scan: WA pide restart para activar la sesión nueva
        console.log("[WhatsApp] Restart post-QR — reconectando en 2s.");
        setTimeout(iniciarWhatsApp, 2000);
      } else if (timedOut) {
        console.log("[WhatsApp] Timeout — reconectando en 10s.");
        setTimeout(iniciarWhatsApp, 10000);
      } else {
        setTimeout(iniciarWhatsApp, 5000);
      }
    }

    if (connection === "open") {
      if (connectingTimer) {
        clearTimeout(connectingTimer);
        connectingTimer = null;
      }
      status = "CONNECTED";
      qrCode = null;
      console.log("[WhatsApp] Conectado correctamente.");

      // Guardar sesión completa inmediatamente al conectar
      await saveSessionToDB();

      try {
        await sock.sendPresenceUpdate("unavailable");
      } catch (_) {}
      if (presenceTimer) clearInterval(presenceTimer);
      presenceTimer = setInterval(async () => {
        if (sock && status === "CONNECTED") {
          try {
            await sock.sendPresenceUpdate("unavailable");
          } catch (_) {}
        }
      }, 5 * 60 * 1000);
    }
  });

  // ── Escuchar mensajes ────────────────────────────────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // "notify" = mensajes entrantes nuevos; "append" = mensajes propios sincronizados
    if (type !== "notify" && type !== "append") return;

    for (const msg of messages) {
      const textoRecibido =
        msg.message?.conversation || msg.message?.extendedTextMessage?.text || null;

      if (!textoRecibido) continue;

      const remoteJid = msg.key.remoteJid || "";
      // sock.user.id tiene formato "549XXXXXXXXXX:0@s.whatsapp.net" — extraer solo dígitos antes de ":" y "@"
      const rawUserId = sock?.user?.id || "";
      const propioNumero = rawUserId.split("@")[0].split(":")[0];
      const remoteNumero = remoteJid.replace("@s.whatsapp.net", "").split(":")[0];

      // Mensajes propios: fromMe=true O el remoteJid es el propio número (chat "Tus mensajes")
      const esMensajePropio =
        msg.key.fromMe ||
        (propioNumero && remoteNumero === propioNumero);

      if (esMensajePropio) {
        // Usar remoteNumero como identificador cuando fromMe=true (el destino es quien recibe)
        // y propioNumero cuando el jid coincide con el propio número
        const numParaBuscar = msg.key.fromMe ? propioNumero : remoteNumero;
        console.log(`[AgendaPersonal] Mensaje propio — type:${type} fromMe:${msg.key.fromMe} jid:${remoteJid} numBuscar:${numParaBuscar} texto:"${textoRecibido.substring(0, 60)}"`);
        await procesarMensajePropio(numParaBuscar || propioNumero || remoteNumero, textoRecibido.trim());
        continue;
      }

      // Mensajes de terceros → exigir prefijo explícito
      const PREFIJOS_AGENDA = ["/agenda", "*agenda*", "agenda:"];
      const textoNorm = textoRecibido.trim().toLowerCase();
      if (!PREFIJOS_AGENDA.some((p) => textoNorm.startsWith(p))) continue;

      const textoProcesado = textoRecibido
        .trim()
        .replace(/^\/agenda\s*/i, "")
        .replace(/^\*agenda\*\s*/i, "")
        .replace(/^agenda:\s*/i, "")
        .trim();
      if (!textoProcesado) continue;

      const remitente = remoteJid.replace("@s.whatsapp.net", "") || "";
      await procesarMensajeEntrante(remitente, textoProcesado);
    }
  });
}

// ── Cerrar sesión ─────────────────────────────────────────────────────────────
export async function cerrarSesionWhatsApp() {
  resetAuthFolder();
  try {
    await pool.query(`DELETE FROM whatsapp_session`);
  } catch (_) {}
  if (sock) {
    intentionalDisconnect = true;
    try {
      await sock.logout();
    } catch (_) {}
    sock = null;
  }
  status = "DISCONNECTED";
  qrCode = null;
  // intentionalDisconnect se resetea en el handler de connection.update, no aquí,
  // porque el evento loggedOut llega de forma asíncrona después de que esta función termina
  console.log("[WhatsApp] Sesión cerrada.");
}

// ── Enviar mensaje (interfaz pública) ─────────────────────────────────────────
export async function enviarMensajeWhatsApp({ telefono, mensaje }) {
  if (status !== "CONNECTED") {
    console.warn(`[WhatsApp] No conectado (estado: ${status}). Mensaje descartado para: ${telefono}`);
    return { ok: false, mock: false, error: "No conectado" };
  }
  if (messageQueue.length >= MAX_QUEUE_SIZE) {
    console.warn("[WhatsApp] Cola llena. Mensaje descartado.");
    return { ok: false, error: "Cola llena" };
  }
  const formateado = formatearTelefono(telefono);
  if (!formateado) {
    console.warn(`[WhatsApp] Teléfono inválido: ${telefono}`);
    return { ok: false, error: "Teléfono inválido" };
  }
  messageQueue.push({ phone: formateado, message: mensaje });
  console.log(`[WhatsApp] Mensaje encolado para: ${formateado}`);
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
  if (!num) return null;
  if (num.startsWith("549") && num.length === 13) return num;
  if (num.startsWith("54") && !num.startsWith("549") && num.length === 12) return "549" + num.substring(2);
  if (num.startsWith("549")) num = num.substring(3);
  else if (num.startsWith("54")) num = num.substring(2);
  if (num.startsWith("0")) num = num.substring(1);
  if (num.length === 10) return "549" + num;
  return num.length >= 10 ? num : null;
}

// ── Procesar mensaje propio (profesional se escribe a sí mismo) ───────────────
// La IA decide si es un recordatorio/tarea; si lo es, lo agrega a agenda_personal
async function procesarMensajePropio(phoneDestinatario, texto) {
  try {
    // Verificar que el número destino corresponda a un profesional registrado
    const configResult = await pool.query(
      `SELECT usuario_id, telefono_profesional
       FROM configuracion_notificaciones
       WHERE telefono_profesional IS NOT NULL AND telefono_profesional != ''
       LIMIT 50`
    );

    // Normalizar el número del JID para comparar contra la DB
    const destNorm = formatearTelefono(phoneDestinatario) || phoneDestinatario.replace(/\D/g, "");
    const destCorto = destNorm.replace(/^549/, "").replace(/^54/, "");

    console.log(`[AgendaPersonal] Buscando profesional — destNorm:${destNorm} destCorto:${destCorto} rows:${configResult.rows.length}`);
    configResult.rows.forEach(r => {
      const tn = formatearTelefono(r.telefono_profesional);
      const tc = (tn || "").replace(/^549/, "").replace(/^54/, "");
      console.log(`[AgendaPersonal]   DB tel:${r.telefono_profesional} → norm:${tn} corto:${tc}`);
    });

    const match = configResult.rows.find((row) => {
      const telNorm = formatearTelefono(row.telefono_profesional);
      if (!telNorm) return false;
      const telCorto = telNorm.replace(/^549/, "").replace(/^54/, "");
      return destNorm === telNorm || destCorto === telCorto || destCorto === telNorm || destNorm === telCorto;
    });

    if (!match) {
      console.log(`[AgendaPersonal] Número ${destNorm} no encontrado en configuracion_notificaciones. Ignorando.`);
      return;
    }

    const fechaHoy = new Date()
      .toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
      .split("/")
      .reverse()
      .map((p) => p.padStart(2, "0"))
      .join("-");

    const { esRecordatorio, evento } = await detectarYExtraerRecordatorio(texto, fechaHoy);

    console.log(`[AgendaPersonal] IA resultado — esRecordatorio:${esRecordatorio} evento:${JSON.stringify(evento)}`);

    if (!esRecordatorio || !evento?.titulo || !evento?.fecha) {
      console.log(`[AgendaPersonal] No es recordatorio o faltan campos — abortando.`);
      return;
    }

    // Normalizar hora: la IA puede devolver "HH:MM" o "HH:MM:SS" — usar solo HH:MM
    const horaNorm = (evento.hora || "09:00").substring(0, 5);
    const fechaHora = `${evento.fecha}T${horaNorm}:00-03:00`;

    const insertResult = await pool.query(
      `INSERT INTO agenda_personal
         (profesional_id, titulo, descripcion, fecha_hora, recordatorio_minutos, origen)
       VALUES ($1, $2, $3, $4, $5, 'whatsapp')
       RETURNING id`,
      [
        match.usuario_id,
        evento.titulo.substring(0, 255),
        evento.descripcion || null,
        fechaHora,
        evento.recordatorio_minutos || 30,
      ]
    );

    const eventoId = insertResult.rows[0]?.id;
    console.log(`[AgendaPersonal] INSERT OK — evento id: ${eventoId}`);

    // Crear recordatorios: 24h antes y 30 min antes.
    // Secundario: si la tabla no existe o falla, no debe impedir la confirmación.
    if (eventoId) {
      try {
        for (const minutos of [1440, 30]) {
          await pool.query(
            `INSERT INTO agenda_personal_recordatorios (evento_id, minutos_antes) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [eventoId, minutos]
          );
        }
      } catch (errRec) {
        console.error(`[AgendaPersonal] No se pudieron crear recordatorios múltiples (continuo igual): ${errRec.message}`);
      }
    }

    const fechaConfirm = new Date(fechaHora).toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const horaConfirm = horaNorm;

    const mensajeConfirmacion = `✅ *Recordatorio creado*
📌 ${evento.titulo}
📅 ${fechaConfirm} a las ${horaConfirm}
⏰ Te aviso ${evento.recordatorio_minutos || 30} minutos antes`;

    await enviarMensajeWhatsApp({
      telefono: match.telefono_profesional,
      mensaje: mensajeConfirmacion,
    });

    console.log(`[AgendaPersonal] Recordatorio creado via mensaje propio para usuario ${match.usuario_id}: "${evento.titulo}"`);
  } catch (err) {
    console.error("[AgendaPersonal] Error procesando mensaje propio:", err.message);
  }
}

// ── Procesar mensaje entrante de terceros (con prefijo /agenda) ───────────────
async function procesarMensajeEntrante(phoneRemitente, texto) {
  try {
    // Buscar si el remitente es el profesional configurado
    const configResult = await pool.query(
      `SELECT usuario_id, telefono_profesional
       FROM configuracion_notificaciones
       WHERE telefono_profesional IS NOT NULL AND telefono_profesional != ''
       LIMIT 50`
    );

    // Comparar número normalizado — igualdad exacta o sin prefijo de país
    const match = configResult.rows.find((row) => {
      const telNorm = formatearTelefono(row.telefono_profesional);
      if (!telNorm) return false;
      return (
        phoneRemitente === telNorm ||
        phoneRemitente.replace(/^549/, "") === telNorm.replace(/^549/, "")
      );
    });

    if (!match) return; // No es un profesional registrado, ignorar

    const fechaHoy = new Date()
      .toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
      .split("/")
      .reverse()
      .map((p) => p.padStart(2, "0"))
      .join("-");

    let evento;
    try {
      evento = await extraerEventoDeTexto(texto, fechaHoy);
    } catch {
      // Si la IA no pudo parsear, no responder (puede ser un mensaje casual)
      console.log(`[AgendaPersonal] No se pudo extraer evento del texto: "${texto.substring(0, 50)}"`);
      return;
    }

    // Validar que el JSON tenga al menos titulo y fecha
    if (!evento?.titulo || !evento?.fecha) return;

    const fechaHora = `${evento.fecha}T${evento.hora || "09:00"}:00-03:00`;

    await pool.query(
      `INSERT INTO agenda_personal
         (profesional_id, titulo, descripcion, fecha_hora, recordatorio_minutos)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        match.usuario_id,
        evento.titulo.substring(0, 255),
        evento.descripcion || null,
        fechaHora,
        evento.recordatorio_minutos || 30,
      ]
    );

    // Formatear fecha de confirmación en español
    const fechaConfirm = new Date(fechaHora).toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const horaConfirm = evento.hora || "09:00";

    const mensajeConfirmacion = `✅ *Evento agendado*
📌 ${evento.titulo}
📅 ${fechaConfirm} a las ${horaConfirm}
⏰ Te aviso ${evento.recordatorio_minutos || 30} minutos antes`;

    await enviarMensajeWhatsApp({
      telefono: match.telefono_profesional,
      mensaje: mensajeConfirmacion,
    });

    console.log(`[AgendaPersonal] Evento creado via WhatsApp para usuario ${match.usuario_id}: "${evento.titulo}"`);
  } catch (err) {
    console.error("[AgendaPersonal] Error procesando mensaje entrante:", err.message);
  }
}
