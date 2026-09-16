import type { PublicProperty } from "@/types/property";

/**
 * Propiedades con coordenadas utilizables para generar un marker.
 * Extraído como función pura (usada por MapView) para poder testear
 * la regla "solo map_eligible genera marker, nunca un centroide o una
 * coordenada no verificada" sin necesitar un entorno DOM/Leaflet real
 * (brief P1 §45, categoría MAP).
 */
export function propertiesWithMarkerCoordinates(properties: PublicProperty[]): PublicProperty[] {
  return properties.filter((p) => p.latitude !== null && p.longitude !== null);
}
