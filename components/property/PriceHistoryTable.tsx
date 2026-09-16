import type { PublicPriceObservation } from "@/types/property";
import { formatChangePct, formatDateEs } from "@/lib/formatters/format";

interface PriceHistoryTableProps {
  history: PublicPriceObservation[];
}

// §31: 0 observaciones -> el bloque ni se renderiza (el padre decide
// eso). 1 -> una fila sin variación. 2+ -> tabla completa. Nunca se
// inventan puntos para "que se vea mejor".
export function PriceHistoryTable({ history }: PriceHistoryTableProps) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 font-semibold text-foreground">Historial de precio</h2>
      <table className="w-full text-sm">
        <tbody>
          {history.map((obs, i) => {
            const change = formatChangePct(obs.change_pct);
            return (
              <tr key={i} className="border-t border-border first:border-t-0">
                <td className="py-2 text-muted">{formatDateEs(obs.date)}</td>
                <td className="py-2 font-medium text-foreground">
                  {obs.currency ?? ""} {new Intl.NumberFormat("es-AR").format(obs.price)}
                </td>
                <td className={`py-2 text-right ${obs.change_pct && obs.change_pct > 0 ? "text-red-600" : obs.change_pct && obs.change_pct < 0 ? "text-green-600" : "text-muted"}`}>
                  {change ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
