"use client";

// Error genérico de CLIENT (brief P1 §36) -- nunca expone stack trace
// ni mensaje técnico en la UI principal.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-bold text-foreground">Hubo un problema cargando los resultados.</h1>
      <button onClick={reset} className="mt-2 rounded-lg bg-brand px-4 py-2 font-medium text-white">
        Reintentar
      </button>
    </div>
  );
}
