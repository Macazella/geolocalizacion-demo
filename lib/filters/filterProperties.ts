import type { AmenityField, PublicProperty, SearchFilters } from "@/types/property";

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
