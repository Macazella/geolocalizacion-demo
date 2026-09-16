interface MultiSourceBadgeProps {
  listingCount: number;
  sourceNames: string[];
  agencyNames: string[];
}

// Multi-listing como valor de producto (brief P1 §29) -- nunca explica
// dedup/matching/Union-Find. "Publicado en N fuentes" (portales) se
// muestra separado de "Publicado por" (agencias reales) -- nunca se
// mezclan los dos conceptos.
export function MultiSourceBadge({ listingCount, sourceNames, agencyNames }: MultiSourceBadgeProps) {
  if (listingCount <= 1 && agencyNames.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">
      {listingCount > 1 && (
        <p className="font-medium text-foreground">
          Publicado en {listingCount} fuentes: <span className="text-muted">{sourceNames.join(" · ")}</span>
        </p>
      )}
      {agencyNames.length > 0 && (
        <p className={listingCount > 1 ? "mt-2 text-muted" : "text-muted"}>
          Publicado por: <span className="font-medium text-foreground">{agencyNames.join(" · ")}</span>
        </p>
      )}
    </div>
  );
}
