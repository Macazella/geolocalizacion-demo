"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { PublicProperty } from "@/types/property";
import { formatHeading, formatPrice, geoQualityBadge } from "@/lib/formatters/format";
import { propertiesWithMarkerCoordinates } from "@/lib/map/mapProperties";

// Fix del ícono default de Leaflet roto por el bundler de Next.js --
// patrón estándar de la librería, sin API key ni servicio externo.
// @ts-expect-error -- _getIconUrl no está tipado en @types/leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapViewProps {
  properties: PublicProperty[];
  center?: [number, number];
  singleMarker?: boolean;
}

const DEFAULT_CENTER: [number, number] = [-34.77, -58.4]; // Lomas de Zamora / Lanús, aprox.

// Solo recibe propiedades map_eligible=true -- el filtrado ocurre
// ANTES de llegar acá (ResultsView/PropertyDetail), nunca acá adentro
// -- este componente ni siquiera sabe qué es geo_quality "no elegible",
// solo dibuja lo que le llega con lat/lng no-null (brief P1 §25).
export function MapView({ properties, center, singleMarker = false }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const withCoords = propertiesWithMarkerCoordinates(properties);
    const mapCenter = center ?? (withCoords.length > 0 ? [withCoords[0].latitude!, withCoords[0].longitude!] : DEFAULT_CENTER);

    const map = L.map(containerRef.current, { scrollWheelZoom: !singleMarker }).setView(
      mapCenter as [number, number],
      singleMarker ? 15 : 12
    );
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const clusterGroup = (L as unknown as { markerClusterGroup: () => L.LayerGroup }).markerClusterGroup();

    withCoords.forEach((property) => {
      const marker = L.marker([property.latitude!, property.longitude!]);
      marker.bindPopup(
        `<div style="min-width:160px">
          <strong>${escapeHtml(formatHeading(property.tipo, property.locality))}</strong><br/>
          ${escapeHtml(formatPrice(property.price, property.currency))}<br/>
          <span style="color:#64748b;font-size:12px">${escapeHtml(property.display_address)}</span><br/>
          <span style="color:#0f766e;font-size:12px">${escapeHtml(geoQualityBadge(property.geo_quality))}</span><br/>
          <a href="/propiedad/${property.public_id}" style="color:#0f766e;font-weight:600">Ver propiedad</a>
        </div>`
      );
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    // Leaflet calcula el tamaño del mapa en el momento de L.map() -- si
    // el contenedor todavía mide 0x0 (layout de grid/flex que no
    // asentó su altura sincrónicamente), el mapa queda invisible para
    // siempre sin este ajuste. invalidateSize() recalcula contra el
    // tamaño real; el ResizeObserver cubre además cambios posteriores
    // (toggle mapa/lista en mobile, resize de ventana).
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);
    const raf = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  return <div ref={containerRef} className="h-full w-full" role="img" aria-label="Mapa de propiedades" />;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
