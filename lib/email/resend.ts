import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Falta RESEND_API_KEY");
    client = new Resend(apiKey);
  }
  return client;
}

// Sandbox de Resend -- hasta verificar un dominio propio (sección
// "Domains" del dashboard de Resend), este remitente SOLO puede
// entregar a la casilla con la que se creó la cuenta de Resend, no a
// cualquier usuario registrado del sitio. Cambiar por un remitente del
// dominio propio (ej. "Property Intelligence AR <alertas@tu-dominio>")
// apenas el dominio esté verificado -- ver mensaje a Maga 2026-09-29.
export const ALERTS_FROM_ADDRESS = "Property Intelligence AR <onboarding@resend.dev>";
