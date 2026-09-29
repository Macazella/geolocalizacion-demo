import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, ALERTS_FROM_ADDRESS } from "@/lib/email/resend";
import { getAllProperties } from "@/lib/data/properties";
import { filterProperties, searchParamsFromFilters, summarizeFilters } from "@/lib/filters/filterProperties";
import { formatPrice } from "@/lib/formatters/format";
import type { PublicProperty, SearchFilters } from "@/types/property";
import type { AlertFrequency } from "@/lib/savedSearches/useSavedSearches";

const FREQUENCY_INTERVAL_MS: Record<"DAILY" | "WEEKLY" | "MONTHLY", number> = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://geolocalizacion-demo1.vercel.app";

interface SavedSearchRow {
  search_id: number;
  user_id: string;
  filters: SearchFilters;
  alert_frequency: AlertFrequency | null;
  last_alerted_at: string | null;
}

// IMMEDIATE todavía no está implementado acá -- requiere engancharse al
// momento en que el pipeline (repo GEOLOCALIZACCION) promueve un
// candidato nuevo, no a un cron periódico como este (Vercel Hobby corre
// como máximo 1 vez por día). Se deja la fila intacta (nunca se le pisa
// last_alerted_at) hasta que ese enganche exista.
function isDue(search: SavedSearchRow, now: Date): boolean {
  if (search.alert_frequency === "IMMEDIATE" || !search.alert_frequency) return false;
  if (!search.last_alerted_at) return true;
  const elapsed = now.getTime() - new Date(search.last_alerted_at).getTime();
  return elapsed >= FREQUENCY_INTERVAL_MS[search.alert_frequency];
}

function propertyLink(publicId: string): string {
  return `${SITE_URL}/propiedad/${publicId}`;
}

function searchLink(filters: SearchFilters): string {
  const qs = searchParamsFromFilters(filters).toString();
  return `${SITE_URL}/buscar${qs ? `?${qs}` : ""}`;
}

function renderDigestHtml(filters: SearchFilters, matches: PublicProperty[]): string {
  const rows = matches
    .slice(0, 12)
    .map(
      (p) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
            <a href="${propertyLink(p.public_id)}" style="color:#0f766e;font-weight:600;text-decoration:none;">
              ${p.display_address}
            </a>
            <div style="color:#111827;font-weight:600;">${formatPrice(p.price, p.currency)}</div>
            <div style="color:#6b7280;font-size:13px;">${p.locality ?? ""}</div>
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#111827;">Encontramos ${matches.length} propiedad${matches.length === 1 ? "" : "es"} nueva${matches.length === 1 ? "" : "s"}</h2>
      <p style="color:#6b7280;">Para tu búsqueda guardada: <strong>${summarizeFilters(filters)}</strong></p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin-top:24px;">
        <a href="${searchLink(filters)}" style="color:#0f766e;">Ver todos los resultados</a>
      </p>
      <p style="margin-top:32px;color:#9ca3af;font-size:12px;">
        Property Intelligence AR — Podés cambiar la frecuencia o borrar esta alerta desde
        <a href="${SITE_URL}/busquedas-guardadas" style="color:#9ca3af;">tus búsquedas guardadas</a>.
      </p>
    </div>`;
}

export interface SavedSearchAlertsResult {
  checked: number;
  sent: number;
  skippedNoEmail: number;
  errors: { search_id: number; error: string }[];
}

/**
 * Corre una vez por día (cron de Vercel, ver vercel.json) y decide caso
 * por caso si cada búsqueda guardada con alerta activa ya está "vencida"
 * según su frecuencia (isDue) -- así una sola corrida diaria cubre
 * DIARIA/SEMANAL/MENSUAL sin depender de que Vercel permita crons más
 * frecuentes que 1/día (plan Hobby). En la primera corrida de una
 * búsqueda (last_alerted_at null) nunca se manda el estado actual
 * completo como si fuera "nuevo" -- solo arranca el reloj, para no
 * bombardear con todo lo que ya existía antes de guardar la búsqueda.
 */
export async function runSavedSearchAlerts(): Promise<SavedSearchAlertsResult> {
  const admin = createAdminClient();
  const now = new Date();

  const { data: searchesData, error: searchesError } = await admin
    .from("saved_searches")
    .select("search_id, user_id, filters, alert_frequency, last_alerted_at")
    .eq("alert_enabled", true);
  if (searchesError) throw new Error(`saved_searches: ${searchesError.message}`);

  const searches = (searchesData ?? []) as SavedSearchRow[];
  const due = searches.filter((s) => isDue(s, now));

  const result: SavedSearchAlertsResult = { checked: due.length, sent: 0, skippedNoEmail: 0, errors: [] };
  if (due.length === 0) return result;

  const allProperties = await getAllProperties();

  // first_seen_label -- pese al nombre, en la DB/vista es el timestamp
  // crudo (ver lib/data/properties.ts), acá se usa sin formatear para
  // comparar contra last_alerted_at.
  const { data: rawRows } = await admin
    .from("public_properties")
    .select("public_id, first_seen_label")
    .eq("search_enabled", true);
  const firstSeenByPublicId = new Map<string, string>(
    ((rawRows ?? []) as { public_id: string; first_seen_label: string | null }[])
      .filter((r) => r.first_seen_label)
      .map((r) => [r.public_id, r.first_seen_label as string])
  );

  const userIds = [...new Set(due.map((s) => s.user_id))];
  const { data: profilesData } = await admin.from("profiles").select("user_id, email").in("user_id", userIds);
  const emailByUserId = new Map(
    ((profilesData ?? []) as { user_id: string; email: string }[]).map((p) => [p.user_id, p.email])
  );

  const resend = getResendClient();

  for (const search of due) {
    try {
      const isFirstRun = !search.last_alerted_at;
      const matching = filterProperties(allProperties, search.filters);
      const newMatches = isFirstRun
        ? []
        : matching.filter((p) => {
            const firstSeen = firstSeenByPublicId.get(p.public_id);
            return firstSeen ? firstSeen > search.last_alerted_at! : false;
          });

      if (newMatches.length > 0) {
        const email = emailByUserId.get(search.user_id);
        if (email) {
          await resend.emails.send({
            from: ALERTS_FROM_ADDRESS,
            to: email,
            subject: `${newMatches.length} propiedad${newMatches.length === 1 ? "" : "es"} nueva${newMatches.length === 1 ? "" : "s"} para vos`,
            html: renderDigestHtml(search.filters, newMatches),
          });
          result.sent += 1;
        } else {
          result.skippedNoEmail += 1;
        }
      }

      await admin.from("saved_searches").update({ last_alerted_at: now.toISOString() }).eq("search_id", search.search_id);
    } catch (e) {
      result.errors.push({ search_id: search.search_id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return result;
}
