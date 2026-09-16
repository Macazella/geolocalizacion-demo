"use client";

import { createBrowserClient } from "@supabase/ssr";

// UNICO uso permitido de un cliente Supabase en el navegador: favoritos
// por cuenta (lib/favorites/useFavorites.ts). Necesita el prefijo
// NEXT_PUBLIC_ porque corre en el bundle del cliente -- a diferencia
// de lib/supabase/client.ts / server.ts (que nunca llegan al
// navegador), acá es intencional y seguro: la anon key esta disenada
// para exponerse, la protege RLS (favorites: solo el dueño lee/escribe
// su propia fila, ver GEOLOCALIZACCION/db/schema/010_rls_policies.sql).
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
