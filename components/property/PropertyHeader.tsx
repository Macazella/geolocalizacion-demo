import type { PublicProperty } from "@/types/property";
import { formatHeading, formatPrice, geoQualityBadge } from "@/lib/formatters/format";
import { FavoriteButton } from "@/components/property/FavoriteButton";

interface PropertyHeaderProps {
  property: PublicProperty;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{formatHeading(property.tipo, property.locality)}</h1>
        <p className="mt-1 text-xl font-bold text-brand-dark">{formatPrice(property.price, property.currency)}</p>
        <p className="mt-1 text-sm text-muted">
          {property.display_address} · {geoQualityBadge(property.geo_quality)}
        </p>
        {property.first_seen_label && <p className="mt-1 text-xs text-muted">{property.first_seen_label}</p>}
      </div>
      <FavoriteButton publicId={property.public_id} size="lg" />
    </div>
  );
}
