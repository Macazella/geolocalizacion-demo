import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SavedSearchesList } from "@/components/account/SavedSearchesList";

export default function BusquedasGuardadasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-foreground">Tus búsquedas guardadas</h1>
        <p className="mt-1 text-sm text-muted">
          Elegí si querés recibir un aviso cuando aparezca algo nuevo que coincida con tus filtros.
        </p>
        <div className="mt-4">
          <SavedSearchesList />
        </div>
      </main>
      <Footer />
    </div>
  );
}
