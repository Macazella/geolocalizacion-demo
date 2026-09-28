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
  fallbackEventId: number,
  eventType: string = "NEW_PROPERTY_CANDIDATE"
): Promise<number[]> {
  if (!url) return [fallbackEventId];
  const canonicalPrefix = url.split("?")[0];

  const { data } = await supabase
    .from("monitor_events")
    .select("event_id, url")
    .eq("event_type", eventType)
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

// Dispara .github/workflows/promote_candidates.yml (repo privado
// GEOLOCALIZACCION) por workflow_dispatch -- ese workflow corre el
// pipeline incremental completo (Fases 0-7) sobre todo lo que este
// dashboard ya marco como "Promovido" (review_queue). Nunca corre nada
// acá: Vercel no puede ejecutar el pipeline Python, solo pide a GitHub
// que lo corra. GH_DISPATCH_TOKEN es un fine-grained PAT (scope
// "actions: read and write" sobre ese repo) cargado como env var de
// Vercel -- nunca en el código.
export async function dispatchCandidatePromotion(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return { ok: false, error: "No autorizado." };
  }

  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    return { ok: false, error: "Falta configurar GH_DISPATCH_TOKEN en Vercel." };
  }

  const res = await fetch(
    "https://api.github.com/repos/Macazella/GEOLOCALIZACION-Propiedades-Private/actions/workflows/promote_candidates.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `GitHub respondió ${res.status}: ${body.slice(0, 300)}` };
  }

  return { ok: true };
}

// geo_review_queue (db/schema/032) -- triage de datos geograficos
// incompletos (sin coordenadas y/o sin precio), separado a proposito
// de la cola de identidad (review_queue): acá nunca se decide "es la
// misma propiedad", solo "se puede publicar con los datos que
// tenemos". PROPERTY = ya está en `properties` pero quedó oculta
// (public_eligible=false) por el hueco; CANDIDATE = todavía es un
// aviso pendiente en monitor_events que va a tener el mismo problema
// si se promueve tal cual.
async function markGeoReview(reviewId: number, status: "PROMOTED" | "REJECTED") {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  const { data: item } = await supabase
    .from("geo_review_queue")
    .select("entity_type, entity_id, url")
    .eq("review_id", reviewId)
    .maybeSingle();
  if (!item) return;

  const now = new Date().toISOString();

  if (item.entity_type === "PROPERTY") {
    // "Promover" acá es una anulación admin explícita de la regla
    // automática de calidad (Public Data Contract) -- se publica igual
    // pese al hueco, a criterio humano caso por caso. "Rechazar" solo
    // confirma que quede afuera (ya lo estaba) mismo criterio.
    await supabase
      .from("properties")
      .update({ public_eligible: status === "PROMOTED" })
      .eq("property_id", item.entity_id);
  } else {
    const eventIds = await matchingEventIds(supabase, item.url, -1);
    const realIds = eventIds.filter((id) => id !== -1);
    if (realIds.length > 0) {
      await supabase
        .from("monitor_events")
        .update({ reviewed_at: now, review_decision: status === "PROMOTED" ? "PROMOTED" : "REJECTED" })
        .in("event_id", realIds);
    }
    if (status === "PROMOTED") {
      await supabase.from("review_queue").insert({
        entity_type: "PROPERTY",
        entity_id: item.entity_id,
        priority: "P2",
        review_category: "NEW_CANDIDATE",
        reason: `Promovido desde geo_review_queue pese a datos incompletos -- ${item.url ?? "sin URL"}.`,
        status: "OPEN",
      });
    }
  }

  await supabase
    .from("geo_review_queue")
    .update({ status, decided_at: now })
    .eq("review_id", reviewId);

  revalidatePath("/admin/monitoring");
}

export async function promoteGeoReviewItem(reviewId: number) {
  await markGeoReview(reviewId, "PROMOTED");
}

export async function rejectGeoReviewItem(reviewId: number) {
  await markGeoReview(reviewId, "REJECTED");
}

// "Publicaciones posiblemente caídas" (LikelyDeadListingsTable) nunca
// tuvo accion -- era solo informativa, Maga tenia que confirmar a ojo
// y no habia forma de que quedara resuelto. liveness_status ya
// distingue LIKELY_DEAD (inferencia, sigue visible en la demo) de
// CONFIRMED_DEAD (oculto de la vista publica, ver 019_listing_liveness.sql) --
// estos botones solo mueven manualmente esa MISMA clasificacion que ya
// usa el chequeo automatico semanal, ninguna logica nueva.
async function markListingLiveness(listingId: string, status: "CONFIRMED_DEAD" | "ALIVE") {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  await supabase
    .from("listings")
    .update({
      liveness_status: status,
      liveness_checked_at: new Date().toISOString(),
      liveness_detail: status === "CONFIRMED_DEAD" ? "confirmado_manual_admin" : "revisado_manual_admin_sigue_viva",
    })
    .eq("listing_id", listingId);

  revalidatePath("/admin/monitoring");
}

export async function confirmListingDead(listingId: string) {
  await markListingLiveness(listingId, "CONFIRMED_DEAD");
}

export async function confirmListingAlive(listingId: string) {
  await markListingLiveness(listingId, "ALIVE");
}

// REVIEW_REQUIRED (monitoring/matching.py::REVIEW_PROPERTY_MATCH):
// candidato nuevo cuya identidad podria coincidir con una Property YA
// EXISTENTE (related_property_id, migracion 033) -- nunca se fuerza el
// vinculo solo, un humano tiene que mirar los dos lados y decidir. A
// diferencia de un NEW_PROPERTY_CANDIDATE comun, acá "Rechazar" no
// significa "descartar el aviso" sino "es la misma propiedad, no hace
// falta agregarla de nuevo" -- y "Promover" significa "no, es otra
// propiedad distinta", mismo circuito que promoteCandidate (Fases 0-7
// vuelven a correr el matcher real antes de escribir nada en Golden).
export async function promoteReviewRequired(
  eventId: number,
  entityId: string,
  source: string,
  detail: string | null,
  url: string | null
) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  const now = new Date().toISOString();
  const eventIds = await matchingEventIds(supabase, url, eventId, "REVIEW_REQUIRED");
  await supabase
    .from("monitor_events")
    .update({ reviewed_at: now, review_decision: "PROMOTED" })
    .in("event_id", eventIds);

  await supabase.from("review_queue").insert({
    entity_type: "PROPERTY",
    entity_id: entityId,
    priority: "P2",
    review_category: "NEW_CANDIDATE",
    reason: `Candidato de ${source}${detail ? ` (${detail})` : ""} -- confirmado a mano como propiedad distinta pese a la coincidencia posible, pendiente de certificación Fase F.`,
    status: "OPEN",
  });

  revalidatePath("/admin/monitoring");
}

export async function rejectReviewRequired(eventId: number, url: string | null) {
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) return;

  const eventIds = await matchingEventIds(supabase, url, eventId, "REVIEW_REQUIRED");
  await supabase
    .from("monitor_events")
    .update({ reviewed_at: new Date().toISOString(), review_decision: "REJECTED" })
    .in("event_id", eventIds);

  revalidatePath("/admin/monitoring");
}
