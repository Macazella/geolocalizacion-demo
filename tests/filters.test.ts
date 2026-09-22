import { describe, expect, it } from "vitest";
import { filterProperties, isMapEligible, sortByPrice } from "@/lib/filters/filterProperties";
import type { PublicProperty } from "@/types/property";

function makeProperty(overrides: Partial<PublicProperty> = {}): PublicProperty {
  return {
    public_id: "prop_test0001",
    tipo: "CASA",
    familia_tipo: "CASA",
    price: 50000,
    currency: "USD",
    province: "Buenos Aires",
    partido: "Lomas de Zamora",
    locality: "Banfield",
    display_address: "Banfield",
    latitude: -34.75,
    longitude: -58.39,
    geo_quality: "EXACT",
    ambientes: 3,
    dormitorios: 2,
    banios: 1,
    surface_total: 80,
    cochera: null,
    patio: null,
    terraza: null,
    jardin: null,
    balcon: null,
    parrilla: null,
    apto_credito: null,
    expensas: null,
    expensas_currency: null,
    agency_names: [],
    listing_count: 1,
    source_names: ["Zonaprop"],
    primary_url: "https://example.com",
    price_history: [],
    first_seen_label: null,
    last_updated_label: null,
    nearest_train_station: null,
    nearest_train_station_line: null,
    walk_distance_m: null,
    ...overrides,
  };
}

describe("filterProperties", () => {
  it("filtra por precio mínimo y máximo", () => {
    const props = [makeProperty({ price: 30000 }), makeProperty({ price: 50000 }), makeProperty({ price: 70000 })];
    const result = filterProperties(props, { priceMin: 40000, priceMax: 60000 });
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(50000);
  });

  it("una propiedad sin precio nunca cumple un filtro de precio", () => {
    const props = [makeProperty({ price: null })];
    const result = filterProperties(props, { priceMin: 0 });
    expect(result).toHaveLength(0);
  });

  it("filtra por tipo", () => {
    const props = [makeProperty({ tipo: "CASA" }), makeProperty({ tipo: "PH" })];
    const result = filterProperties(props, { tipos: ["PH"] });
    expect(result).toHaveLength(1);
    expect(result[0].tipo).toBe("PH");
  });

  it("filtra por localidad", () => {
    const props = [makeProperty({ locality: "Banfield" }), makeProperty({ locality: "Temperley" })];
    const result = filterProperties(props, { locality: "Temperley" });
    expect(result).toHaveLength(1);
  });

  it("un amenity null NUNCA satisface un filtro que exige true", () => {
    const props = [makeProperty({ cochera: null }), makeProperty({ cochera: false }), makeProperty({ cochera: true })];
    const result = filterProperties(props, { amenities: ["cochera"] });
    expect(result).toHaveLength(1);
    expect(result[0].cochera).toBe(true);
  });

  it("sin filtro de amenities, propiedades con amenity null igual aparecen", () => {
    const props = [makeProperty({ cochera: null })];
    const result = filterProperties(props, {});
    expect(result).toHaveLength(1);
  });

  it("filtra por ambientes/dormitorios mínimos", () => {
    const props = [makeProperty({ ambientes: 1 }), makeProperty({ ambientes: 3 })];
    const result = filterProperties(props, { ambientes: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].ambientes).toBe(3);
  });

  it("onlyReliableLocation excluye LOCALITY_ONLY/UNVERIFIED", () => {
    const props = [
      makeProperty({ geo_quality: "EXACT" }),
      makeProperty({ geo_quality: "LOCALITY_ONLY" }),
      makeProperty({ geo_quality: "UNVERIFIED" }),
    ];
    const result = filterProperties(props, { onlyReliableLocation: true });
    expect(result).toHaveLength(1);
  });
});

describe("isMapEligible", () => {
  it("EXACT y APPROXIMATE son map_eligible", () => {
    expect(isMapEligible(makeProperty({ geo_quality: "EXACT" }))).toBe(true);
    expect(isMapEligible(makeProperty({ geo_quality: "APPROXIMATE" }))).toBe(true);
  });

  it("LOCALITY_ONLY y UNVERIFIED NUNCA son map_eligible", () => {
    expect(isMapEligible(makeProperty({ geo_quality: "LOCALITY_ONLY" }))).toBe(false);
    expect(isMapEligible(makeProperty({ geo_quality: "UNVERIFIED" }))).toBe(false);
  });
});

describe("sortByPrice", () => {
  it("ordena ascendente y descendente, sin precio va al final", () => {
    const props = [makeProperty({ price: 50000 }), makeProperty({ price: null }), makeProperty({ price: 30000 })];
    const asc = sortByPrice(props, "asc");
    expect(asc.map((p) => p.price)).toEqual([30000, 50000, null]);
    const desc = sortByPrice(props, "desc");
    expect(desc.map((p) => p.price)).toEqual([50000, 30000, null]);
  });
});
