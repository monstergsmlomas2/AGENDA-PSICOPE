import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, downloadMediaMessage } from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { fileURLToPath } from "url";
import pool from "../config/db.js";
import { extraerEventoDeTexto, detectarYExtraerRecordatorio } from "./aiService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_BASE_PATH = path.join(__dirname, "..", "auth_info");

function getAuthPath(usuarioId) {
  const safe = String(usuarioId).replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(AUTH_BASE_PATH, safe);
}

// ── Estado por usuario ────────────────────────────────────────────────────────
// Cada usuario tiene su propia sesión de Baileys, completamente aislada: su
// socket, su estado de conexión, su QR, sus credenciales en disco/DB y su cola
// de mensajes. Nada se comparte entre usuarios — eso es lo que permite que dos
// cuentas (o más, en un SaaS) tengan WhatsApp conectado al mismo tiempo sin que
// los mensajes de una terminen saliendo por el número de la otra.
const sockets = new Map(); // usuarioId -> socket de Baileys
const statuses = new Map(); // usuarioId -> "DISCONNECTED" | "CONNECTING" | "QR_READY" | "CONNECTED" | "ERROR"
const qrCodes = new Map(); // usuarioId -> dataURL base64 | null
const connectingTimers = new Map(); // usuarioId -> Timeout
const reconnectingFlags = new Map(); // usuarioId -> boolean (evita reconexiones en cascada)
const intentionalDisconnects = new Map(); // usuarioId -> boolean (no reconectar tras logout manual)
const mensajesProcesadosPorUsuario = new Map(); // usuarioId -> Set<msgId> (anti-duplicado/anti-loop)
const sessionsLoadedFromDB = new Set(); // usuarioId — sesión ya cargada de DB una vez (evita re-sync)
const reconnectAttemptsMap = new Map(); // usuarioId -> contador backoff exponencial
const savingSessionFlags = new Map(); // usuarioId -> boolean (anti-concurrencia al guardar)

let WA_VERSION_CACHE = null; // versión de protocolo Baileys — global al proceso, no depende del usuario
const MAX_RECONNECT_DELAY_MS = 60000; // tope del backoff (1 min)

function getStatus(usuarioId) {
  return statuses.get(usuarioId) || "DISCONNECTED";
}

// Backoff exponencial: 5s, 10s, 20s, 40s, 60s (tope). Menos reconexiones en
// ráfaga = menos handshakes = menos avisos "Finalizó sincronización" en el móvil.
function nextReconnectDelay(usuarioId) {
  const attempts = reconnectAttemptsMap.get(usuarioId) || 0;
  const delay = Math.min(5000 * 2 ** attempts, MAX_RECONNECT_DELAY_MS);
  reconnectAttemptsMap.set(usuarioId, attempts + 1);
  return delay;
}

// ── Cola de mensajes con rate limit, por usuario ──────────────────────────────
const messageQueues = new Map(); // usuarioId -> [{ phone, message, reintentos }]
const MAX_QUEUE_SIZE = 1000;
const RATE_LIMIT_MS = 3000;
const sendingFlags = new Map(); // usuarioId -> boolean
const lastSendTimes = new Map(); // usuarioId -> timestamp

setInterval(async () => {
  for (const [usuarioId, queue] of messageQueues) {
    if (sendingFlags.get(usuarioId)) continue;
    if (getStatus(usuarioId) !== "CONNECTED") continue;
    if (queue.length === 0) continue;

    const last = lastSendTimes.get(usuarioId) || 0;
    if (Date.now() - last < RATE_LIMIT_MS) continue;

    const sock = sockets.get(usuarioId);
    if (!sock) continue;

    sendingFlags.set(usuarioId, true);
    const job = queue.shift();

    if (job) {
      try {
        const cleanPhone = job.phone.replace(/\D/g, "");
        // Construir JID directo sin consultar onWhatsApp (evita fallo de red que descarta el mensaje)
        const targetJid = `${cleanPhone}@s.whatsapp.net`;

        await sock.sendMessage(targetJid, { text: job.message });
        lastSendTimes.set(usuarioId, Date.now());
        console.log(`[WhatsApp:${usuarioId}] Mensaje enviado a ${job.phone}`);
      } catch (err) {
        console.error(`[WhatsApp:${usuarioId}] Error enviando a ${job.phone}:`, err.message);
        // Reintentar hasta 3 veces antes de descartar
        const reintentos = (job.reintentos || 0) + 1;
        if (reintentos < 3) {
          console.log(`[WhatsApp:${usuarioId}] Reintento ${reintentos}/3 para ${job.phone}`);
          queue.unshift({ ...job, reintentos });
        } else {
          console.error(`[WhatsApp:${usuarioId}] Descartado tras 3 intentos: ${job.phone}`);
        }
      }
    }
    sendingFlags.set(usuarioId, false);
  }
}, 1000);

// ── Sincronización sesión completa con Supabase ───────────────────────────────
// Guarda TODOS los archivos de auth_info (no solo creds.json), aislados por usuario
async function loadSessionFromDB(usuarioId) {
  const authPath = getAuthPath(usuarioId);
  try {
    const res = await pool.query(
      `SELECT filename, file_data FROM whatsapp_session WHERE usuario_id = $1`,
      [usuarioId]
    );
    if (!res.rows.length) {
      console.log(`[WhatsApp:${usuarioId}] No hay sesión guardada en DB.`);
      return;
    }
    // Limpiar el disco antes de cargar: la DB es la única fuente de verdad.
    // Evita mezclar restos de una sesión vieja con la sesión guardada.
    if (fs.existsSync(authPath)) {
      for (const f of fs.readdirSync(authPath)) {
        if (f.endsWith(".json")) fs.rmSync(path.join(authPath, f), { force: true });
      }
    } else {
      fs.mkdirSync(authPath, { recursive: true });
    }
    for (const row of res.rows) {
      fs.writeFileSync(path.join(authPath, row.filename), row.file_data, "utf-8");
    }
    console.log(`[WhatsApp:${usuarioId}] Sesión cargada desde DB (${res.rows.length} archivos).`);
  } catch (err) {
    console.error(`[WhatsApp:${usuarioId}] Error cargando sesión:`, err.message);
  }
}

async function saveSessionToDB(usuarioId) {
  // Evitar guardados concurrentes: el DELETE de uno podría pisar archivos
  // que otro acaba de escribir (creds.update se dispara en ráfaga).
  if (savingSessionFlags.get(usuarioId)) return;
  savingSessionFlags.set(usuarioId, true);
  const authPath = getAuthPath(usuarioId);
  try {
    if (!fs.existsSync(authPath)) return;
    const files = fs.readdirSync(authPath).filter((f) => f.endsWith(".json"));

    for (const filename of files) {
      const content = fs.readFileSync(path.join(authPath, filename), "utf-8");
      await pool.query(
        `
        INSERT INTO whatsapp_session (usuario_id, filename, file_data) VALUES ($1, $2, $3)
        ON CONFLICT (usuario_id, filename) DO UPDATE SET file_data = $3, updated_at = NOW()
      `,
        [usuarioId, filename, content]
      );
    }

    // Sincronizar borrados: eliminar de la DB las pre-keys/archivos que Baileys
    // ya consumió y borró del disco. Sin esto, la DB acumula claves obsoletas que
    // corrompen la sesión tras cada reinicio (Bad MAC / Invalid PreKey ID).
    if (files.length > 0) {
      await pool.query(
        `DELETE FROM whatsapp_session WHERE usuario_id = $1 AND filename <> ALL($2::text[])`,
        [usuarioId, files]
      );
    }

    console.log(`[WhatsApp:${usuarioId}] Sesión guardada en DB (${files.length} archivos, huérfanos limpiados).`);
  } catch (err) {
    console.error(`[WhatsApp:${usuarioId}] Error guardando sesión:`, err.message);
  } finally {
    savingSessionFlags.set(usuarioId, false);
  }
}

function resetAuthFolder(usuarioId) {
  const authPath = getAuthPath(usuarioId);
  try {
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      fs.mkdirSync(authPath, { recursive: true });
      console.log(`[WhatsApp:${usuarioId}] auth_info reseteado.`);
    }
  } catch (_) {}
}

// ── Iniciar conexión ──────────────────────────────────────────────────────────
export async function iniciarWhatsApp(usuarioId) {
  if (!usuarioId) {
    console.error("[WhatsApp] iniciarWhatsApp requiere usuarioId — abortando.");
    return;
  }

  // Evitar múltiples reconexiones simultáneas para este usuario
  if (reconnectingFlags.get(usuarioId)) {
    console.log(`[WhatsApp:${usuarioId}] Ya hay una reconexión en curso, ignorando.`);
    return;
  }
  reconnectingFlags.set(usuarioId, true);

  const existingTimer = connectingTimers.get(usuarioId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    connectingTimers.delete(usuarioId);
  }

  const oldSock = sockets.get(usuarioId);
  if (oldSock) {
    try { oldSock.ev.removeAllListeners(); } catch (_) {}
    try { oldSock.end(undefined); } catch (_) {}
    sockets.delete(usuarioId);
  }

  const authPath = getAuthPath(usuarioId);
  if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });

  // Cargar creds desde DB SOLO si no hay creds válidas en disco.
  // En reconexiones, las creds en disco ya están actualizadas por useMultiFileAuthState;
  // sobreescribirlas con la versión de DB desincroniza las app-state sync keys
  // y fuerza un full handshake → notificación "Finalizó sincronización" en el móvil
  // y el teléfono deja de sonar. Solo se carga de DB si el disco está vacío/corrupto.
  const localCredsPath = path.join(authPath, "creds.json");
  let hasValidLocalCreds = false;
  try {
    if (fs.existsSync(localCredsPath)) {
      const localContent = fs.readFileSync(localCredsPath, "utf-8");
      const parsed = JSON.parse(localContent);
      hasValidLocalCreds = localContent.length > 50 && parsed?.noiseKey && parsed?.signedIdentityKey;
    }
  } catch (_) {}

  if (!hasValidLocalCreds) {
    if (!sessionsLoadedFromDB.has(usuarioId)) {
      await loadSessionFromDB(usuarioId);
      sessionsLoadedFromDB.add(usuarioId);
    }
  } else {
    console.log(`[WhatsApp:${usuarioId}] Reutilizando creds locales (skip DB load — evita re-sync en móvil).`);
  }
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  // Versión de protocolo FIJA. Si cambia entre reconexiones, WhatsApp fuerza un
  // re-handshake del companion device → notificación "Finalizó sincronización" en
  // el móvil. Solo consultamos la versión más reciente la PRIMERA vez de este
  // proceso (cuando no hay sesión previa, p.ej. tras escanear QR); en reconexiones
  // reusamos exactamente la misma versión para que sea un resume, no un re-registro.
  // Es global al proceso porque es la versión del protocolo WA, no depende del usuario.
  let version = WA_VERSION_CACHE;
  if (!version) {
    try {
      ({ version } = await fetchLatestBaileysVersion());
      console.log(`[WhatsApp] Versión WA: ${version.join(".")}`);
    } catch (err) {
      version = [2, 3000, 1015901307];
      console.warn("[WhatsApp] No se pudo obtener versión de WA — usando fallback:", version.join("."));
    }
    WA_VERSION_CACHE = version;
  } else {
    console.log(`[WhatsApp:${usuarioId}] Reusando versión WA cacheada: ${version.join(".")}`);
  }

  statuses.set(usuarioId, "CONNECTING");
  qrCodes.set(usuarioId, null);
  reconnectingFlags.set(usuarioId, false);

  const connectingTimer = setTimeout(() => {
    if (getStatus(usuarioId) === "CONNECTING") {
      console.log(`[WhatsApp:${usuarioId}] Timeout esperando QR — reintentando...`);
      statuses.set(usuarioId, "DISCONNECTED");
      qrCodes.set(usuarioId, null);
      iniciarWhatsApp(usuarioId);
    }
  }, 60000);
  connectingTimers.set(usuarioId, connectingTimer);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    browser: Browsers.baileys("Chrome"),
    emitOwnEvents: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    markOnlineOnConnect: false,
    // fireInitQueries: false → no ejecutar el app-state resync al conectar.
    // Ese resync es EXACTAMENTE lo que dispara la notificación "Finalizó la
    // sincronización con WhatsApp Business" en el móvil cada vez que reconectamos.
    // Este cliente solo envía/recibe mensajes; no necesita sincronizar el estado
    // de chats/contactos, así que lo desactivamos y el aviso desaparece.
    fireInitQueries: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    // 30s = default de Baileys. Un keep-alive más agresivo (20s) aumentaba los
    // falsos "connection lost" en redes con latencia variable (Render) → cada
    // pérdida fuerza una reconexión. Menos reconexiones = menos ruido en el móvil.
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 5,
  });

  sockets.set(usuarioId, sock);

  // Guardar TODOS los archivos de auth en DB al actualizarse las credenciales
  sock.ev.on("creds.update", async () => {
    await saveCreds();
    await saveSessionToDB(usuarioId);
  });

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      try {
        qrCodes.set(usuarioId, await QRCode.toDataURL(qr));
        statuses.set(usuarioId, "QR_READY");
        console.log(`[WhatsApp:${usuarioId}] QR generado — escaneá desde Configuración.`);
      } catch {
        statuses.set(usuarioId, "ERROR");
      }
    }

    if (connection === "close") {
      const boom = new Boom(lastDisconnect?.error);
      const code = boom?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      const restartRequired = code === DisconnectReason.restartRequired;

      console.log(`[WhatsApp:${usuarioId}] Conexión cerrada — código: ${code} | ${DisconnectReason[code] ?? "desconocido"}`);

      statuses.set(usuarioId, "DISCONNECTED");
      qrCodes.set(usuarioId, null);
      const timer = connectingTimers.get(usuarioId);
      if (timer) {
        clearTimeout(timer);
        connectingTimers.delete(usuarioId);
      }

      if (intentionalDisconnects.get(usuarioId)) {
        console.log(`[WhatsApp:${usuarioId}] Desconexión intencional — no reconectar.`);
        intentionalDisconnects.set(usuarioId, false);
        return;
      }

      if (loggedOut) {
        console.log(`[WhatsApp:${usuarioId}] Sesión cerrada — limpiando credenciales.`);
        resetAuthFolder(usuarioId);
        await pool.query(`DELETE FROM whatsapp_session WHERE usuario_id = $1`, [usuarioId]);
        sessionsLoadedFromDB.delete(usuarioId); // forzar recarga limpia en el próximo arranque
        reconnectAttemptsMap.set(usuarioId, 0);
        setTimeout(() => iniciarWhatsApp(usuarioId), 3000);
      } else if (restartRequired) {
        // Normal post-QR scan: WA pide restart para activar la sesión nueva.
        // No cuenta como fallo: reconexión inmediata sin penalizar el backoff.
        console.log(`[WhatsApp:${usuarioId}] Restart post-QR — reconectando en 2s.`);
        setTimeout(() => iniciarWhatsApp(usuarioId), 2000);
      } else {
        // Fallos de red (timedOut, connectionLost, etc.): backoff exponencial.
        // Reconectar en ráfaga multiplica los handshakes y, con ellos, los avisos
        // de sincronización en el móvil. Espaciamos cada reintento.
        const delay = nextReconnectDelay(usuarioId);
        console.log(`[WhatsApp:${usuarioId}] Desconexión por red — reintento ${reconnectAttemptsMap.get(usuarioId)} en ${delay / 1000}s.`);
        setTimeout(() => iniciarWhatsApp(usuarioId), delay);
      }
    }

    if (connection === "open") {
      const timer = connectingTimers.get(usuarioId);
      if (timer) {
        clearTimeout(timer);
        connectingTimers.delete(usuarioId);
      }
      statuses.set(usuarioId, "CONNECTED");
      qrCodes.set(usuarioId, null);
      reconnectAttemptsMap.set(usuarioId, 0); // conexión OK → resetear backoff
      console.log(`[WhatsApp:${usuarioId}] Conectado correctamente.`);

      // Guardar sesión completa inmediatamente al conectar
      await saveSessionToDB(usuarioId);

      // Baileys envía un presence "unavailable" al abrir la conexión (lo hace
      // internamente porque markOnlineOnConnect=false). Eso es lo correcto: marca
      // este companion como NO presente, por lo que el móvil sigue recibiendo
      // notificaciones. No agregamos presence updates periódicos propios.
    }
  });

  // ── Escuchar mensajes ────────────────────────────────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // "notify" = mensajes entrantes nuevos; "append" = mensajes propios sincronizados
    if (type !== "notify" && type !== "append") return;

    let mensajesProcesados = mensajesProcesadosPorUsuario.get(usuarioId);
    if (!mensajesProcesados) {
      mensajesProcesados = new Set();
      mensajesProcesadosPorUsuario.set(usuarioId, mensajesProcesados);
    }

    for (const msg of messages) {
      // ── Extraer texto (texto plano o nota de voz/audio) ──────────────────
      const textoRecibido =
        msg.message?.conversation || msg.message?.extendedTextMessage?.text || null;

      const esAudio = !textoRecibido && (
        msg.message?.audioMessage || msg.message?.pttMessage
      );

      // Ignorar mensajes sin texto ni audio
      if (!textoRecibido && !esAudio) continue;

      // Anti-loop: ignorar mensajes generados por el propio bot (confirmaciones/recordatorios)
      if (textoRecibido) {
        const textoTrim = textoRecibido.trim();
        if (/^(✅|⏰|📅|📌|🔔)/.test(textoTrim) ||
            textoTrim.includes("Recordatorio creado") ||
            textoTrim.includes("Evento agendado") ||
            textoTrim.includes("Recordatorio Personal")) {
          continue;
        }
      }

      // Anti-duplicado: no procesar el mismo mensaje dos veces
      const msgId = msg.key.id;
      if (msgId) {
        if (mensajesProcesados.has(msgId)) continue;
        mensajesProcesados.add(msgId);
        if (mensajesProcesados.size > 500) {
          const primeros = [...mensajesProcesados].slice(0, 250);
          primeros.forEach((id) => mensajesProcesados.delete(id));
        }
      }

      const remoteJid = msg.key.remoteJid || "";
      const rawUserId = sock?.user?.id || "";
      const propioNumero = rawUserId.split("@")[0].split(":")[0];
      const remoteNumero = remoteJid.replace("@s.whatsapp.net", "").split(":")[0];

      const esMensajePropio =
        msg.key.fromMe ||
        (propioNumero && remoteNumero === propioNumero);

      if (esMensajePropio) {
        const numParaBuscar = msg.key.fromMe ? propioNumero : remoteNumero;

        if (esAudio) {
          // Nota de voz propia → transcribir con Groq Whisper → procesar como texto
          console.log(`[AgendaPersonal:${usuarioId}] Audio propio detectado — transcribiendo...`);
          try {
            const audioMsg = msg.message.audioMessage || msg.message.pttMessage;
            const buffer = await downloadMediaMessage(msg, "buffer", {}, {
              logger: { info: () => {}, debug: () => {}, warn: () => {}, error: () => {} },
              reuploadRequest: sock.updateMediaMessage,
            });
            const texto = await transcribirAudio(buffer, audioMsg.mimetype || "audio/ogg");
            if (!texto) {
              console.log(`[AgendaPersonal:${usuarioId}] Transcripción vacía, ignorando audio.`);
              continue;
            }
            console.log(`[AgendaPersonal:${usuarioId}] Audio transcripto: "${texto.substring(0, 80)}"`);
            await procesarMensajePropio(usuarioId, numParaBuscar || propioNumero || remoteNumero, texto);
          } catch (err) {
            console.error(`[AgendaPersonal:${usuarioId}] Error transcribiendo audio: ${err.message}`);
          }
          continue;
        }

        console.log(`[AgendaPersonal:${usuarioId}] Mensaje propio — type:${type} fromMe:${msg.key.fromMe} jid:${remoteJid} numBuscar:${numParaBuscar} texto:"${textoRecibido.substring(0, 60)}"`);
        await procesarMensajePropio(usuarioId, numParaBuscar || propioNumero || remoteNumero, textoRecibido.trim());
        continue;
      }

      // Mensajes de terceros → solo texto con prefijo explícito (no audio)
      if (!textoRecibido) continue;
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
      await procesarMensajeEntrante(usuarioId, remitente, textoProcesado);
    }
  });
}

// ── Reconectar todas las sesiones guardadas (al bootear el servidor) ─────────
export async function reconectarSesionesGuardadas() {
  try {
    const { rows } = await pool.query(`SELECT DISTINCT usuario_id FROM whatsapp_session`);
    if (!rows.length) {
      console.log("[WhatsApp] No hay sesiones guardadas para reconectar.");
      return;
    }
    console.log(`[WhatsApp] Reconectando ${rows.length} sesión(es) guardada(s)...`);
    rows.forEach(({ usuario_id }, i) => {
      // Espaciar los arranques para no saturar al bootear con muchos usuarios
      // ni disparar handshakes simultáneos que aumenten avisos de sincronización.
      setTimeout(() => {
        iniciarWhatsApp(usuario_id).catch((err) =>
          console.error(`[WhatsApp:${usuario_id}] Error reconectando:`, err.message)
        );
      }, i * 4000);
    });
  } catch (err) {
    console.error("[WhatsApp] Error reconectando sesiones guardadas:", err.message);
  }
}

// ── Cerrar sesión ─────────────────────────────────────────────────────────────
export async function cerrarSesionWhatsApp(usuarioId) {
  if (!usuarioId) return;
  resetAuthFolder(usuarioId);
  try {
    await pool.query(`DELETE FROM whatsapp_session WHERE usuario_id = $1`, [usuarioId]);
  } catch (_) {}

  const sock = sockets.get(usuarioId);
  if (sock) {
    intentionalDisconnects.set(usuarioId, true);
    try {
      await sock.logout();
    } catch (_) {}
    sockets.delete(usuarioId);
  }
  statuses.set(usuarioId, "DISCONNECTED");
  qrCodes.set(usuarioId, null);
  sessionsLoadedFromDB.delete(usuarioId); // próxima conexión recarga limpio desde cero (nuevo QR)
  // intentionalDisconnect se resetea en el handler de connection.update, no aquí,
  // porque el evento loggedOut llega de forma asíncrona después de que esta función termina
  console.log(`[WhatsApp:${usuarioId}] Sesión cerrada.`);
}

// ── Enviar mensaje (interfaz pública) ─────────────────────────────────────────
export async function enviarMensajeWhatsApp({ usuarioId, telefono, mensaje }) {
  if (!usuarioId) {
    console.warn(`[WhatsApp] enviarMensajeWhatsApp sin usuarioId — mensaje descartado para: ${telefono}`);
    return { ok: false, error: "usuarioId requerido" };
  }
  if (getStatus(usuarioId) !== "CONNECTED") {
    console.warn(`[WhatsApp:${usuarioId}] No conectado (estado: ${getStatus(usuarioId)}). Mensaje descartado para: ${telefono}`);
    return { ok: false, mock: false, error: "No conectado" };
  }
  let queue = messageQueues.get(usuarioId);
  if (!queue) {
    queue = [];
    messageQueues.set(usuarioId, queue);
  }
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn(`[WhatsApp:${usuarioId}] Cola llena. Mensaje descartado.`);
    return { ok: false, error: "Cola llena" };
  }
  const formateado = formatearTelefono(telefono);
  if (!formateado) {
    console.warn(`[WhatsApp:${usuarioId}] Teléfono inválido: ${telefono}`);
    return { ok: false, error: "Teléfono inválido" };
  }
  queue.push({ phone: formateado, message: mensaje });
  console.log(`[WhatsApp:${usuarioId}] Mensaje encolado para: ${formateado}`);
  return { ok: true, queued: true };
}

// ── Estado y QR para la UI ────────────────────────────────────────────────────
export function getEstadoWhatsApp(usuarioId) {
  const estado = getStatus(usuarioId);
  return { estado, conectado: estado === "CONNECTED" };
}

export function getQRWhatsApp(usuarioId) {
  return qrCodes.get(usuarioId) || null;
}

// Usuarios con sesión de WhatsApp activa ahora mismo — usado por los cron jobs
// para saber a quiénes procesar (cada uno enviará por su propio socket).
export function getUsuariosConectados() {
  const conectados = [];
  for (const [usuarioId, estado] of statuses) {
    if (estado === "CONNECTED") conectados.push(usuarioId);
  }
  return conectados;
}

// ── Transcribir audio con Groq Whisper ───────────────────────────────────────
async function transcribirAudio(buffer, mimeType) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error("GROQ_API_KEY no configurada");

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType || "audio/ogg" });
  formData.append("file", blob, "audio.ogg");
  formData.append("model", "whisper-large-v3");
  formData.append("language", "es");
  formData.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqApiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.text?.trim() || "";
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
// La IA decide si es un recordatorio/tarea; si lo es, lo agrega a agenda_personal.
// El usuarioId ya es conocido (es el dueño del socket que recibió el mensaje) —
// no hace falta adivinarlo por teléfono.
async function procesarMensajePropio(usuarioId, phoneDestinatario, texto) {
  try {
    const configResult = await pool.query(
      `SELECT usuario_id, telefono_profesional
       FROM configuracion_notificaciones
       WHERE usuario_id = $1
       LIMIT 1`,
      [usuarioId]
    );

    // Teléfono de confirmación: el de la config del usuario, o el JID si no hay
    const telConfirmacion =
      configResult.rows[0]?.telefono_profesional ||
      formatearTelefono(phoneDestinatario) ||
      phoneDestinatario.replace(/\D/g, "");

    console.log(`[AgendaPersonal:${usuarioId}] tel confirmación: ${telConfirmacion}`);

    const fechaHoy = new Date()
      .toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
      .split("/")
      .reverse()
      .map((p) => p.padStart(2, "0"))
      .join("-");

    const { esRecordatorio, evento } = await detectarYExtraerRecordatorio(texto, fechaHoy);

    console.log(`[AgendaPersonal:${usuarioId}] IA resultado — esRecordatorio:${esRecordatorio} evento:${JSON.stringify(evento)}`);

    if (!esRecordatorio || !evento?.titulo || !evento?.fecha) {
      console.log(`[AgendaPersonal:${usuarioId}] No es recordatorio o faltan campos — abortando.`);
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
        usuarioId,
        evento.titulo.substring(0, 255),
        evento.descripcion || null,
        fechaHora,
        evento.recordatorio_minutos || 30,
      ]
    );

    const eventoId = insertResult.rows[0]?.id;
    console.log(`[AgendaPersonal:${usuarioId}] INSERT OK — evento id: ${eventoId}`);

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
        console.error(`[AgendaPersonal:${usuarioId}] No se pudieron crear recordatorios múltiples (continuo igual): ${errRec.message}`);
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
      usuarioId,
      telefono: telConfirmacion,
      mensaje: mensajeConfirmacion,
    });

    console.log(`[AgendaPersonal:${usuarioId}] Recordatorio creado via mensaje propio: "${evento.titulo}"`);
  } catch (err) {
    console.error(`[AgendaPersonal:${usuarioId}] Error procesando mensaje propio:`, err.message);
  }
}

// ── Procesar mensaje entrante de terceros (con prefijo /agenda) ───────────────
// El socket ya pertenece a un usuario conocido (usuarioId): el remitente le
// está escribiendo AL NÚMERO DE ESE USUARIO, así que solo hace falta confirmar
// que el remitente sea el profesional configurado de esa cuenta — no buscar
// entre todas las cuentas del sistema (eso podía cruzar datos entre usuarios
// si dos números coincidían parcialmente).
async function procesarMensajeEntrante(usuarioId, phoneRemitente, texto) {
  try {
    const configResult = await pool.query(
      `SELECT usuario_id, telefono_profesional
       FROM configuracion_notificaciones
       WHERE usuario_id = $1
         AND telefono_profesional IS NOT NULL AND telefono_profesional != ''
       LIMIT 1`,
      [usuarioId]
    );

    const config = configResult.rows[0];
    if (!config) return; // Esta cuenta no tiene teléfono de profesional configurado

    const telNorm = formatearTelefono(config.telefono_profesional);
    const esElProfesional =
      telNorm &&
      (phoneRemitente === telNorm ||
        phoneRemitente.replace(/^549/, "") === telNorm.replace(/^549/, ""));

    if (!esElProfesional) return; // No es el dueño de esta cuenta, ignorar

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
      console.log(`[AgendaPersonal:${usuarioId}] No se pudo extraer evento del texto: "${texto.substring(0, 50)}"`);
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
        usuarioId,
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
      usuarioId,
      telefono: config.telefono_profesional,
      mensaje: mensajeConfirmacion,
    });

    console.log(`[AgendaPersonal:${usuarioId}] Evento creado via WhatsApp: "${evento.titulo}"`);
  } catch (err) {
    console.error(`[AgendaPersonal:${usuarioId}] Error procesando mensaje entrante:`, err.message);
  }
}
