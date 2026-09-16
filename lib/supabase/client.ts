import { createClient } from "@supabase/supabase-js";

// Solo se usa en Server Components / build time (generateStaticParams,
// pages async) -- nunca en un componente cliente. Por eso las env vars
// NO llevan el prefijo NEXT_PUBLIC_: la anon key jamás se empaqueta en
// el bundle del navegador, aunque sea segura de exponer (la protege la
// RLS de Supabase, no el secreto de la key).
//
// La anon key SOLO puede leer public_properties (vista) y locations --
// toda otra tabla devuelve 0 filas por RLS, verificado en
// GEOLOCALIZACCION/db/README.md.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan SUPABASE_URL / SUPABASE_ANON_KEY -- ver .env.local.example"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }, // sin sesiones de usuario en este cliente server-side
});
