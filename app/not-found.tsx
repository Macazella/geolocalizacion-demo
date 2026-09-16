import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-bold text-foreground">No encontramos esta propiedad</h1>
        <p className="text-sm text-muted">Puede que ya no esté disponible o que el enlace sea incorrecto.</p>
        <Link href="/buscar" className="mt-2 rounded-lg bg-brand px-4 py-2 font-medium text-white">
          Volver a la búsqueda
        </Link>
      </main>
    </div>
  );
}
