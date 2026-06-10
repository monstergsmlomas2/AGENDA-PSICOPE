import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import pacientesRoutes from "./routes/pacientes.js";
import turnosRoutes from "./routes/turnos.js";
import consultoriosRoutes from "./routes/consultorios.js";
import obrasSocialesRoutes from "./routes/obrasSociales.js";
import informesRoutes from "./routes/informes.js";
import evaluacionesRoutes from "./routes/evaluaciones.js";
import pagosRoutes from "./routes/pagos.js";
import analyticsRoutes from "./routes/analytics.js";
import configuracionRouter from "./routes/configuracion.js";
import driveRoutes, { handleGoogleCallback } from "./routes/drive.js";
import calendarRoutes from "./routes/calendar.js";
import whatsappRoutes from "./routes/whatsapp.js";
import iaRoutes from "./routes/ia.js";
import agendaPersonalRoutes from "./routes/agendaPersonal.js";
import pushRoutes from "./routes/push.js";
import adminRoutes from "./routes/admin.js";
import pool from "./config/db.js";
import { iniciarJob } from "./jobs/recordatorios.js";
import { iniciarJobPersonal } from "./jobs/recordatoriosPersonales.js";
import { reconectarSesionesGuardadas } from "./services/whatsapp.js";
import authMiddleware from "./middleware/auth.js";

dotenv.config();

const app = express();

app.use(helmet());

// Limita peticiones por IP. Endpoints costosos (IA, WhatsApp) usan límites más estrictos.
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
const limiterIA = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes a IA. Intentá de nuevo en unos minutos." },
});
const limiterWhatsapp = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de WhatsApp. Intentá de nuevo en unos minutos." },
});
app.use(limiterGeneral);

app.use(cors({
  origin: [
    'http://localhost:5173',
    /\.vercel\.app$/,
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Ruta pública — health check
app.get("/", (req, res) => {
  res.send("Agenda Psicope API funcionando");
});

// Keep-alive liviano para evitar que Render hiberne el servicio (plan Free).
// Un pinger externo (UptimeRobot / cron-job.org) golpea esto cada ~10 min para
// que Baileys no se re-vincule a WhatsApp y deje de avisar "sincronización".
app.get("/keepalive", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Ruta de test solo disponible en desarrollo
if (process.env.NODE_ENV !== "production") {
  app.get("/test-db", async (req, res) => {
    try {
      const result = await pool.query("SELECT NOW()");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Error de conexión a BD", detalle: error.message });
    }
  });
}

// ── Middleware de autenticación en todas las rutas de API ──
app.use("/pacientes", authMiddleware, pacientesRoutes);
app.use("/turnos", authMiddleware, turnosRoutes);
app.use("/consultorios", authMiddleware, consultoriosRoutes);
app.use("/obras-sociales", authMiddleware, obrasSocialesRoutes);
app.use("/informes", authMiddleware, informesRoutes);
app.use("/evaluaciones", authMiddleware, evaluacionesRoutes);
app.use("/pagos", authMiddleware, pagosRoutes);
app.use("/analytics", authMiddleware, analyticsRoutes);
app.use("/configuracion", authMiddleware, configuracionRouter);
app.use("/drive", authMiddleware, driveRoutes);
app.use("/calendar", authMiddleware, calendarRoutes);
app.use("/whatsapp", authMiddleware, limiterWhatsapp, whatsappRoutes);
app.use("/ia", authMiddleware, limiterIA, iaRoutes);
app.use("/agenda-personal", authMiddleware, agendaPersonalRoutes);
app.use("/push", authMiddleware, pushRoutes);
// Rutas de admin del número central del sistema. NO usan authMiddleware: tienen su
// propio guard por ADMIN_SECRET (header x-admin-secret). Invisibles para los usuarios.
app.use("/admin", adminRoutes);
app.get("/auth/google/callback", handleGoogleCallback);

// Middleware global de errores — última línea de defensa para excepciones no capturadas en rutas
app.use((err, req, res, next) => {
  console.error("[Error no manejado]", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: "Error interno del servidor" });
});

pool.on("error", (err) => {
  console.error("[Pool PG] Error inesperado en cliente inactivo:", err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  iniciarJob();
  iniciarJobPersonal();
  reconectarSesionesGuardadas().catch(err => console.error("[WhatsApp] Error al reconectar sesiones:", err));
});
