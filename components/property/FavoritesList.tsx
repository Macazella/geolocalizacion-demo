"use client";

import type { PublicProperty } from "@/types/property";
import { useFavorites } from "@/lib/favorites/useFavorites";
import { PropertyCard } from "@/components/property/PropertyCard";

interface FavoritesListProps {
  allProperties: PublicProperty[];
}

export function FavoritesList({ allProperties }: FavoritesListProps) {
  const { favorites, hydrated } = useFavorites();

  if (!hydrated) return null; // evita parpadeo antes de leer localStorage

  const favoriteProperties = allProperties.filter((p) => favorites.has(p.public_id));

  if (favoriteProperties.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        Todavía no guardaste ninguna propiedad. Tocá el corazón en cualquier propiedad para
        guardarla acá.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {favoriteProperties.map((p) => (
        <PropertyCard key={p.public_id} property={p} />
      ))}
    </div>
  );
}
