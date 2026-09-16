"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "geolocalizacion-demo:favorites";

function readFavorites(): Set<string> {
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

function writeFavorites(favorites: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // localStorage puede fallar (modo privado, cuota excedida, etc.) --
    // el corazón simplemente no persiste, nunca rompe la UI (§32).
  }
}

/**
 * Favoritos de demo -- 100% localStorage, sin login, sin Supabase
 * (brief P1 §32). Key = public_id, nunca el ID interno.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage es un sistema externo (solo existe en cliente) --
    // este es exactamente el caso que React documenta como excepción
    // legítima a "no llames setState en un efecto": sincronizar con
    // datos que no pueden leerse durante el render inicial/SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(readFavorites());
    setHydrated(true);
  }, []);

  const isFavorite = useCallback((publicId: string) => favorites.has(publicId), [favorites]);

  const toggleFavorite = useCallback((publicId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) {
        next.delete(publicId);
      } else {
        next.add(publicId);
      }
      writeFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, hydrated };
}
