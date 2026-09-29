import { createClient } from "@supabase/supabase-js";

// Cliente con la service_role key -- bypassa RLS por completo. SOLO
// para jobs de servidor sin sesión de usuario (hoy: el cron de alertas
// de búsquedas guardadas, lib/email/savedSearchAlerts.ts), que necesita
// leer saved_searches de TODOS los usuarios y su email en profiles --
// algo que ni siquiera un ADMIN autenticado puede hacer (ver
// db/schema/010_rls_policies.sql: "ADMIN deliberadamente SIN acceso" a
// saved_searches, privacidad del CLIENT dueño). Nunca importar esto
// desde un componente cliente, y nunca desde una ruta que no valide
// antes el caller (ver CRON_SECRET en app/api/cron/*).
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
