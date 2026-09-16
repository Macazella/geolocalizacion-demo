import { describe, expect, it } from "vitest";
import { propertiesWithMarkerCoordinates } from "@/lib/map/mapProperties";
import { isMapEligible } from "@/lib/filters/filterProperties";
import type { PublicProperty } from "@/types/property";
import dataset from "@/data/public_demo_dataset.json";

function makeProperty(overrides: Partial<PublicProperty>): PublicProperty {
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
    latitude: null,
    longitude: null,
    geo_quality: "UNVERIFIED",
    ambientes: null,
    dormitorios: null,
    banios: null,
    surface_total: null,
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
    ...overrides,
  };
}

describe("propertiesWithMarkerCoordinates (MapView marker source)", () => {
  it("solo incluye propiedades con lat/lng no-null", () => {
    const props = [
      makeProperty({ latitude: -34.7, longitude: -58.4, geo_quality: "EXACT" }),
      makeProperty({ latitude: null, longitude: null, geo_quality: "UNVERIFIED" }),
    ];
    const result = propertiesWithMarkerCoordinates(props);
    expect(result).toHaveLength(1);
    expect(result[0].geo_quality).toBe("EXACT");
  });

  it("nunca genera marker para LOCALITY_ONLY (centroide)", () => {
    // por contrato, LOCALITY_ONLY siempre trae lat/lng=null desde el
    // export -- este test confirma que aunque alguien pasara
    // coordenadas por error, la función de marcado respeta lat/lng,
    // pero el invariante real está garantizado en el dataset (ver
    // data-contract.test.ts).
    const centroidLikeButNulled = makeProperty({ geo_quality: "LOCALITY_ONLY", latitude: null, longitude: null });
    const result = propertiesWithMarkerCoordinates([centroidLikeButNulled]);
    expect(result).toHaveLength(0);
  });

  it("nunca genera marker para UNVERIFIED", () => {
    const unverified = makeProperty({ geo_quality: "UNVERIFIED", latitude: null, longitude: null });
    expect(propertiesWithMarkerCoordinates([unverified])).toHaveLength(0);
  });

  it("sobre el dataset real: todo lo que genera marker es map_eligible", () => {
    const properties = dataset as PublicProperty[];
    const withMarkers = propertiesWithMarkerCoordinates(properties);
    expect(withMarkers.length).toBeGreaterThan(0);
    for (const p of withMarkers) {
      expect(isMapEligible(p), p.public_id).toBe(true);
    }
  });

  it("sobre el dataset real: ningún LOCALITY_ONLY/UNVERIFIED genera marker", () => {
    const properties = dataset as PublicProperty[];
    const withMarkers = propertiesWithMarkerCoordinates(properties);
    const badOnes = withMarkers.filter((p) => p.geo_quality === "LOCALITY_ONLY" || p.geo_quality === "UNVERIFIED");
    expect(badOnes).toHaveLength(0);
  });
});
