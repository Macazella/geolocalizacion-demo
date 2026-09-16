"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AmenityField, Location, PublicProperty, SearchFilters } from "@/types/property";
import { filterProperties, isMapEligible, sortByPrice } from "@/lib/filters/filterProperties";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ReliableLocationToggle } from "@/components/filters/ReliableLocationToggle";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { MapViewDynamic } from "@/components/map/MapViewDynamic";

interface ResultsViewProps {
  properties: PublicProperty[];
  locations: Location[];
}

function filtersFromSearchParams(params: URLSearchParams): SearchFilters {
  return {
    province: params.get("province") ?? undefined,
    partido: params.get("partido") ?? undefined,
    locality: params.get("locality") ?? undefined,
    priceMin: params.get("priceMin") ? Number(params.get("priceMin")) : undefined,
    priceMax: params.get("priceMax") ? Number(params.get("priceMax")) : undefined,
    tipos: params.get("tipos") ? params.get("tipos")!.split(",") : undefined,
    amenities: params.get("amenities") ? (params.get("amenities")!.split(",") as AmenityField[]) : undefined,
  };
}

export function ResultsView({ properties, locations }: ResultsViewProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => filtersFromSearchParams(searchParams));
  const [onlyReliable, setOnlyReliable] = useState(true); // ON por default, brief P1 §23
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [mobileView, setMobileView] = useState<"map" | "list">("list");
  const [loading] = useState(false);

  const filtered = useMemo(() => filterProperties(properties, filters), [properties, filters]);

  // §23: ON -> lista Y mapa muestran solo map_eligible. OFF -> lista
  // muestra todo public_eligible (ya filtrado por otros criterios),
  // pero el mapa SIGUE mostrando solo map_eligible -- nunca un marker
  // de centroide/no-verificado.
  const listResults = onlyReliable ? filtered.filter(isMapEligible) : filtered;
  const mapResults = filtered.filter(isMapEligible);
  const sorted = sortByPrice(listResults, sortDir);

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      <div className="border-b border-border bg-surface px-4 py-3 sm:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setMobileView("map")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${mobileView === "map" ? "bg-brand text-white" : "bg-background text-muted"}`}
          >
            Mapa
          </button>
          <button
            onClick={() => setMobileView("list")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${mobileView === "list" ? "bg-brand text-white" : "bg-background text-muted"}`}
          >
            Lista
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[260px_1fr_380px]">
        <aside
          className={`min-h-0 overflow-y-auto border-r border-border bg-surface p-4 ${mobileView === "list" ? "hidden sm:block" : "hidden sm:block"}`}
        >
          <FilterPanel locations={locations} filters={filters} onChange={setFilters} />
          <div className="mt-5 border-t border-border pt-4">
            <ReliableLocationToggle checked={onlyReliable} onChange={setOnlyReliable} />
          </div>
        </aside>

        <section className={`${mobileView === "list" ? "hidden sm:block" : "block"} min-h-0 p-2 sm:p-4`}>
          <MapViewDynamic properties={mapResults} />
        </section>

        <section className={`${mobileView === "map" ? "hidden sm:block" : "block"} min-h-0 overflow-y-auto p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted">
              {sorted.length} {sorted.length === 1 ? "propiedad" : "propiedades"}
            </p>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
              aria-label="Ordenar por precio"
            >
              <option value="asc">Precio: menor a mayor</option>
              <option value="desc">Precio: mayor a menor</option>
            </select>
          </div>

          <div className="mb-3 sm:hidden">
            <FilterPanel locations={locations} filters={filters} onChange={setFilters} />
            <div className="mt-4 border-t border-border pt-3">
              <ReliableLocationToggle checked={onlyReliable} onChange={setOnlyReliable} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyResults onlyReliable={onlyReliable} onShowAll={() => setOnlyReliable(false)} />
          ) : (
            <div className="space-y-3">
              {sorted.map((p) => (
                <PropertyCard key={p.public_id} property={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyResults({ onlyReliable, onShowAll }: { onlyReliable: boolean; onShowAll: () => void }) {
  if (onlyReliable) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        <p>No hay propiedades con ubicación confiable para estos filtros.</p>
        <button onClick={onShowAll} className="mt-2 font-medium text-brand-dark hover:underline">
          Ver todas igual
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
      No encontramos propiedades con estos filtros. Probá ampliar el rango de precio o la zona.
    </div>
  );
}
