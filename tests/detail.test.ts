import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { getAllPublicIds, getPropertyById } from "@/lib/data/properties";
import { AttributeList } from "@/components/property/AttributeList";
import { MultiSourceBadge } from "@/components/property/MultiSourceBadge";
import type { PublicProperty } from "@/types/property";

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
    latitude: -34.7,
    longitude: -58.4,
    geo_quality: "EXACT",
    ambientes: 3,
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
    nearest_train_station: null,
    nearest_train_station_line: null,
    walk_distance_m: null,
    ...overrides,
  };
}

// P2: getPropertyById/getAllPublicIds ahora consultan Supabase real
// (ver lib/data/properties.ts) -- estos 4 tests pasan a ser de
// integración (requieren SUPABASE_URL/SUPABASE_ANON_KEY en el entorno
// de test) en vez de leer el JSON estático local.
describe("getPropertyById -- resolución SOLO por public_id (§27)", () => {
  it("resuelve una propiedad real por su public_id", async () => {
    const ids = await getAllPublicIds();
    expect(ids.length).toBeGreaterThan(0);
    const found = await getPropertyById(ids[0]);
    expect(found?.public_id).toBe(ids[0]);
  });

  it("un property_id interno (HIST-*) nunca resuelve nada", async () => {
    expect(await getPropertyById("HIST-000001")).toBeUndefined();
  });

  it("un property_id interno (PROP-DISC-*) nunca resuelve nada", async () => {
    expect(await getPropertyById("PROP-DISC-000001")).toBeUndefined();
  });

  it("un id inventado no resuelve nada (nunca genera datos)", async () => {
    expect(await getPropertyById("prop_noexiste12")).toBeUndefined();
  });
});

describe("AttributeList -- null nunca renderiza 'No' (§28)", () => {
  it("omite amenities null, muestra solo los true", () => {
    const property = makeProperty({ cochera: true, patio: null, terraza: false });
    render(AttributeList({ property }));
    expect(screen.getByText(/Cochera/)).toBeInTheDocument();
    expect(screen.queryByText(/Patio/)).not.toBeInTheDocument();
    // terraza=false (dato real conocido: NO tiene terraza) tampoco se
    // muestra como amenity "activo" -- la sección de amenities solo
    // lista los que son TRUE; false se omite igual que null en esta
    // vista (nunca se afirma "No" ahí).
    expect(screen.queryByText(/Terraza/)).not.toBeInTheDocument();
  });

  it("nunca renderiza el texto 'No' para un campo estructural null", () => {
    const property = makeProperty({ dormitorios: null, banios: null, surface_total: null });
    render(AttributeList({ property }));
    const noInformadoEls = screen.getAllByText("No informado");
    expect(noInformadoEls.length).toBeGreaterThan(0);
    expect(screen.queryByText(/^No$/)).not.toBeInTheDocument();
  });
});

describe("MultiSourceBadge -- multi-listing (§29)", () => {
  it("muestra 'Publicado en N fuentes' cuando listing_count > 1", () => {
    render(MultiSourceBadge({ listingCount: 2, sourceNames: ["Zonaprop", "BuscadorProp"], agencyNames: [] }));
    expect(screen.getByText(/Publicado en 2 fuentes/)).toBeInTheDocument();
    expect(screen.getByText(/Zonaprop/)).toBeInTheDocument();
  });

  it("no muestra el bloque si listing_count=1 y no hay agencia", () => {
    const { container } = render(MultiSourceBadge({ listingCount: 1, sourceNames: ["Zonaprop"], agencyNames: [] }));
    expect(container.firstChild).toBeNull();
  });

  it("agencia y fuente se muestran por separado, nunca mezcladas", () => {
    render(MultiSourceBadge({ listingCount: 2, sourceNames: ["Zonaprop", "BuscadorProp"], agencyNames: ["Ferrante Propiedades"] }));
    expect(screen.getByText(/Publicado por:/)).toBeInTheDocument();
    expect(screen.getByText(/Ferrante Propiedades/)).toBeInTheDocument();
  });
});
