"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browserClient";
import type { SearchFilters } from "@/types/property";

export type AlertFrequency = "IMMEDIATE" | "DAILY" | "WEEKLY" | "MONTHLY";

export interface SavedSearch {
  search_id: number;
  filters: SearchFilters;
  alert_enabled: boolean;
  alert_frequency: AlertFrequency | null;
  created_at: string;
}

/**
 * Búsquedas guardadas -- a diferencia de favoritos (que tiene modo
 * localStorage sin sesión), esto SIEMPRE requiere sesión: el sentido de
 * guardar una búsqueda es poder recibir una alerta a ese usuario, y sin
 * cuenta no hay a quién avisarle. RLS (saved_searches_owner_only) ya
 * garantiza que cada usuario solo ve/edita sus propias filas.
 *
 * El envío real de las alertas (motor + proveedor de email) todavía no
 * está implementado -- esto solo guarda la preferencia (ver comentario
 * en db/schema/037_saved_search_alert_frequency.sql).
 */
export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async (uid: string) => {
    const { data } = await supabaseBrowser
      .from("saved_searches")
      .select("search_id, filters, alert_enabled, alert_frequency, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setSearches((data ?? []) as SavedSearch[]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (cancelled) return;

      if (!user) {
        setHydrated(true);
        return;
      }

      setUserId(user.id);
      await load(user.id);
      if (!cancelled) setHydrated(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const saveSearch = useCallback(
    async (filters: SearchFilters, alertFrequency: AlertFrequency | null) => {
      if (!userId) return { error: "not_logged_in" };
      const { error } = await supabaseBrowser.from("saved_searches").insert({
        user_id: userId,
        filters,
        alert_enabled: alertFrequency !== null,
        alert_frequency: alertFrequency,
      });
      if (!error) await load(userId);
      return { error: error?.message ?? null };
    },
    [userId, load]
  );

  const removeSearch = useCallback(
    async (searchId: number) => {
      if (!userId) return;
      const previous = searches;
      setSearches((prev) => prev.filter((s) => s.search_id !== searchId)); // optimistic
      const { error } = await supabaseBrowser
        .from("saved_searches")
        .delete()
        .eq("search_id", searchId)
        .eq("user_id", userId);
      if (error) setSearches(previous); // revierte si la escritura real falló
    },
    [userId, searches]
  );

  const updateAlert = useCallback(
    async (searchId: number, alertFrequency: AlertFrequency | null) => {
      if (!userId) return;
      const previous = searches;
      setSearches((prev) =>
        prev.map((s) =>
          s.search_id === searchId
            ? { ...s, alert_enabled: alertFrequency !== null, alert_frequency: alertFrequency }
            : s
        )
      );
      const { error } = await supabaseBrowser
        .from("saved_searches")
        .update({ alert_enabled: alertFrequency !== null, alert_frequency: alertFrequency })
        .eq("search_id", searchId)
        .eq("user_id", userId);
      if (error) setSearches(previous);
    },
    [userId, searches]
  );

  return {
    searches,
    hydrated,
    isLoggedIn: userId !== null,
    saveSearch,
    removeSearch,
    updateAlert,
  };
}
