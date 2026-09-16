// Etiquetas en español para los campos REALES de MONITOR_RUN.json.metrics
// (docs/product/wireframes/04_admin_monitoring.md documentó nombres de
// campo hipotéticos en la ronda de diseño -- los nombres reales que
// produce monitoring/engine.py son estos; se prefirió la data real por
// sobre el borrador de diseño, mismo criterio que en toda la migración
// a Postgres).
const METRIC_LABELS: Record<string, string> = {
  observed_existing_listings: "Vistas ya conocidas (Golden)",
  new_listings: "Genuinamente nuevas",
  new_property_candidates: "Candidatos de propiedad nuevos",
  new_sources_for_existing_property: "Nueva publicación de propiedad conocida",
  review_required: "Necesitan revisión manual",
  price_increases: "Subas de precio",
  price_decreases: "Bajas de precio",
  currency_changes: "Cambios de moneda",
  not_seen_this_run: "No vistas esta corrida",
  not_seen_interpretable: "No vistas, interpretable (cobertura completa)",
  not_seen_not_interpretable: "No vistas, no interpretable (cobertura parcial)",
};

const METRIC_ORDER = Object.keys(METRIC_LABELS);

interface MonitoringMetricsTableProps {
  metrics: Record<string, number>;
}

export function MonitoringMetricsTable({ metrics }: MonitoringMetricsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {METRIC_ORDER.filter((key) => key in metrics).map((key, i) => (
            <tr key={key} className={i > 0 ? "border-t border-border" : ""}>
              <td className="px-4 py-2 text-muted">{METRIC_LABELS[key]}</td>
              <td className="px-4 py-2 text-right font-medium text-foreground">{metrics[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
