"use client";

import { useFavorites } from "@/lib/favorites/useFavorites";

interface FavoriteButtonProps {
  publicId: string;
  size?: "sm" | "lg";
}

export function FavoriteButton({ publicId, size = "sm" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, hydrated } = useFavorites();
  const active = hydrated && isFavorite(publicId);
  const dimension = size === "lg" ? "h-10 w-10 text-xl" : "h-8 w-8 text-base";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(publicId);
      }}
      className={`flex ${dimension} items-center justify-center rounded-full border border-border bg-surface transition hover:border-accent`}
    >
      <span className={active ? "text-accent" : "text-muted"}>{active ? "♥" : "♡"}</span>
    </button>
  );
}
