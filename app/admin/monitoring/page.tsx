import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SummaryTile } from "@/components/admin/SummaryTile";
import { MonitoringMetricsTable } from "@/components/admin/MonitoringMetricsTable";
import { SourceHealthTable } from "@/components/admin/SourceHealthTable";
import { PendingCandidatesTable } from "@/components/admin/PendingCandidatesTable";
import { LikelyDeadListingsTable } from "@/components/admin/LikelyDeadListingsTable";
import { CoverageDisclaimer } from "@/components/admin/CoverageDisclaimer";
import { ProcessPromotedButton } from "@/components/admin/ProcessPromotedButton";
import { GeoReviewQueueTable } from "@/components/admin/GeoReviewQueueTable";
import { ReviewRequiredTable } from "@/components/admin/ReviewRequiredTable";
import { createClient } from "@/lib/supabase/server";

// Página dinámica (depende de la sesión) -- igual que /login, aislada:
// no afecta el ISR del resto del sitio. Ver docs/product/wireframes/
// 04_admin_monitoring.md (repo privado) para el diseño original.
export default async function AdminMonitoringPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Unauthorized reason="Necesitás iniciar sesión para ver esta página." />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "ADMIN") {
    return <Unauthorized reason="Esta página es solo para administradores." />;
  }

  const [{ count: propertiesCount }, { count: listingsCount }, { data: runs }] =
    await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }),
      supabase
        .from("monitor_runs")
        .select("run_id, started_at, finished_at, metrics")
        .order("started_at", { ascending: false })
        .limit(1),
    ]);

  const latestRun = runs?.[0];

  if (!latestRun) {
    return (
      <Shell propertiesCount={propertiesCount} listingsCount={listingsCount}>
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Todavía no hay corridas de monitoring registradas.
        </p>
      </Shell>
    );
  }

  const PENDING_CANDIDATES_PAGE_SIZE = 50;
  // Techo solo para la TABLA (mostrar los 50 mas viejos primero, ver
  // mas abajo) -- el TOTAL ya no se calcula sobre esta muestra (bug
  // real encontrado 2026-09-27: con el backlog crudo por encima de
  // este techo, los candidatos mas nuevos quedaban siempre afuera de
  // la muestra ordenada por mas-viejo-primero, asi que el numero
  // mostrado se congelaba y nunca reflejaba corridas nuevas). El total
  // ahora sale de pending_candidates_count() (db/schema/029), un
  // conteo real hecho en Postgres, deduplicado por URL sin query
  // string, sin traer filas a la aplicacion.
  const PENDING_CANDIDATES_FETCH_CAP = 1000;
  const [
    { data: sourceHealth },
    { data: rawPendingEvents },
    { data: likelyDeadListings },
    { data: pendingCandidatesTotalRaw },
    { count: promotedPendingCount },
  ] = await Promise.all([
      supabase
        .from("source_health_snapshots")
        .select("source_id, health_status, search_coverage, coverage_pages, raw_count")
        .eq("run_id", latestRun.run_id)
        .order("source_id"),
      supabase
        .from("monitor_events")
        .select("event_id, property_id, source_id, url, detail, observed_at")
        .eq("event_type", "NEW_PROPERTY_CANDIDATE")
        .is("reviewed_at", null)
        // Mas antiguos primero (no mas recientes): la tabla de abajo
        // vacia el backlog en orden, mismo criterio de siempre -- solo
        // afecta que se ve en la tabla, ya no el total mostrado arriba.
        .order("observed_at", { ascending: true })
        .limit(PENDING_CANDIDATES_FETCH_CAP),
      // Solo LIKELY_DEAD -- inferencia (pagina generica), nunca
      // CONFIRMED_DEAD (404 real, ya se oculta solo de la demo publica,
      // no necesita revision). Ver db/check_listing_liveness.py.
      supabase
        .from("listings")
        .select("listing_id, property_id, source_id, url, liveness_detail, liveness_checked_at")
        .eq("liveness_status", "LIKELY_DEAD")
        .order("liveness_checked_at", { ascending: false }),
      supabase.rpc("pending_candidates_count"),
      // "Promovidos" en este dashboard = fila en review_queue con
      // review_category NEW_CANDIDATE, status OPEN -- ver
      // actions.ts::promoteCandidate. El botón dispara el pipeline
      // (Fases 0-7, repo GEOLOCALIZACCION) sobre exactamente esto.
      supabase
        .from("review_queue")
        .select("*", { count: "exact", head: true })
        .eq("review_category", "NEW_CANDIDATE")
        .eq("status", "OPEN"),
    ]);

  // geo_review_queue (db/schema/032) -- triage de datos geograficos
  // incompletos, separado de la identidad. PROPERTY = ya esta en la
  // base pero oculta por el hueco (ej. Adrogue sin coordenadas);
  // CANDIDATE = todavia pendiente, va a tener el mismo problema si se
  // promueve tal cual.
  const [{ data: geoReviewProperties }, { data: geoReviewCandidates }] = await Promise.all([
    supabase
      .from("geo_review_queue")
      .select("review_id, entity_id, url, source_id, reason")
      .eq("entity_type", "PROPERTY")
      .eq("status", "OPEN")
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("geo_review_queue")
      .select("review_id, entity_id, url, source_id, reason")
      .eq("entity_type", "CANDIDATE")
      .eq("status", "OPEN")
      .order("created_at", { ascending: true })
      .limit(50),
  ]);
  const [{ count: geoReviewPropertiesTotal }, { count: geoReviewCandidatesTotal }] = await Promise.all([
    supabase
      .from("geo_review_queue")
      .select("*", { count: "exact", head: true })
      .eq("entity_type", "PROPERTY")
      .eq("status", "OPEN"),
    supabase
      .from("geo_review_queue")
      .select("*", { count: "exact", head: true })
      .eq("entity_type", "CANDIDATE")
      .eq("status", "OPEN"),
  ]);

  // REVIEW_REQUIRED (monitoring/matching.py::REVIEW_PROPERTY_MATCH):
  // candidato nuevo cuya identidad podria coincidir con una Property YA
  // EXISTENTE -- nunca se decide solo. related_property_id (migracion
  // 033) puede ser null para eventos de ANTES de esa migracion (los 4
  // que ya estaban pendientes) -- la tabla lo maneja mostrando "sin
  // sugerencia" en vez de romper. Mismo patron de conteo real
  // deduplicado que pending_candidates_count() (029), ver 034.
  const [{ data: rawReviewRequiredEvents }, { data: reviewRequiredTotalRaw }] = await Promise.all([
    supabase
      .from("monitor_events")
      .select("event_id, listing_id, source_id, url, detail, observed_at, related_property_id")
      .eq("event_type", "REVIEW_REQUIRED")
      .is("reviewed_at", null)
      .order("observed_at", { ascending: true })
      .limit(200),
    supabase.rpc("review_required_count"),
  ]);
  const seenReviewUrls = new Set<string>();
  const reviewRequiredEvents = (rawReviewRequiredEvents ?? []).filter((e) => {
    if (!e.url) return true;
    const canonicalPrefix = e.url.split("?")[0];
    if (seenReviewUrls.has(canonicalPrefix)) return false;
    seenReviewUrls.add(canonicalPrefix);
    return true;
  });
  const reviewRequiredTotal = reviewRequiredTotalRaw ?? reviewRequiredEvents.length;

  const relatedPropertyIds = Array.from(
    new Set(reviewRequiredEvents.map((e) => e.related_property_id).filter((id): id is string => Boolean(id)))
  );
  const { data: relatedPropertyRows } =
    relatedPropertyIds.length > 0
      ? await supabase
          .from("properties")
          .select("property_id, street, number, current_price, currency, tipo_detalle")
          .in("property_id", relatedPropertyIds)
      : { data: [] };
  const relatedProperties = Object.fromEntries((relatedPropertyRows ?? []).map((p) => [p.property_id, p]));

  // Se deduplica por la URL sin query string -- Zonaprop (y otros)
  // agregan parámetros de tracking (?n_src=Listado&n_pos=23) que
  // cambian según la posición en el buscador aunque sea el mismo aviso;
  // comparar la URL completa dejaba pasar esas variantes como si fueran
  // candidatos distintos. Ver misma lógica en actions.ts::matchingEventIds.
  // (Esto sigue existiendo solo para la TABLA de 50 filas -- el total
  // ya no depende de esta dedup en memoria, ver pendingCandidatesTotal.)
  const seenUrls = new Set<string>();
  const dedupedPendingEvents = (rawPendingEvents ?? []).filter((e) => {
    if (!e.url) return true; // sin URL no hay como deduplicar, se muestra igual
    const canonicalPrefix = e.url.split("?")[0];
    if (seenUrls.has(canonicalPrefix)) return false;
    seenUrls.add(canonicalPrefix);
    return true;
  });
  const pendingCandidatesTotal = pendingCandidatesTotalRaw ?? dedupedPendingEvents.length;
  const pendingCandidates = dedupedPendingEvents.slice(0, PENDING_CANDIDATES_PAGE_SIZE);

  const blockedSources = (sourceHealth ?? [])
    .filter((r) => r.health_status === "BLOCKED" || r.health_status === "FAILED")
    .map((r) => r.source_id);

  return (
    <Shell propertiesCount={propertiesCount} listingsCount={listingsCount}>
      <section>
        <h2 className="font-semibold text-foreground">Última corrida — {latestRun.run_id}</h2>
        <p className="mt-1 text-sm text-muted">
          {new Date(latestRun.started_at).toLocaleString("es-AR")}
        </p>
        <div className="mt-3">
          <MonitoringMetricsTable metrics={latestRun.metrics as Record<string, number>} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">Salud de fuentes</h2>
        <div className="mt-3">
          <SourceHealthTable rows={sourceHealth ?? []} />
        </div>
      </section>

      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Candidatos nuevos pendientes de revisión ({pendingCandidatesTotal})
            </h2>
            <p className="mt-1 text-sm text-muted">
              Detectados por el scraper, todavía sin identidad confirmada — marcarlos como
              revisados no los publica en la demo. El mismo aviso agrupa todas sus detecciones
              repetidas en una sola fila.
              {pendingCandidatesTotal > PENDING_CANDIDATES_PAGE_SIZE && (
                <>
                  {" "}Mostrando los {PENDING_CANDIDATES_PAGE_SIZE} más antiguos primero — promové o
                  rechazá estos para ver los siguientes.
                </>
              )}
            </p>
          </div>
          <ProcessPromotedButton disabled={!promotedPendingCount} />
        </div>
        <p className="mt-1 text-right text-xs text-muted">
          {promotedPendingCount ?? 0} promovido{promotedPendingCount === 1 ? "" : "s"} esperando a
          procesarse en la base.
        </p>
        <div className="mt-3">
          <PendingCandidatesTable rows={pendingCandidates} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">
          Coincidencias ambiguas con la base ({reviewRequiredTotal})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Candidatos nuevos cuya identidad podría coincidir con una propiedad que ya está en la
          base — el puntaje no alcanza para vincularlos solo. &quot;Es la misma&quot; descarta el
          candidato (queda guardado, no se borra); &quot;Es otra propiedad&quot; la trata como
          candidato nuevo genuino.
        </p>
        <div className="mt-3">
          <ReviewRequiredTable rows={reviewRequiredEvents} relatedProperties={relatedProperties} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">
          Publicaciones posiblemente caídas ({likelyDeadListings?.length ?? 0})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Detectadas por el chequeo semanal de liveness al visitar la URL real del aviso — no se
          ocultan solas de la demo (es una inferencia, no un 404 confirmado), abrí el link para
          confirmar a ojo.
        </p>
        <div className="mt-3">
          <LikelyDeadListingsTable rows={likelyDeadListings ?? []} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">
          Datos incompletos — ya en la base ({geoReviewPropertiesTotal ?? 0})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Propiedades que ya están en la base pero quedaron ocultas del sitio público porque les
          falta coordenadas y/o precio (la fuente no trae dirección estructurada). &quot;Promover
          igual&quot; las publica pese al hueco; &quot;Rechazar&quot; las excluye para siempre
          (el registro queda guardado, no se borra).
        </p>
        <div className="mt-3">
          <GeoReviewQueueTable rows={geoReviewProperties ?? []} />
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-foreground">
          Datos incompletos — candidatos pendientes ({geoReviewCandidatesTotal ?? 0})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Avisos todavía sin promover que, con los datos que se pudieron extraer, van a tener el
          mismo problema (sin coordenadas y/o sin precio) si se promueven tal cual.
        </p>
        <div className="mt-3">
          <GeoReviewQueueTable rows={geoReviewCandidates ?? []} />
        </div>
      </section>

      <CoverageDisclaimer blockedSources={blockedSources} />
    </Shell>
  );
}

function Shell({
  propertiesCount,
  listingsCount,
  children,
}: {
  propertiesCount: number | null;
  listingsCount: number | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        <h1 className="text-xl font-bold text-foreground">Monitoring (Admin)</h1>
        <div className="grid grid-cols-2 gap-4">
          <SummaryTile label="Properties" value={propertiesCount ?? "—"} />
          <SummaryTile label="Listings" value={listingsCount ?? "—"} />
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Unauthorized({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-foreground">No autorizado</h1>
        <p className="mt-2 text-sm text-muted">{reason}</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Iniciar sesión
        </Link>
      </main>
      <Footer />
    </div>
  );
}
