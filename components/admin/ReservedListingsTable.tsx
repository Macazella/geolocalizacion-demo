import { markListingActiveAgain } from "@/app/admin/monitoring/actions";

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  buscadorprop: "BuscadorProp",
  zonaprop: "Zonaprop",
  argenprop: "Argenprop",
  remax: "Remax",
};

const STATUS_LABELS: Record<string, string> = {
  RESERVED: "Reservada",
  SOLD: "Vendida",
};

interface ReservedListingRow {
  listing_id: string;
  property_id: string | null;
  source_id: string | null;
  url: string | null;
  market_status: string | null;
  market_status_checked_at: string | null;
}

// Propiedades que el chequeo automatico (cada 12hs, GEOLOCALIZACCION/db/
// check_remax_market_status.py) ya saco del mapa publico porque el
// propio sitio las marca "Reservada"/vendida -- pedido explicito de
// Maga: un lugar para confirmar a ojo. "Sigue activa" es la unica
// accion que hace falta -- corrige un falso positivo (ej. el vendedor
// la reactivo); no hay accion para "confirmar reservada" porque no
// cambia nada, ya esta correctamente oculta.
export function ReservedListingsTable({ rows }: { rows: ReservedListingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        No hay publicaciones ocultas por reservada/vendida.
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
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Último chequeo</th>
            <th className="px-4 py-2 font-medium text-right">Acción</th>
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
              <td className="px-4 py-2 text-muted">{STATUS_LABELS[r.market_status ?? ""] ?? r.market_status ?? "—"}</td>
              <td className="px-4 py-2 text-muted">
                {r.market_status_checked_at ? new Date(r.market_status_checked_at).toLocaleString("es-AR") : "—"}
              </td>
              <td className="px-4 py-2">
                <div className="flex justify-end">
                  <form action={markListingActiveAgain.bind(null, r.listing_id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white"
                    >
                      Sigue activa
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
