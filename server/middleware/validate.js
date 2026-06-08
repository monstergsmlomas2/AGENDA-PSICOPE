// Middleware genérico de validación de body con esquemas zod.
// En error de parseo, responde 400 con el primer mensaje del esquema.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const primero = result.error.issues[0];
      return res.status(400).json({ error: `${primero.path.join(".")}: ${primero.message}` });
    }
    req.body = result.data;
    next();
  };
}
