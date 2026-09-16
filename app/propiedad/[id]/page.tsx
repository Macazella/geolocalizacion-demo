import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { AttributeList } from "@/components/property/AttributeList";
import { MultiSourceBadge } from "@/components/property/MultiSourceBadge";
import { PriceHistoryTable } from "@/components/property/PriceHistoryTable";
import { MapViewDynamic } from "@/components/map/MapViewDynamic";
import { getAllPublicIds, getPropertyById } from "@/lib/data/properties";
import { isMapEligible } from "@/lib/filters/filterProperties";

// Dataset estático y acotado (~257 propiedades) -- se prerenderizan
// TODAS las fichas en build time (brief P1 §43: no sobre-optimizar,
// pero tampoco renderizar de más en runtime sin necesidad).
export function generateStaticParams() {
  return getAllPublicIds().map((id) => ({ id }));
}

// Nunca acepta un property_id interno en la URL (§27) -- getPropertyById
// solo indexa por public_id, así que un HIST-000001 en la URL
// simplemente no matchea nada y cae en notFound().
export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = getPropertyById(id);

  if (!property) {
    notFound();
  }

  const mapEligible = isMapEligible(property);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        <PropertyHeader property={property} />

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {mapEligible ? (
            <div className="h-64 overflow-hidden rounded-xl sm:h-full">
              <MapViewDynamic
                properties={[property]}
                center={[property.latitude!, property.longitude!]}
                singleMarker
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted sm:h-full">
              Ubicación no disponible en el mapa para esta propiedad.
            </div>
          )}

          <div className="space-y-4">
            <AttributeList property={property} />
            <MultiSourceBadge
              listingCount={property.listing_count}
              sourceNames={property.source_names}
              agencyNames={property.agency_names}
            />
          </div>
        </div>

        <div className="mt-6">
          <PriceHistoryTable history={property.price_history} />
        </div>

        <div className="mt-6 hidden gap-3 sm:flex">
          <ActionButtons property={property} />
        </div>
      </main>

      {/* Sticky action bar en mobile (brief P1 §33/§46) */}
      <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t border-border bg-surface p-3 sm:hidden">
        <ActionButtons property={property} />
      </div>

      <div className="hidden sm:block">
        <Footer />
      </div>
    </div>
  );
}

function ActionButtons({ property }: { property: { primary_url: string } }) {
  return (
    <a
      href={property.primary_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 rounded-lg bg-brand px-4 py-3 text-center font-semibold text-white transition hover:bg-brand-dark"
    >
      Ver publicación
    </a>
  );
}
