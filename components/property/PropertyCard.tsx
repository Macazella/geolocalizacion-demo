import Link from "next/link";
import type { PublicProperty } from "@/types/property";
import { formatHeading, formatPrice, geoQualityBadge } from "@/lib/formatters/format";
import { FavoriteButton } from "@/components/property/FavoriteButton";

interface PropertyCardProps {
  property: PublicProperty;
}

// Solo se muestran atributos NO-null (brief P1 §26) -- nunca "Cochera:
// No" cuando el dato es null.
export function PropertyCard({ property }: PropertyCardProps) {
  const attributes: string[] = [];
  if (property.ambientes !== null) attributes.push(`${property.ambientes} amb`);
  if (property.dormitorios !== null) attributes.push(`${property.dormitorios} dorm`);
  if (property.surface_total !== null) attributes.push(`${property.surface_total} m²`);
  if (property.cochera === true) attributes.push("cochera");
  if (property.patio === true) attributes.push("patio");
  if (property.terraza === true) attributes.push("terraza");
  if (property.apto_credito === true) attributes.push("apto crédito");

  return (
    <Link
      href={`/propiedad/${property.public_id}`}
      className="block rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-brand hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground">{formatHeading(property.tipo, property.locality)}</h3>
          <p className="mt-0.5 text-lg font-bold text-brand-dark">{formatPrice(property.price, property.currency)}</p>
        </div>
        <FavoriteButton publicId={property.public_id} />
      </div>

      <p className="mt-1 text-sm text-muted">{property.display_address}</p>
      <p className="mt-0.5 text-xs text-muted">{geoQualityBadge(property.geo_quality)}</p>

      {attributes.length > 0 && <p className="mt-2 text-sm text-foreground">{attributes.join(" · ")}</p>}

      {property.listing_count > 1 && (
        <p className="mt-2 inline-block rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark">
          Publicado en {property.listing_count} fuentes
        </p>
      )}
    </Link>
  );
}
