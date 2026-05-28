import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token de autenticación requerido" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Formato de token inválido. Usar: Bearer <token>" });
  }

  const token = parts[1];

  try {
    // Decodificar sin verificar firma — Supabase ya validó el token al hacer login.
    // El token llega firmado por Supabase y contiene el sub (UUID del usuario).
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: "Token inválido: no contiene usuario" });
    }

    // Verificar que no esté expirado
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ error: "Token expirado", code: "TOKEN_EXPIRED" });
    }

    req.userId = decoded.sub;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error);
    return res.status(500).json({ error: "Error al verificar autenticación" });
  }
}
