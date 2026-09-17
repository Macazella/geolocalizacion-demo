import { markCandidateReviewed } from "@/app/admin/monitoring/actions";

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  buscadorprop: "BuscadorProp",
  zonaprop: "Zonaprop",
  argenprop: "Argenprop",
};

interface PendingCandidateRow {
  event_id: number;
  source_id: string | null;
  url: string | null;
  detail: string | null;
  observed_at: string;
}

// Marcar revisado NUNCA publica un candidato -- solo lo saca de esta
// cola. Promoverlo de verdad a properties/Golden sigue siendo un
// proceso manual aparte (Fase F, repo GEOLOCALIZACCION).
export function PendingCandidatesTable({ rows }: { rows: PendingCandidateRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        No hay candidatos nuevos pendientes de revisión.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-left text-muted">
            <th className="px-4 py-2 font-medium">Fuente</th>
            <th className="px-4 py-2 font-medium">URL</th>
            <th className="px-4 py-2 font-medium">Detalle</th>
            <th className="px-4 py-2 font-medium">Detectado</th>
            <th className="px-4 py-2 font-medium text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.event_id} className={i > 0 ? "border-t border-border" : ""}>
              <td className="px-4 py-2 font-medium text-foreground">
                {SOURCE_DISPLAY_NAMES[r.source_id ?? ""] ?? r.source_id ?? "—"}
              </td>
              <td className="max-w-xs truncate px-4 py-2">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    {r.url}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2 text-muted">{r.detail ?? "—"}</td>
              <td className="px-4 py-2 text-muted">{new Date(r.observed_at).toLocaleString("es-AR")}</td>
              <td className="px-4 py-2 text-right">
                <form action={markCandidateReviewed.bind(null, r.event_id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface"
                  >
                    Marcar revisado
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
