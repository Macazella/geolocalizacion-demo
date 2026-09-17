"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Marca un candidato como revisado -- NUNCA lo publica. Promover un
// candidato real a properties/Golden sigue siendo un proceso manual
// aparte (Fase F, repo GEOLOCALIZACCION). Esto solo limpia la cola.
export async function markCandidateReviewed(eventId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") return;

  await supabase
    .from("monitor_events")
    .update({ reviewed_at: new Date().toISOString() })
    .eq("event_id", eventId);

  revalidatePath("/admin/monitoring");
}
