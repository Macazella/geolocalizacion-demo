"use client";

import type { AmenityField, Location, SearchFilters } from "@/types/property";
import { AMENITY_FIELDS, AMENITY_LABELS, TIPOS } from "@/types/property";
import { tipoLabel } from "@/lib/formatters/format";

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

  function toggleAmenity(field: AmenityField) {
    const current = filters.amenities ?? [];
    const next = current.includes(field) ? current.filter((a) => a !== field) : [...current, field];
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
        <select
          value={filters.province ?? ""}
          onChange={(e) =>
            onChange({ ...filters, province: e.target.value || undefined, partido: undefined, locality: undefined })
          }
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Partido</legend>
        <select
          value={filters.partido ?? ""}
          onChange={(e) => onChange({ ...filters, partido: e.target.value || undefined, locality: undefined })}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {partidos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-foreground">Localidad</legend>
        <select
          value={filters.locality ?? ""}
          onChange={(e) => onChange({ ...filters, locality: e.target.value || undefined })}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {localities.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
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
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((tipo) => (
            <label key={tipo} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={(filters.tipos ?? []).includes(tipo)}
                onChange={() => toggleTipo(tipo)}
                className="h-4 w-4 rounded border-border text-brand"
              />
              {tipoLabel(tipo)}
            </label>
          ))}
        </div>
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
        <div className="flex flex-col gap-1.5">
          {AMENITY_FIELDS.map((field) => (
            <label key={field} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={(filters.amenities ?? []).includes(field)}
                onChange={() => toggleAmenity(field)}
                className="h-4 w-4 rounded border-border text-brand"
              />
              {AMENITY_LABELS[field]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
