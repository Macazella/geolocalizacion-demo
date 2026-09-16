import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { signIn, signUp, signOut } from "./actions";

// Única página dinámica del sitio (depende de cookies de sesión) --
// deliberado: el resto del sitio (/, /buscar, /propiedad/[id]) sigue
// estático/ISR sin verse afectado, porque Header no lee auth (ver
// components/layout/Header.tsx). El costo de tener auth real es
// aislarlo acá, no volver dinámico todo el sitio.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
        {user ? (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-foreground">Tu cuenta</h1>
            <div className="rounded-xl border border-border bg-surface p-4 text-sm">
              <p className="text-muted">Sesión iniciada como</p>
              <p className="font-medium text-foreground">{user.email}</p>
              <p className="mt-2 text-muted">
                Rol: <span className="font-medium text-foreground">{role ?? "…"}</span>
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-foreground">Iniciar sesión</h1>
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}
            {message && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>
            )}
            <form className="space-y-3">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  formAction={signIn}
                  type="submit"
                  className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Iniciar sesión
                </button>
                <button
                  formAction={signUp}
                  type="submit"
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
                >
                  Crear cuenta
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
