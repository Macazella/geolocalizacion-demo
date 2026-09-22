const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  buscadorprop: "BuscadorProp",
  zonaprop: "Zonaprop",
  argenprop: "Argenprop",
};

interface LikelyDeadListingRow {
  listing_id: string;
  property_id: string | null;
  source_id: string | null;
  url: string | null;
  liveness_detail: string | null;
  liveness_checked_at: string | null;
}

// Solo LIKELY_DEAD -- es una inferencia (pagina generica tipo fallback
// institucional de la inmobiliaria), no un hecho. Los CONFIRMED_DEAD
// (404 real) ya se ocultan solos de la demo publica y no necesitan
// revision manual aca. Ver db/check_listing_liveness.py (repo privado).
export function LikelyDeadListingsTable({ rows }: { rows: LikelyDeadListingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        No hay publicaciones marcadas como posiblemente caídas.
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
            <th className="px-4 py-2 font-medium">Último chequeo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.listing_id} className={i > 0 ? "border-t border-border" : ""}>
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
              <td className="px-4 py-2 text-muted">{r.liveness_detail ?? "—"}</td>
              <td className="px-4 py-2 text-muted">
                {r.liveness_checked_at ? new Date(r.liveness_checked_at).toLocaleString("es-AR") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
