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

// El mismo aviso puede quedar detectado como NEW_PROPERTY_CANDIDATE en
// varias corridas de monitoring seguidas (misma URL, distinto run_id) --
// marcar reviewed_at por url en vez de por un solo event_id evita que
// las copias repetidas del mismo candidato sigan apareciendo en la cola
// después de decidir sobre él una vez.
function candidateMatch(url: string | null, eventId: number) {
  return url ? { column: "url" as const, value: url } : { column: "event_id" as const, value: eventId };
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
  detail: string | null,
  url: string | null
) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  const now = new Date().toISOString();
  const match = candidateMatch(url, eventId);
  await supabase
    .from("monitor_events")
    .update({ reviewed_at: now, review_decision: "PROMOTED" })
    .eq(match.column, match.value);

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

export async function rejectCandidate(eventId: number, url: string | null) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  const match = candidateMatch(url, eventId);
  await supabase
    .from("monitor_events")
    .update({ reviewed_at: new Date().toISOString(), review_decision: "REJECTED" })
    .eq(match.column, match.value);

  revalidatePath("/admin/monitoring");
}
