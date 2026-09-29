"use client";

import { useState } from "react";
import Link from "next/link";
import type { SearchFilters } from "@/types/property";
import { useSavedSearches, type AlertFrequency } from "@/lib/savedSearches/useSavedSearches";

const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string }[] = [
  { value: "IMMEDIATE", label: "Apenas aparezca (inmediata)" },
  { value: "DAILY", label: "Resumen diario" },
  { value: "WEEKLY", label: "Resumen semanal" },
  { value: "MONTHLY", label: "Resumen mensual" },
];

interface SaveSearchButtonProps {
  filters: SearchFilters;
}

export function SaveSearchButton({ filters }: SaveSearchButtonProps) {
  const { hydrated, isLoggedIn, saveSearch } = useSavedSearches();
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<AlertFrequency | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const hasActiveFilters = Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v != null && v !== ""
  );

  if (!hydrated || !hasActiveFilters) return null;

  if (!isLoggedIn) {
    return (
      <p className="text-xs text-muted">
        <Link href="/login" className="font-medium text-brand-dark hover:underline">
          Iniciá sesión
        </Link>{" "}
        para guardar esta búsqueda y recibir alertas.
      </p>
    );
  }

  if (status === "saved") {
    return (
      <p className="text-xs text-muted">
        Búsqueda guardada.{" "}
        <Link href="/busquedas-guardadas" className="font-medium text-brand-dark hover:underline">
          Ver mis búsquedas guardadas
        </Link>
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-brand-dark hover:underline"
      >
        Guardar esta búsqueda
      </button>
    );
  }

  async function handleSave() {
    setStatus("saving");
    const { error } = await saveSearch(filters, frequency);
    setStatus(error ? "error" : "saved");
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-3">
      <p className="text-sm font-medium text-foreground">Avisarme cuando haya algo nuevo</p>
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="radio" name="alert-frequency" checked={frequency === null} onChange={() => setFrequency(null)} />
          Solo guardar, sin alertas
        </label>
        {FREQUENCY_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="alert-frequency"
              checked={frequency === opt.value}
              onChange={() => setFrequency(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>

      {status === "error" && <p className="text-xs text-red-600">No se pudo guardar. Probá de nuevo.</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {status === "saving" ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:underline">
          Cancelar
        </button>
      </div>
    </div>
  );
}
