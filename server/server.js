import express from "express";
import cors from "cors";
import pacientesRoutes from "./routes/pacientes.js";
import turnosRoutes from "./routes/turnos.js";
import consultoriosRoutes from "./routes/consultorios.js";
import obrasSocialesRoutes from "./routes/obrasSociales.js";
import informesRoutes from "./routes/informes.js";
import evaluacionesRoutes from "./routes/evaluaciones.js";
import pagosRoutes from "./routes/pagos.js";
import analyticsRoutes from "./routes/analytics.js";
import configuracionRouter from "./routes/configuracion.js";
import pool from "./config/db.js";
import { iniciarJob } from "./jobs/recordatorios.js";

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

// Rutas
app.use("/turnos", turnosRoutes);
app.use("/pacientes", pacientesRoutes);
app.use("/consultorios", consultoriosRoutes);
app.use("/obras-sociales", obrasSocialesRoutes);
app.use("/informes", informesRoutes);
app.use("/evaluaciones", evaluacionesRoutes);
app.use("/pagos", pagosRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/configuracion", configuracionRouter);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  iniciarJob();
});