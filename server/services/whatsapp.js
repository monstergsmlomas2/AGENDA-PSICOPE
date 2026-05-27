import twilio from "twilio";

export function formatearTelefono(tel) {
  if (!tel) return null;
  const limpio = tel.replace(/[\s\-\(\)\+]/g, "");
  let numero;
  if (limpio.startsWith("549")) {
    // Ya tiene el 9 correcto
    numero = limpio;
  } else if (limpio.startsWith("54")) {
    // Tiene código país pero sin el 9
    numero = `549${limpio.slice(2)}`;
  } else if (limpio.startsWith("0")) {
    // Formato 0XX-XXXXXXXX
    numero = `549${limpio.slice(1)}`;
  } else {
    // Solo número local, agregar +549
    numero = `549${limpio}`;
  }
  return `whatsapp:+${numero}`;
}

export async function enviarMensajeWhatsApp({ telefono, mensaje }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from || accountSid === "your_account_sid") {
    console.warn("[WhatsApp] Twilio no configurado. Modo mock. Mensaje no enviado.");
    console.log(`[WhatsApp Mock] A: ${telefono} | Msg: ${mensaje}`);
    return { ok: true, mock: true };
  }

  const destino = formatearTelefono(telefono);
  if (!destino) {
    throw new Error("Teléfono inválido");
  }

  const client = twilio(accountSid, authToken);

  try {
    const result = await client.messages.create({
      from,
      to: destino,
      body: mensaje,
    });
    console.log(`[WhatsApp] Mensaje enviado a ${destino}: SID ${result.sid}`);
    return { ok: true, sid: result.sid };
  } catch (error) {
    console.error("[WhatsApp] Error al enviar mensaje:", error.message);
    throw error;
  }
}
