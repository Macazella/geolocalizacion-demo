import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getAllProperties } from "@/lib/data/properties";
import { FavoritesList } from "@/components/property/FavoritesList";

export const revalidate = 3600;

export default async function FavoritosPage() {
  const properties = await getAllProperties();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-foreground">Tus favoritos</h1>
        <div className="mt-4">
          <FavoritesList allProperties={properties} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
