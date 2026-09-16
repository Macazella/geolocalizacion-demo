import type { PublicProperty } from "@/types/property";
import { AMENITY_FIELDS, AMENITY_LABELS } from "@/types/property";

interface AttributeListProps {
  property: PublicProperty;
}

// Campos estructurales (ambientes/dormitorios/banios/superficie): si
// son null, muestran "No informado" para mantener el layout de grilla
// (brief P1 §28). Amenities: si son null, se OMITEN directamente.
export function AttributeList({ property }: AttributeListProps) {
  const structural: Array<[string, string | number]> = [
    ["Ambientes", property.ambientes ?? "No informado"],
    ["Dormitorios", property.dormitorios ?? "No informado"],
    ["Baños", property.banios ?? "No informado"],
    ["Superficie", property.surface_total !== null ? `${property.surface_total} m²` : "No informado"],
  ];

  const amenities = AMENITY_FIELDS.filter((field) => property[field] === true);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {structural.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {amenities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {amenities.map((field) => (
            <span key={field} className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark">
              {AMENITY_LABELS[field]} ✓
            </span>
          ))}
        </div>
      )}

      {property.expensas !== null && (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
          Expensas: {new Intl.NumberFormat("es-AR").format(property.expensas)}
          {property.expensas_currency ? ` ${property.expensas_currency}` : ""}
        </p>
      )}
    </div>
  );
}
