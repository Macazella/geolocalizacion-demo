import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

// Pagina de un solo uso: recibe el "code" que MercadoLibre manda por
// redirect luego de que un admin aprueba el acceso (Authorization Code
// grant). Solo lo muestra en pantalla para copiarlo -- el intercambio
// por access_token/refresh_token (que necesita el client_secret) se
// hace aparte, nunca en esta pagina publica.
export default async function MercadoLibreCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const { code, error, error_description: errorDescription } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <Unauthorized reason="Necesitás iniciar sesión para ver esta página." />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "ADMIN") {
    return <Unauthorized reason="Esta página es solo para administradores." />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12">
        <h1 className="text-xl font-bold text-foreground">Autorización de MercadoLibre</h1>
        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">MercadoLibre devolvió un error: {error}</p>
            {errorDescription && <p className="mt-1">{errorDescription}</p>}
          </div>
        ) : code ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted">
              Copiá este código y pasalo -- es de un solo uso y expira en pocos minutos.
            </p>
            <code className="block break-all rounded-lg border border-border bg-surface p-4 text-sm font-mono">
              {code}
            </code>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No llegó ningún código en la URL. Volvé a iniciar el proceso de autorización.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Unauthorized({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-foreground">No autorizado</h1>
        <p className="mt-2 text-sm text-muted">{reason}</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Iniciar sesión
        </Link>
      </main>
      <Footer />
    </div>
  );
}
