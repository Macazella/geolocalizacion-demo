import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Patron estandar de Supabase para App Router: refresca el token de
// sesion en cada request (los access tokens expiran, esto evita que
// una sesion se corte silenciosamente a mitad de uso). No hace
// autorizacion acá (eso lo hace cada page/Server Action con
// is_admin()) -- solo mantiene viva la cookie de sesión.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Importante (doc de Supabase): NO poner lógica entre createServerClient
  // y este getUser() -- un error sutil acá puede desloguear usuarios al azar.
  await supabase.auth.getUser();

  return supabaseResponse;
}
