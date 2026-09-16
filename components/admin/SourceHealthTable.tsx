// Nunca combinar health_status y search_coverage en una sola columna
// -- es exactamente el error que corrigió Fase G1 (ver
// docs/product/wireframes/04_admin_monitoring.md §25 en el repo
// privado).
const HEALTH_LABELS: Record<string, string> = {
  SUCCESS: "✓ Funcionó",
  PARTIAL_SUCCESS: "⚠ Parcial",
  BLOCKED: "✗ Bloqueada",
  FAILED: "✗ Falló",
};

const COVERAGE_LABELS: Record<string, string> = {
  COMPLETE: "Exhaustiva",
  SAMPLED: "Muestreada",
  PARTIAL: "Parcial",
  UNKNOWN: "Desconocida",
};

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  buscadorprop: "BuscadorProp",
  zonaprop: "Zonaprop",
  argenprop: "Argenprop",
};

interface SourceHealthRow {
  source_id: string;
  health_status: string;
  search_coverage: string;
  coverage_pages: number | null;
  raw_count: number | null;
}

export function SourceHealthTable({ rows }: { rows: SourceHealthRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-left text-muted">
            <th className="px-4 py-2 font-medium">Fuente</th>
            <th className="px-4 py-2 font-medium">Salud</th>
            <th className="px-4 py-2 font-medium">Cobertura de búsqueda</th>
            <th className="px-4 py-2 font-medium text-right">Páginas / resultados</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.source_id} className={i > 0 ? "border-t border-border" : ""}>
              <td className="px-4 py-2 font-medium text-foreground">
                {SOURCE_DISPLAY_NAMES[r.source_id] ?? r.source_id}
              </td>
              <td className="px-4 py-2">{HEALTH_LABELS[r.health_status] ?? r.health_status}</td>
              <td className="px-4 py-2">{COVERAGE_LABELS[r.search_coverage] ?? r.search_coverage}</td>
              <td className="px-4 py-2 text-right text-muted">
                {r.coverage_pages ?? "—"} pág. · {r.raw_count ?? "—"} resultados
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
