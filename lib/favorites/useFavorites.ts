"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browserClient";

const STORAGE_KEY = "geolocalizacion-demo:favorites";

function readLocalFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeLocalFavorites(favorites: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // localStorage puede fallar (modo privado, cuota excedida, etc.) --
    // el corazón simplemente no persiste, nunca rompe la UI.
  }
}

/**
 * Favoritos -- dos modos, mismo hook, mismos consumidores (FavoriteButton/
 * FavoritesList no cambiaron):
 *  - Sin sesión: 100% localStorage, como en P1 (nunca requiere cuenta).
 *  - Con sesión: se guardan en public.favorites (RLS: cada usuario solo
 *    lee/escribe su propia fila) -- sincronizados entre dispositivos.
 * Al iniciar sesión con favoritos locales todavía no migrados, se suben
 * una sola vez (upsert, nunca duplica) y se limpia el localStorage local.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setFavorites(readLocalFavorites());
        setHydrated(true);
        return;
      }

      setUserId(user.id);

      const local = readLocalFavorites();
      if (local.size > 0) {
        await supabaseBrowser
          .from("favorites")
          .upsert(
            [...local].map((property_id) => ({ user_id: user.id, property_id })),
            { onConflict: "user_id,property_id" }
          );
        writeLocalFavorites(new Set());
      }

      const { data } = await supabaseBrowser
        .from("favorites")
        .select("property_id")
        .eq("user_id", user.id);
      if (cancelled) return;

      setFavorites(new Set((data ?? []).map((r) => r.property_id)));
      setHydrated(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback((publicId: string) => favorites.has(publicId), [favorites]);

  const toggleFavorite = useCallback(
    (publicId: string) => {
      const willAdd = !favorites.has(publicId);
      const next = new Set(favorites);
      if (willAdd) {
        next.add(publicId);
      } else {
        next.delete(publicId);
      }
      setFavorites(next);

      if (userId) {
        const query = willAdd
          ? supabaseBrowser.from("favorites").insert({ user_id: userId, property_id: publicId })
          : supabaseBrowser.from("favorites").delete().eq("user_id", userId).eq("property_id", publicId);
        query.then(({ error }) => {
          if (error) {
            // revierte el optimistic update si la escritura real fallo
            setFavorites((prev) => {
              const reverted = new Set(prev);
              if (willAdd) reverted.delete(publicId);
              else reverted.add(publicId);
              return reverted;
            });
          }
        });
      } else {
        writeLocalFavorites(next);
      }
    },
    [favorites, userId]
  );

  return { favorites, isFavorite, toggleFavorite, hydrated, isLoggedIn: userId !== null };
}
