import jwt from "jsonwebtoken";

/**
 * Middleware de autenticación JWT.
 * Valida el token de Supabase en cada request protegido.
 * Extrae req.userId (UUID del usuario) del token verificado.
 */
export default function authMiddleware(req, res, next) {
  // ── 1. Extraer token del header ──
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token de autenticación requerido" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Formato de token inválido. Usar: Bearer <token>" });
  }

  const token = parts[1];

  // ── 2. Verificar token ──
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    console.error("Falta SUPABASE_JWT_SECRET en las variables de entorno");
    return res.status(500).json({ error: "Error de configuración del servidor" });
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    // Supabase Auth: el UUID del usuario está en el claim "sub"
    req.userId = decoded.sub;

    if (!req.userId) {
      return res.status(401).json({ error: "Token inválido: no contiene usuario" });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado", code: "TOKEN_EXPIRED" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido", code: "INVALID_TOKEN" });
    }
    console.error("Error al verificar token:", error);
    return res.status(500).json({ error: "Error al verificar autenticación" });
  }
}
