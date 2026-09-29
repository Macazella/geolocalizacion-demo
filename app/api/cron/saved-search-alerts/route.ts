import { NextResponse } from "next/server";
import { runSavedSearchAlerts } from "@/lib/email/savedSearchAlerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron llama esto con `Authorization: Bearer $CRON_SECRET` (ver
// vercel.json) una vez por día. No hay sesión de usuario involucrada
// acá, por eso la protección es por secreto compartido y no por
// RLS/is_admin() -- cualquier otro caller sin ese header exacto se
// rechaza.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSavedSearchAlerts();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
