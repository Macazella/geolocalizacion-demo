import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ResultsView } from "@/components/search/ResultsView";
import { getAllProperties, getLocations } from "@/lib/data/properties";

export const revalidate = 3600; // ISR -- refleja cambios de la DB sin redeploy (P2: ahora hay datos vivos)

export default async function BuscarPage() {
  const [properties, locations] = await Promise.all([getAllProperties(), getLocations()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={<div className="p-8 text-center text-muted">Cargando resultados…</div>}>
        <ResultsView properties={properties} locations={locations} />
      </Suspense>
    </div>
  );
}
