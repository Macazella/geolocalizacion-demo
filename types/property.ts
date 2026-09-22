// Espejo TypeScript de docs/product/PUBLIC_DATA_CONTRACT_v0.1.md (repo
// privado GEOLOCALIZACION). Si el contrato cambia, este archivo cambia
// junto con el export en product_export/ -- nunca deben divergir.

export type GeoQuality = "EXACT" | "APPROXIMATE" | "LOCALITY_ONLY" | "UNVERIFIED";

export interface PublicPriceObservation {
  date: string;
  price: number;
  currency: string | null;
  change_pct: number | null;
}

export interface PublicProperty {
  public_id: string;

  tipo: string | null;
  familia_tipo: string | null;

  price: number | null;
  currency: string | null;

  province: string | null;
  partido: string | null;
  locality: string | null;

  display_address: string;

  latitude: number | null;
  longitude: number | null;
  geo_quality: GeoQuality;

  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  surface_total: number | null;

  cochera: boolean | null;
  patio: boolean | null;
  terraza: boolean | null;
  jardin: boolean | null;
  balcon: boolean | null;
  parrilla: boolean | null;

  apto_credito: boolean | null;
  expensas: number | null;
  expensas_currency: string | null;

  agency_names: string[];
  listing_count: number;
  source_names: string[];
  primary_url: string;

  price_history: PublicPriceObservation[];

  first_seen_label: string | null;
  last_updated_label: string | null;

  // 017: distancia peatonal real (no línea recta) a la estación de
  // tren más cercana -- null si no es map_eligible o si el cálculo de
  // ruta falló (nunca se sustituye por una estimación en línea recta).
  nearest_train_station: string | null;
  nearest_train_station_line: string | null;
  walk_distance_m: number | null;
}

export interface Location {
  province: string;
  partido: string;
  locality: string;
}

export const AMENITY_FIELDS = [
  "cochera",
  "patio",
  "terraza",
  "jardin",
  "balcon",
  "parrilla",
  "apto_credito",
] as const;

export type AmenityField = (typeof AMENITY_FIELDS)[number];

export const AMENITY_LABELS: Record<AmenityField, string> = {
  cochera: "Cochera",
  patio: "Patio",
  terraza: "Terraza",
  jardin: "Jardín",
  balcon: "Balcón",
  parrilla: "Parrilla",
  apto_credito: "Apto crédito",
};

export const TIPOS = ["CASA", "PH", "DEPARTAMENTO", "DUPLEX", "MONOAMBIENTE"] as const;

export interface SearchFilters {
  province?: string;
  partido?: string;
  locality?: string;
  priceMin?: number;
  priceMax?: number;
  tipos?: string[];
  ambientes?: number;
  dormitorios?: number;
  surfaceMin?: number;
  amenities?: AmenityField[];
  onlyReliableLocation?: boolean;
}
