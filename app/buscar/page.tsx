import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ResultsView } from "@/components/search/ResultsView";
import { getAllProperties, getLocations } from "@/lib/data/properties";

export default function BuscarPage() {
  const properties = getAllProperties();
  const locations = getLocations();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={<div className="p-8 text-center text-muted">Cargando resultados…</div>}>
        <ResultsView properties={properties} locations={locations} />
      </Suspense>
    </div>
  );
}
