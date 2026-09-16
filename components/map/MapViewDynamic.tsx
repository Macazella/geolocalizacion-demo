"use client";

import dynamic from "next/dynamic";
import type { PublicProperty } from "@/types/property";

// Leaflet accede a `window` en tiempo de import -- se carga SOLO en el
// cliente, nunca durante SSR/build (necesario en Next.js).
const MapView = dynamic(() => import("@/components/map/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-border/40 text-sm text-muted">
      Cargando mapa…
    </div>
  ),
});

interface MapViewDynamicProps {
  properties: PublicProperty[];
  center?: [number, number];
  singleMarker?: boolean;
}

export function MapViewDynamic(props: MapViewDynamicProps) {
  return <MapView {...props} />;
}
