import type { GeoQuality, Location, PublicPriceObservation, PublicProperty } from "@/types/property";
import { supabase } from "@/lib/supabase/client";

// Antes leía data/public_demo_dataset.json (export estático offline
// del repo privado). Ahora lee en vivo de Supabase, exclusivamente a
// través de la vista public_properties -- nunca de una tabla base
// (ver GEOLOCALIZACCION/db/schema/009_public_property_view.sql: la
// anon key no puede leer properties/listings directamente, la RLS lo
// bloquea). Se filtra por search_enabled=true, que reemplaza el
// antiguo DEMO_LOCALITIES hardcodeado -- reproduce exactamente las
// mismas 257 propiedades de Lomas+Lanús porque esa es la data real,
// no un número inventado (GEOLOCALIZACCION/db/README.md).

interface DbPublicPropertyRow {
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
  agency_names: string | null; // string_agg(..., ', ') en SQL -- no un array
  listing_count: number;
  source_names: string | null;
  primary_url: string | null;
  price_history: { observed_at: string; price: number; currency: string | null }[] | null;
  first_seen_label: string | null; // pese al nombre, en la DB es el timestamp crudo -- se formatea acá (ver toLabels)
  last_updated_label: string | null;
}

const MESES_ES = [
  "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function dateParts(iso: string | null) {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) } : null;
}

// Espejo de product_export/dates.py::format_label_es
function formatLabelEs(iso: string | null): string | null {
  const d = dateParts(iso);
  return d ? `${d.day} de ${MESES_ES[d.month]} de ${d.year}` : null;
}

// Espejo de product_export/dates.py::format_month_year_es
function formatMonthYearEs(iso: string | null): string | null {
  const d = dateParts(iso);
  return d ? `${MESES_ES[d.month]} ${d.year}` : null;
}

function splitNames(csv: string | null): string[] {
  return csv ? csv.split(", ").filter(Boolean) : [];
}

// Espejo de product_export/build_dataset.py::build_public_price_history
// -- mismo orden (la vista ya ordena por observed_at), mismo redondeo,
// mismo "nunca un punto sin precio o fecha real".
function toPriceHistory(
  raw: { observed_at: string; price: number; currency: string | null }[] | null
): PublicPriceObservation[] {
  const out: PublicPriceObservation[] = [];
  let prevPrice: number | null = null;
  for (const r of raw ?? []) {
    const d = dateParts(r.observed_at);
    if (r.price == null || !d) continue;
    const date = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
    const change_pct =
      prevPrice !== null && prevPrice !== 0
        ? Math.round(((r.price - prevPrice) / prevPrice) * 10000) / 100
        : null;
    out.push({ date, price: r.price, currency: r.currency, change_pct });
    prevPrice = r.price;
  }
  return out;
}

function mapRow(row: DbPublicPropertyRow): PublicProperty {
  return {
    public_id: row.public_id,
    tipo: row.tipo,
    familia_tipo: row.familia_tipo,
    price: row.price,
    currency: row.currency,
    province: row.province,
    partido: row.partido,
    locality: row.locality,
    display_address: row.display_address,
    latitude: row.latitude,
    longitude: row.longitude,
    geo_quality: row.geo_quality,
    ambientes: row.ambientes,
    dormitorios: row.dormitorios,
    banios: row.banios,
    surface_total: row.surface_total,
    cochera: row.cochera,
    patio: row.patio,
    terraza: row.terraza,
    jardin: row.jardin,
    balcon: row.balcon,
    parrilla: row.parrilla,
    apto_credito: row.apto_credito,
    expensas: row.expensas,
    expensas_currency: row.expensas_currency,
    agency_names: splitNames(row.agency_names),
    listing_count: row.listing_count,
    source_names: splitNames(row.source_names),
    primary_url: row.primary_url ?? "",
    price_history: toPriceHistory(row.price_history),
    first_seen_label: (() => {
      const m = formatMonthYearEs(row.first_seen_label);
      return m ? `Publicada desde ${m}` : null;
    })(),
    last_updated_label: (() => {
      const l = formatLabelEs(row.last_updated_label);
      return l ? `Última actualización: ${l}` : null;
    })(),
  };
}

const PROPERTY_COLUMNS =
  "public_id, tipo, familia_tipo, price, currency, province, partido, locality, " +
  "display_address, latitude, longitude, geo_quality, ambientes, dormitorios, banios, " +
  "surface_total, cochera, patio, terraza, jardin, balcon, parrilla, apto_credito, " +
  "expensas, expensas_currency, agency_names, listing_count, source_names, primary_url, " +
  "price_history, first_seen_label, last_updated_label";

export async function getAllProperties(): Promise<PublicProperty[]> {
  const { data, error } = await supabase
    .from("public_properties")
    .select(PROPERTY_COLUMNS)
    .eq("search_enabled", true);
  if (error) throw new Error(`Supabase getAllProperties: ${error.message}`);
  return (data as unknown as DbPublicPropertyRow[]).map(mapRow);
}

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("province, department_or_partido, locality")
    .eq("search_enabled", true)
    .order("locality");
  if (error) throw new Error(`Supabase getLocations: ${error.message}`);
  return (data ?? []).map((r) => ({
    province: r.province,
    partido: r.department_or_partido,
    locality: r.locality,
  }));
}

export async function getPropertyById(publicId: string): Promise<PublicProperty | undefined> {
  const { data, error } = await supabase
    .from("public_properties")
    .select(PROPERTY_COLUMNS)
    .eq("public_id", publicId)
    .eq("search_enabled", true)
    .maybeSingle();
  if (error) throw new Error(`Supabase getPropertyById: ${error.message}`);
  return data ? mapRow(data as unknown as DbPublicPropertyRow) : undefined;
}

export async function getAllPublicIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("public_properties")
    .select("public_id")
    .eq("search_enabled", true);
  if (error) throw new Error(`Supabase getAllPublicIds: ${error.message}`);
  return (data ?? []).map((r) => r.public_id);
}
