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
// varias corridas de monitoring seguidas -- Zonaprop (y otros) agregan
// parámetros de tracking a la URL (?n_src=Listado&n_pos=23) que cambian
// según la posición en el buscador aunque sea el mismo aviso, así que
// comparar la URL exacta no alcanza -- se compara solo la parte antes
// del "?". Trae los event_id que matchean y los actualiza a todos de
// una, para que ninguna variante de tracking del mismo aviso quede
// pendiente después de decidir sobre él una vez.
async function matchingEventIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  url: string | null,
  fallbackEventId: number
): Promise<number[]> {
  if (!url) return [fallbackEventId];
  const canonicalPrefix = url.split("?")[0];

  const { data } = await supabase
    .from("monitor_events")
    .select("event_id, url")
    .eq("event_type", "NEW_PROPERTY_CANDIDATE")
    .is("reviewed_at", null);

  const matches = (data ?? []).filter((e) => e.url?.split("?")[0] === canonicalPrefix);
  return matches.length > 0 ? matches.map((e) => e.event_id) : [fallbackEventId];
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
  const eventIds = await matchingEventIds(supabase, url, eventId);
  await supabase
    .from("monitor_events")
    .update({ reviewed_at: now, review_decision: "PROMOTED" })
    .in("event_id", eventIds);

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

  const eventIds = await matchingEventIds(supabase, url, eventId);
  await supabase
    .from("monitor_events")
    .update({ reviewed_at: new Date().toISOString(), review_decision: "REJECTED" })
    .in("event_id", eventIds);

  revalidatePath("/admin/monitoring");
}
