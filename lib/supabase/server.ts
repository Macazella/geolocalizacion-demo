import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cliente Supabase consciente de cookies -- para usar DENTRO de Server
// Components, Server Actions y Route Handlers (nunca en un componente
// cliente). Distinto de lib/supabase/client.ts (que es para las
// lecturas públicas de public_properties/locations, sin sesión).
//
// Auth de usuarios reales (login/logout/registro) SIEMPRE pasa por
// este cliente -- necesita las cookies de sesión para saber quién es
// el usuario actual.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll llamado desde un Server Component (no puede
            // escribir cookies) -- el middleware ya se encarga de
            // refrescar la sesión en cada request, así que es seguro
            // ignorar esto acá.
          }
        },
      },
    }
  );
}
