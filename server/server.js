import express from "express";
import cors from "cors";
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
import whatsappRoutes from "./routes/whatsapp.js";
import iaRoutes from "./routes/ia.js";
import agendaPersonalRoutes from "./routes/agendaPersonal.js";
import pool from "./config/db.js";
import { iniciarJob } from "./jobs/recordatorios.js";
import { iniciarJobPersonal } from "./jobs/recordatoriosPersonales.js";
import { iniciarWhatsApp } from "./services/whatsapp.js";
import authMiddleware from "./middleware/auth.js";

dotenv.config();

const app = express();

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
app.use("/whatsapp", authMiddleware, whatsappRoutes);
app.use("/ia", authMiddleware, iaRoutes);
app.use("/agenda-personal", authMiddleware, agendaPersonalRoutes);
app.get("/auth/google/callback", handleGoogleCallback);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  iniciarJob();
  iniciarJobPersonal();
  iniciarWhatsApp().catch(err => console.error("[WhatsApp] Error al iniciar:", err));
});
