"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AmenityField, Location, PublicProperty, SearchFilters } from "@/types/property";
import { filterProperties, isMapEligible, sortByPrice } from "@/lib/filters/filterProperties";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ReliableLocationToggle } from "@/components/filters/ReliableLocationToggle";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { MapViewDynamic } from "@/components/map/MapViewDynamic";
import { GlideSelect } from "@/components/reactbits/GlideSelect";
import { BentoCard } from "@/components/reactbits/BentoCard";

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

// Inversa de filtersFromSearchParams -- se necesitan las dos para que
// los filtros vivan en la URL (no solo en estado de React): sin esto,
// entrar a una ficha y volver atras con el boton del navegador
// restauraba la URL vieja (sin los cambios de filtro hechos despues de
// cargar la pagina), obligando a re-marcar todo de nuevo.
function searchParamsFromFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.province) params.set("province", filters.province);
  if (filters.partido) params.set("partido", filters.partido);
  if (filters.locality) params.set("locality", filters.locality);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.tipos?.length) params.set("tipos", filters.tipos.join(","));
  if (filters.amenities?.length) params.set("amenities", filters.amenities.join(","));
  return params;
}

export function ResultsView({ properties, locations }: ResultsViewProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(() => filtersFromSearchParams(searchParams));

  // Refleja cada cambio de filtro en la URL con replace (no push): no
  // ensucia el historial con una entrada por cada click en el panel,
  // pero SI actualiza la entrada actual -- por eso "atras" desde una
  // ficha de propiedad vuelve con los filtros tal como quedaron, no
  // como estaban al entrar a /buscar.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const qs = searchParamsFromFilters(filters).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
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
            <div className="w-56">
              <GlideSelect
                ariaLabel="Ordenar por precio"
                value={sortDir}
                size="sm"
                options={[
                  { value: "asc", label: "Precio: menor a mayor" },
                  { value: "desc", label: "Precio: mayor a menor" },
                ]}
                onChange={(v) => setSortDir(v as "asc" | "desc")}
              />
            </div>
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
                <BentoCard key={p.public_id} className="rounded-xl">
                  <PropertyCard property={p} />
                </BentoCard>
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
