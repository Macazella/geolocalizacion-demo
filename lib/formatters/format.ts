import type { GeoQuality } from "@/types/property";

export function formatPrice(price: number | null, currency: string | null): string {
  if (price === null) return "Precio no informado";
  const formatted = new Intl.NumberFormat("es-AR").format(price);
  return `${currency ?? ""} ${formatted}`.trim();
}

export function formatHeading(tipo: string | null, locality: string | null): string {
  const tipoLabel = TIPO_LABELS[tipo ?? ""] ?? tipo ?? "Propiedad";
  return locality ? `${tipoLabel} en ${locality}` : tipoLabel;
}

const TIPO_LABELS: Record<string, string> = {
  CASA: "Casa",
  PH: "PH",
  DEPARTAMENTO: "Departamento",
  DUPLEX: "Dúplex",
  MONOAMBIENTE: "Monoambiente",
};

export function tipoLabel(tipo: string | null): string {
  if (!tipo) return "Otro";
  return TIPO_LABELS[tipo] ?? tipo;
}

// Nunca se expone geo_quality crudo al CLIENT (§18 / Public Data
// Contract §Security boundary) -- estas etiquetas son lo único que se
// muestra en UI.
const GEO_QUALITY_BADGE: Record<GeoQuality, string> = {
  EXACT: "Ubicación verificada",
  APPROXIMATE: "Ubicación aproximada",
  LOCALITY_ONLY: "Ubicación no verificada",
  UNVERIFIED: "Ubicación no verificada",
};

export function geoQualityBadge(geoQuality: GeoQuality): string {
  return GEO_QUALITY_BADGE[geoQuality];
}

export function formatChangePct(changePct: number | null): string | null {
  if (changePct === null) return null;
  const sign = changePct > 0 ? "↑" : changePct < 0 ? "↓" : "";
  return `${sign} ${Math.abs(changePct).toFixed(2)}%`;
}

export function formatDateEs(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

// Cuadra ≈ 100m -- aproximación, no una medida exacta (varía según la
// zona). walkDistanceM viene de una ruta peatonal real (OSRM), nunca
// de una estimación en línea recta.
export function formatWalkDistanceToStation(
  station: string | null,
  line: string | null,
  walkDistanceM: number | null
): string | null {
  if (!station || walkDistanceM === null) return null;
  const cuadras = Math.max(1, Math.round(walkDistanceM / 100));
  const cuadrasLabel = cuadras === 1 ? "1 cuadra" : `${cuadras} cuadras`;
  const lineLabel = line ? ` (Línea ${line})` : "";
  return `A ${cuadrasLabel} de la estación ${station}${lineLabel}`;
}
