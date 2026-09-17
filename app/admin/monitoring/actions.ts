"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return profile?.role === "ADMIN";
}

// "Promover" NUNCA publica el candidato -- solo lo anota en
// review_queue (pendientes) para que se evalue a mano en la próxima
// certificación del Golden (Fase F, repo GEOLOCALIZACCION). Ese
// proceso -- matching de identidad, geocodificación, checksums --
// sigue siendo manual, a propósito.
export async function promoteCandidate(
  eventId: number,
  entityId: string,
  source: string,
  detail: string | null
) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  const now = new Date().toISOString();
  await supabase
    .from("monitor_events")
    .update({ reviewed_at: now, review_decision: "PROMOTED" })
    .eq("event_id", eventId);

  await supabase.from("review_queue").insert({
    entity_type: "PROPERTY",
    entity_id: entityId,
    priority: "P2",
    review_category: "NEW_CANDIDATE",
    reason: `Candidato detectado en ${source}${detail ? ` (${detail})` : ""} -- pendiente de certificación Fase F.`,
    status: "OPEN",
  });

  revalidatePath("/admin/monitoring");
}

export async function rejectCandidate(eventId: number) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  await supabase
    .from("monitor_events")
    .update({ reviewed_at: new Date().toISOString(), review_decision: "REJECTED" })
    .eq("event_id", eventId);

  revalidatePath("/admin/monitoring");
}
