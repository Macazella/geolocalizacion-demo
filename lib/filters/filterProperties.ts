import type { AmenityField, PublicProperty, SearchFilters } from "@/types/property";
import { tipoLabel } from "@/lib/formatters/format";

/**
 * Regla no negociable (brief P1 §24, ya certificada en el motor
 * privado): si el usuario exige un amenity = true, un valor `null`
 * (no informado) NUNCA lo satisface. Pero `null` tampoco se convierte
 * en `false` en ningún otro contexto -- acá solo importa para decidir
 * si la propiedad pasa el filtro, nunca se reescribe el dato.
 */
function matchesAmenities(property: PublicProperty, amenities?: AmenityField[]): boolean {
  if (!amenities || amenities.length === 0) return true;
  return amenities.every((field) => property[field] === true);
}

function matchesLocality(property: PublicProperty, filters: SearchFilters): boolean {
  if (filters.locality && property.locality !== filters.locality) return false;
  if (filters.partido && property.partido !== filters.partido) return false;
  if (filters.province && property.province !== filters.province) return false;
  return true;
}

function matchesPrice(property: PublicProperty, filters: SearchFilters): boolean {
  if (property.price === null) return false; // sin precio utilizable, no puede cumplir un filtro de precio
  if (filters.priceMin !== undefined && property.price < filters.priceMin) return false;
  if (filters.priceMax !== undefined && property.price > filters.priceMax) return false;
  return true;
}

function matchesTipo(property: PublicProperty, filters: SearchFilters): boolean {
  if (!filters.tipos || filters.tipos.length === 0) return true;
  return property.tipo !== null && filters.tipos.includes(property.tipo);
}

function matchesAmbientes(property: PublicProperty, filters: SearchFilters): boolean {
  if (filters.ambientes === undefined) return true;
  return property.ambientes !== null && property.ambientes >= filters.ambientes;
}

function matchesDormitorios(property: PublicProperty, filters: SearchFilters): boolean {
  if (filters.dormitorios === undefined) return true;
  return property.dormitorios !== null && property.dormitorios >= filters.dormitorios;
}

function matchesSurface(property: PublicProperty, filters: SearchFilters): boolean {
  if (filters.surfaceMin === undefined) return true;
  return property.surface_total !== null && property.surface_total >= filters.surfaceMin;
}

function matchesReliableLocation(property: PublicProperty, filters: SearchFilters): boolean {
  if (!filters.onlyReliableLocation) return true;
  return property.geo_quality === "EXACT" || property.geo_quality === "APPROXIMATE";
}

export function filterProperties(properties: PublicProperty[], filters: SearchFilters): PublicProperty[] {
  return properties.filter(
    (p) =>
      matchesLocality(p, filters) &&
      matchesPrice(p, filters) &&
      matchesTipo(p, filters) &&
      matchesAmbientes(p, filters) &&
      matchesDormitorios(p, filters) &&
      matchesSurface(p, filters) &&
      matchesAmenities(p, filters.amenities) &&
      matchesReliableLocation(p, filters)
  );
}

export function isMapEligible(property: PublicProperty): boolean {
  return property.geo_quality === "EXACT" || property.geo_quality === "APPROXIMATE";
}

export function sortByPrice(properties: PublicProperty[], direction: "asc" | "desc" = "asc"): PublicProperty[] {
  const withPrice = properties.filter((p) => p.price !== null);
  const withoutPrice = properties.filter((p) => p.price === null);
  withPrice.sort((a, b) => (direction === "asc" ? a.price! - b.price! : b.price! - a.price!));
  return [...withPrice, ...withoutPrice];
}

// Misma codificación que usa ResultsView para reflejar los filtros en
// la URL de /buscar -- se comparte acá para que una búsqueda guardada
// (lib/savedSearches) pueda armar el mismo link "Ver resultados" sin
// duplicar el formato.
export function filtersFromSearchParams(params: URLSearchParams): SearchFilters {
  return {
    province: params.get("province") ?? undefined,
    partido: params.get("partido") ?? undefined,
    locality: params.get("locality") ?? undefined,
    priceMin: params.get("priceMin") ? Number(params.get("priceMin")) : undefined,
    priceMax: params.get("priceMax") ? Number(params.get("priceMax")) : undefined,
    tipos: params.get("tipos") ? params.get("tipos")!.split(",") : undefined,
    amenities: params.get("amenities") ? (params.get("amenities")!.split(",") as AmenityField[]) : undefined,
  };
}

export function searchParamsFromFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.province) params.set("province", filters.province);
  if (filters.partido) params.set("partido", filters.partido);
  if (filters.locality) params.set("locality", filters.locality);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.tipos?.length) params.set("tipos", filters.tipos.join(","));
  if (filters.amenities?.length) params.set("amenities", filters.amenities.join(","));
  return params;
}

// Resumen legible de un set de filtros, para mostrar en la lista de
// búsquedas guardadas (nunca se muestra el jsonb crudo al usuario).
export function summarizeFilters(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.tipos?.length) parts.push(filters.tipos.map(tipoLabel).join("/"));

  const place = filters.locality || filters.partido || filters.province;
  if (place) parts.push(place);

  if (filters.priceMin != null || filters.priceMax != null) {
    const min = filters.priceMin != null ? `USD ${filters.priceMin.toLocaleString("es-AR")}` : null;
    const max = filters.priceMax != null ? `USD ${filters.priceMax.toLocaleString("es-AR")}` : null;
    if (min && max) parts.push(`${min} - ${max}`);
    else if (min) parts.push(`desde ${min}`);
    else if (max) parts.push(`hasta ${max}`);
  }

  if (filters.ambientes) parts.push(`${filters.ambientes}+ ambientes`);
  if (filters.dormitorios) parts.push(`${filters.dormitorios}+ dormitorios`);
  if (filters.surfaceMin) parts.push(`${filters.surfaceMin}+ m²`);

  return parts.length > 0 ? parts.join(" · ") : "Todas las propiedades";
}
