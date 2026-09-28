import { promoteReviewRequired, rejectReviewRequired } from "@/app/admin/monitoring/actions";

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  buscadorprop: "BuscadorProp",
  zonaprop: "Zonaprop",
  argenprop: "Argenprop",
  remax: "Remax",
};

interface RelatedProperty {
  property_id: string;
  street: string | null;
  number: string | null;
  current_price: number | null;
  currency: string | null;
  tipo_detalle: string | null;
}

interface ReviewRequiredRow {
  event_id: number;
  listing_id: string | null;
  source_id: string | null;
  url: string | null;
  detail: string | null;
  observed_at: string;
  related_property_id: string | null;
}

function formatRelatedProperty(p: RelatedProperty | undefined): string {
  if (!p) return "sin sugerencia (evento anterior a esta función)";
  const address = [p.street, p.number].filter(Boolean).join(" ") || "sin dirección";
  const price = p.current_price ? `${p.currency ?? ""} ${p.current_price.toLocaleString("es-AR")}` : "sin precio";
  return `${p.tipo_detalle ?? "—"} en ${address} — ${price}`;
}

// REVIEW_REQUIRED: el candidato nuevo podría ser la MISMA propiedad que
// related_property (score de coincidencia bajo el umbral de alta
// confianza, ver monitoring/matching.py) -- nunca se decide solo.
// "Es la misma" descarta el candidato (ya está representado);
// "Es otra propiedad" lo trata como candidato nuevo genuino (mismo
// circuito que un NEW_PROPERTY_CANDIDATE común).
export function ReviewRequiredTable({
  rows,
  relatedProperties,
}: {
  rows: ReviewRequiredRow[];
  relatedProperties: Record<string, RelatedProperty>;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        No hay coincidencias ambiguas pendientes de revisión.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-left text-muted">
            <th className="px-4 py-2 font-medium">Candidato nuevo</th>
            <th className="px-4 py-2 font-medium">Posible coincidencia en la base</th>
            <th className="px-4 py-2 font-medium">Detectado</th>
            <th className="px-4 py-2 font-medium text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const entityId = r.listing_id ?? r.url ?? String(r.event_id);
            const related = r.related_property_id ? relatedProperties[r.related_property_id] : undefined;
            return (
              <tr key={r.event_id} className={i > 0 ? "border-t border-border" : ""}>
                <td className="max-w-xs px-4 py-2">
                  <div className="font-medium text-foreground">
                    {SOURCE_DISPLAY_NAMES[r.source_id ?? ""] ?? r.source_id ?? "—"}
                  </div>
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-brand hover:underline"
                    >
                      {r.url}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 text-muted">{formatRelatedProperty(related)}</td>
                <td className="px-4 py-2 text-muted">{new Date(r.observed_at).toLocaleString("es-AR")}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-col items-end gap-2">
                    <form
                      action={promoteReviewRequired.bind(
                        null,
                        r.event_id,
                        entityId,
                        r.source_id ?? "desconocida",
                        r.detail,
                        r.url
                      )}
                    >
                      <button
                        type="submit"
                        className="rounded-md border border-brand px-3 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white"
                      >
                        Es otra propiedad
                      </button>
                    </form>
                    <form action={rejectReviewRequired.bind(null, r.event_id, r.url)}>
                      <button
                        type="submit"
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface"
                      >
                        Es la misma
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
