import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchForm } from "@/components/search/SearchForm";
import { ValuePropCard } from "@/components/search/ValuePropCard";
import { QuickZoneLink } from "@/components/search/QuickZoneLink";
import { getLocations } from "@/lib/data/properties";

export default function Home() {
  const locations = getLocations();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center px-4 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Encontrá tu próxima propiedad
            <br />
            sin buscar portal por portal.
          </h1>
          <p className="mt-4 text-lg text-muted">
            Reunimos publicaciones inmobiliarias, identificamos anuncios repetidos y te
            ayudamos a comparar opciones en un solo lugar.
          </p>
        </div>

        <div className="mt-10 w-full max-w-3xl">
          <SearchForm locations={locations} />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <QuickZoneLink label="Explorar Lomas de Zamora" partido="Lomas de Zamora" />
          <QuickZoneLink label="Explorar Lanús" partido="Lanús" />
        </div>

        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          <ValuePropCard title="Un solo buscador" description="Múltiples portales y fuentes." />
          <ValuePropCard
            title="Una propiedad, no cinco anuncios"
            description="Detectamos publicaciones repetidas."
          />
          <ValuePropCard title="Sabé cuándo cambia" description="Historial de precio de cada propiedad." />
        </div>
      </main>

      <Footer />
    </div>
  );
}
