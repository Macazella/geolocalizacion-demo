"use client";

import type { AmenityField, Location, SearchFilters } from "@/types/property";
import { AMENITY_FIELDS, AMENITY_LABELS, TIPOS } from "@/types/property";
import { tipoLabel } from "@/lib/formatters/format";
import { GlideSelect } from "@/components/reactbits/GlideSelect";
import { CheckboxLineList } from "@/components/reactbits/CheckboxLineList";

interface FilterPanelProps {
  locations: Location[];
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FilterPanel({ locations, filters, onChange }: FilterPanelProps) {
  // Cruzado por provincia (y partido, para localidad) -- sin esto, se
  // podia elegir una localidad de otra provincia/partido que la ya
  // fijada (ej. venir de Provincia=CABA y elegir "Lanus Oeste", que es
  // de Buenos Aires) y terminar con un combo imposible que siempre da
  // 0 resultados, con un mensaje que parece de calidad de datos en vez
  // de "tus filtros se contradicen".
  const provinces = [...new Set(locations.map((l) => l.province))];
  const partidos = [...new Set(
    locations.filter((l) => !filters.province || l.province === filters.province).map((l) => l.partido)
  )];
  const localities = locations
    .filter((l) => !filters.province || l.province === filters.province)
    .filter((l) => !filters.partido || l.partido === filters.partido)
    .map((l) => l.locality);

  function toggleTipo(tipo: string) {
    const current = filters.tipos ?? [];
    const next = current.includes(tipo) ? current.filter((t) => t !== tipo) : [...current, tipo];
    onChange({ ...filters, tipos: next });
  }

  function toggleAmenity(field: string) {
    const current = filters.amenities ?? [];
    const value = field as AmenityField;
    const next = current.includes(value) ? current.filter((a) => a !== value) : [...current, value];
    onChange({ ...filters, amenities: next });
  }

  const hasActiveFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v != null && v !== ""
  );

  return (
    <div className="space-y-5">
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-sm font-medium text-brand-dark hover:underline"
        >
          Borrar filtros
        </button>
      )}

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Provincia</legend>
        <GlideSelect
          ariaLabel="Provincia"
          placeholder="Todas"
          value={filters.province ?? ""}
          options={[{ value: "", label: "Todas" }, ...provinces.map((p) => ({ value: p, label: p }))]}
          onChange={(v) => onChange({ ...filters, province: v || undefined, partido: undefined, locality: undefined })}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Partido</legend>
        <GlideSelect
          ariaLabel="Partido"
          placeholder="Todos"
          value={filters.partido ?? ""}
          options={[{ value: "", label: "Todos" }, ...partidos.map((p) => ({ value: p, label: p }))]}
          onChange={(v) => onChange({ ...filters, partido: v || undefined, locality: undefined })}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Localidad</legend>
        <GlideSelect
          ariaLabel="Localidad"
          placeholder="Todas"
          value={filters.locality ?? ""}
          options={[{ value: "", label: "Todas" }, ...localities.map((l) => ({ value: l, label: l }))]}
          onChange={(v) => onChange({ ...filters, locality: v || undefined })}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Precio (USD)</legend>
        <div className="flex gap-2">
          <input
            type="number"
            aria-label="Precio mínimo"
            placeholder="Mín"
            value={filters.priceMin ?? ""}
            onChange={(e) => onChange({ ...filters, priceMin: e.target.value ? Number(e.target.value) : undefined })}
            className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            type="number"
            aria-label="Precio máximo"
            placeholder="Máx"
            value={filters.priceMax ?? ""}
            onChange={(e) => onChange({ ...filters, priceMax: e.target.value ? Number(e.target.value) : undefined })}
            className="w-1/2 rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Tipo</legend>
        <CheckboxLineList
          items={TIPOS.map((tipo) => ({ value: tipo, label: tipoLabel(tipo) }))}
          checkedValues={filters.tipos ?? []}
          onToggle={toggleTipo}
        />
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Ambientes (mín.)</legend>
        <input
          type="number"
          min={1}
          value={filters.ambientes ?? ""}
          onChange={(e) => onChange({ ...filters, ambientes: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Dormitorios (mín.)</legend>
        <input
          type="number"
          min={1}
          value={filters.dormitorios ?? ""}
          onChange={(e) => onChange({ ...filters, dormitorios: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Superficie mín. (m²)</legend>
        <input
          type="number"
          min={0}
          value={filters.surfaceMin ?? ""}
          onChange={(e) => onChange({ ...filters, surfaceMin: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Características</legend>
        <CheckboxLineList
          items={AMENITY_FIELDS.map((field) => ({ value: field, label: AMENITY_LABELS[field] }))}
          checkedValues={filters.amenities ?? []}
          onToggle={toggleAmenity}
        />
      </fieldset>
    </div>
  );
}
