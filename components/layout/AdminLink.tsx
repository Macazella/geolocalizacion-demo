"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browserClient";

// Chequea sesión + rol en el navegador -- así el resto del sitio
// (Header se usa en toda página estática/ISR) no se vuelve dinámico
// solo por mostrar este link. Mismo patrón que useFavorites.isLoggedIn.
export function AdminLink() {
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

  if (!isAdmin) return null;

  return (
    <Link href="/admin/monitoring" className="hover:text-foreground">
      Admin
    </Link>
  );
}
