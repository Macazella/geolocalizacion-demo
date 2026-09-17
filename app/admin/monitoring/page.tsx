import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SummaryTile } from "@/components/admin/SummaryTile";
import { MonitoringMetricsTable } from "@/components/admin/MonitoringMetricsTable";
import { SourceHealthTable } from "@/components/admin/SourceHealthTable";
import { PendingCandidatesTable } from "@/components/admin/PendingCandidatesTable";
import { CoverageDisclaimer } from "@/components/admin/CoverageDisclaimer";
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

  const [{ data: sourceHealth }, { data: pendingCandidates }] = await Promise.all([
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
      .order("observed_at", { ascending: false }),
  ]);

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
        <h2 className="font-semibold text-foreground">
          Candidatos nuevos pendientes de revisión ({pendingCandidates?.length ?? 0})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Detectados por el scraper, todavía sin identidad confirmada — marcarlos como
          revisados no los publica en la demo.
        </p>
        <div className="mt-3">
          <PendingCandidatesTable rows={pendingCandidates ?? []} />
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
