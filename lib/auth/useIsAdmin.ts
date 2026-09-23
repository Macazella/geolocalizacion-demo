"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browserClient";

// Chequea sesión + rol en el navegador -- así el resto del sitio
// (Header se usa en toda página estática/ISR) no se vuelve dinámico
// solo por saber si hay que mostrar el link de Admin. Mismo patrón que
// useFavorites.isLoggedIn. Extraído de components/layout/AdminLink.tsx
// para poder armar el item del Dock condicionalmente en Header.
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && profile?.role === "ADMIN") {
        setIsAdmin(true);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}
