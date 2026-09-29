const REASON_LABELS: Record<string, string> = {
  SOURCE_PERMANENTLY_BLOCKED: "Fuente bloqueada",
  DUPLICATE_CONFIRMED: "Duplicado confirmado",
  DEAD_LINK: "Link caído",
  OUT_OF_SCOPE: "Fuera de zona",
  MARKET_STATUS_INACTIVE: "Reservada/vendida",
  REVIEWED_OTHER: "Revisado (otro motivo)",
};

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  buscadorprop: "BuscadorProp",
  zonaprop: "Zonaprop",
  argenprop: "Argenprop",
  remax: "Remax",
  mercadolibre: "MercadoLibre",
};

interface DiscardedItemRow {
  discarded_id: number;
  url: string;
  source_id: string | null;
  reason: string;
  detail: string | null;
  discarded_at: string;
}

// Vista de solo lectura de todo lo ya descartado de la base activa --
// pedido explicito de Maga 2026-09-29 para comparar URLs nuevas contra
// lo ya evaluado antes de volver a considerarlas. Para revertir un
// descarte puntual, se hace desde su sección original (candidatos,
// caídas, reservadas) -- acá no hay acción, es solo consulta.
export function DiscardedItemsTable({ rows, total }: { rows: DiscardedItemRow[]; total: number }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        Todavía no hay nada descartado.
      </p>
    );
  }

  const countByReason = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.reason] = (acc[r.reason] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted">
        {Object.entries(countByReason).map(([reason, count]) => (
          <span key={reason} className="rounded-full border border-border px-2 py-0.5">
            {REASON_LABELS[reason] ?? reason}: {count}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface text-left text-muted">
              <th className="px-4 py-2 font-medium">Fuente</th>
              <th className="px-4 py-2 font-medium">URL</th>
              <th className="px-4 py-2 font-medium">Motivo</th>
              <th className="px-4 py-2 font-medium">Detalle</th>
              <th className="px-4 py-2 font-medium">Descartado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.discarded_id} className={i > 0 ? "border-t border-border" : ""}>
                <td className="px-4 py-2 font-medium text-foreground">
                  {SOURCE_DISPLAY_NAMES[r.source_id ?? ""] ?? r.source_id ?? "—"}
                </td>
                <td className="max-w-xs truncate px-4 py-2">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                    {r.url}
                  </a>
                </td>
                <td className="px-4 py-2 text-muted">{REASON_LABELS[r.reason] ?? r.reason}</td>
                <td className="max-w-[12rem] truncate px-4 py-2 text-muted">{r.detail ?? "—"}</td>
                <td className="px-4 py-2 text-muted">{new Date(r.discarded_at).toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > rows.length && (
        <p className="mt-1 text-right text-xs text-muted">Mostrando los {rows.length} más recientes de {total}.</p>
      )}
    </div>
  );
}
