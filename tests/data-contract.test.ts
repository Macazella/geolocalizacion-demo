import { describe, expect, it } from "vitest";
import dataset from "@/data/public_demo_dataset.json";
import type { PublicProperty } from "@/types/property";

const properties = dataset as PublicProperty[];

// Espejo (en TypeScript) del security audit del repo privado
// (product_export/security_audit.py) -- misma allow-list, mismos
// substrings prohibidos. Si algún día el dataset público se genera o
// edita a mano acá, este test lo atrapa igual.
const PROHIBITED_SUBSTRINGS = [
  "comentario_maga",
  "admin_notes",
  "dedup_status",
  "cross_source_match_of",
  "match_score",
  "match_reason",
  "coordinate_validation",
  "address_precision",
  "geo_review_flag",
  "provenance",
  "source_health",
  "search_coverage",
  "run_id",
  "review_category",
  "needs_manual_review",
  "has_data_conflict",
];

const INTERNAL_ID_RE = /\bHIST-\d+\b|\bPROP-DISC-\d+\b|\bMON-PROP-\b/;

describe("public_demo_dataset.json — Public Data Contract", () => {
  it("tiene al menos una propiedad", () => {
    expect(properties.length).toBeGreaterThan(0);
  });

  it("ninguna propiedad tiene claves fuera del contrato PublicProperty", () => {
    const allowed = new Set([
      "public_id", "tipo", "familia_tipo", "price", "currency", "province", "partido",
      "locality", "display_address", "latitude", "longitude", "geo_quality", "ambientes",
      "dormitorios", "banios", "surface_total", "cochera", "patio", "terraza", "jardin",
      "balcon", "parrilla", "apto_credito", "expensas", "expensas_currency", "agency_names",
      "listing_count", "source_names", "primary_url", "price_history", "first_seen_label",
      "last_updated_label",
    ]);
    for (const p of properties) {
      for (const key of Object.keys(p)) {
        expect(allowed.has(key), `clave inesperada: ${key}`).toBe(true);
      }
    }
  });

  it("no contiene ningún substring prohibido en el JSON serializado", () => {
    const serialized = JSON.stringify(properties);
    for (const substring of PROHIBITED_SUBSTRINGS) {
      expect(serialized.includes(substring), `substring prohibido encontrado: ${substring}`).toBe(false);
    }
  });

  it("no contiene IDs internos (HIST-*/PROP-DISC-*/MON-PROP-*)", () => {
    const serialized = JSON.stringify(properties);
    expect(INTERNAL_ID_RE.test(serialized)).toBe(false);
  });

  it("0 propiedades sin localidad", () => {
    expect(properties.every((p) => !!p.locality?.trim())).toBe(true);
  });

  it("map_eligible=false implica latitude/longitude null", () => {
    for (const p of properties) {
      if (p.geo_quality === "LOCALITY_ONLY" || p.geo_quality === "UNVERIFIED") {
        expect(p.latitude, p.public_id).toBeNull();
        expect(p.longitude, p.public_id).toBeNull();
      }
    }
  });

  it("map_eligible=true implica coordenadas presentes", () => {
    for (const p of properties) {
      if (p.geo_quality === "EXACT" || p.geo_quality === "APPROXIMATE") {
        expect(p.latitude, p.public_id).not.toBeNull();
        expect(p.longitude, p.public_id).not.toBeNull();
      }
    }
  });

  it("agency_names nunca coincide con un nombre de portal certificado", () => {
    const portalNames = new Set(["Zonaprop", "BuscadorProp", "Argenprop"]);
    for (const p of properties) {
      for (const agency of p.agency_names) {
        expect(portalNames.has(agency), `${p.public_id}: ${agency}`).toBe(false);
      }
    }
  });

  it("toda propiedad tiene primary_url válida (http/https)", () => {
    for (const p of properties) {
      expect(p.primary_url, p.public_id).toMatch(/^https?:\/\//);
    }
  });

  it("UTF-8: sin carácter de reemplazo (mojibake) en el dataset", () => {
    const serialized = JSON.stringify(properties);
    expect(serialized.includes("�")).toBe(false);
  });

  it("UTF-8: las localidades de la demo aparecen correctamente formadas", () => {
    const serialized = JSON.stringify(properties);
    const anyOf = ["Lanús", "San José", "Turdera", "Banfield"];
    expect(anyOf.some((s) => serialized.includes(s))).toBe(true);
  });

  it("public_id es estable (mismo formato, sin revelar el ID interno)", () => {
    for (const p of properties) {
      expect(p.public_id).toMatch(/^prop_[0-9a-f]{10}$/);
    }
  });

  it("todos los public_id son únicos", () => {
    const ids = properties.map((p) => p.public_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserva boolean null -- no todos los amenities son true/false", () => {
    const amenityFields = ["cochera", "patio", "terraza", "jardin", "balcon", "parrilla", "apto_credito"] as const;
    const hasNull = properties.some((p) => amenityFields.some((f) => p[f] === null));
    expect(hasNull).toBe(true);
  });

  it("expensas_currency nunca asume la moneda de venta", () => {
    for (const p of properties) {
      if (p.expensas !== null) {
        expect(p.expensas_currency, p.public_id).toBeNull();
      }
    }
  });

  it("price_history: la primera observación nunca tiene change_pct", () => {
    for (const p of properties) {
      if (p.price_history.length > 0) {
        expect(p.price_history[0].change_pct).toBeNull();
      }
    }
  });
});
