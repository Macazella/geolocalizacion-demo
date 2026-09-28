import { promoteGeoReviewItem, rejectGeoReviewItem } from "@/app/admin/monitoring/actions";

const REASON_LABELS: Record<string, string> = {
  NO_COORDINATES: "Sin coordenadas",
  NO_PRICE: "Sin precio",
  NO_COORDINATES_AND_NO_PRICE: "Sin coordenadas y sin precio",
};

interface GeoReviewRow {
  review_id: number;
  entity_id: string;
  url: string | null;
  source_id: string | null;
  reason: string;
}

// "Promover" acá es una anulación admin explícita -- publica igual con
// el dato incompleto que tenemos. "Rechazar" es definitivo (no vuelve
// a aparecer), pero el registro queda guardado, nunca se borra.
export function GeoReviewQueueTable({ rows }: { rows: GeoReviewRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        Nada pendiente en esta lista.
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
            <th className="px-4 py-2 font-medium">Motivo</th>
            <th className="px-4 py-2 font-medium text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.review_id} className={i > 0 ? "border-t border-border" : ""}>
              <td className="px-4 py-2 font-medium text-foreground">{r.source_id ?? "—"}</td>
              <td className="max-w-xs truncate px-4 py-2">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    {r.url}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2 text-muted">{REASON_LABELS[r.reason] ?? r.reason}</td>
              <td className="px-4 py-2">
                <div className="flex justify-end gap-2">
                  <form action={promoteGeoReviewItem.bind(null, r.review_id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white"
                    >
                      Promover igual
                    </button>
                  </form>
                  <form action={rejectGeoReviewItem.bind(null, r.review_id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface"
                    >
                      Rechazar
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
