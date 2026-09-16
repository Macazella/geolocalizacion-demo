import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renombro el archivo "middleware.ts" a "proxy.ts" (mismo
// mecanismo, nuevo nombre -- ver AGENTS.md de este repo: esta version
// de Next tiene cambios que rompen compatibilidad con versiones
// anteriores, siempre verificar node_modules/next/dist/docs antes de
// asumir una convencion vieja).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
