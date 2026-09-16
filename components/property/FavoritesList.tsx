"use client";

import type { PublicProperty } from "@/types/property";
import { useFavorites } from "@/lib/favorites/useFavorites";
import { PropertyCard } from "@/components/property/PropertyCard";

interface FavoritesListProps {
  allProperties: PublicProperty[];
}

export function FavoritesList({ allProperties }: FavoritesListProps) {
  const { favorites, hydrated, isLoggedIn } = useFavorites();

  if (!hydrated) return null; // evita parpadeo antes de leer localStorage/DB

  const favoriteProperties = allProperties.filter((p) => favorites.has(p.public_id));
  const subtitle = isLoggedIn
    ? "Sincronizados con tu cuenta — se ven igual en cualquier dispositivo."
    : "Guardados en este navegador — no necesitás una cuenta para esta demo.";

  return (
    <div>
      <p className="mb-6 text-sm text-muted">{subtitle}</p>
      {favoriteProperties.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
          Todavía no guardaste ninguna propiedad. Tocá el corazón en cualquier propiedad para
          guardarla acá.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {favoriteProperties.map((p) => (
            <PropertyCard key={p.public_id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
