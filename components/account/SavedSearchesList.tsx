"use client";

import Link from "next/link";
import { useSavedSearches, type AlertFrequency } from "@/lib/savedSearches/useSavedSearches";
import { searchParamsFromFilters, summarizeFilters } from "@/lib/filters/filterProperties";
import { GlideSelect } from "@/components/reactbits/GlideSelect";

const FREQUENCY_LABELS: Record<AlertFrequency, string> = {
  IMMEDIATE: "Inmediata",
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
};

const FREQUENCY_SELECT_OPTIONS = [
  { value: "", label: "Sin alertas" },
  { value: "IMMEDIATE", label: "Inmediata" },
  { value: "DAILY", label: "Diaria" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensual" },
];

export function SavedSearchesList() {
  const { searches, hydrated, isLoggedIn, removeSearch, updateAlert } = useSavedSearches();

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-brand-dark hover:underline">
          Iniciá sesión
        </Link>{" "}
        para guardar búsquedas y recibir alertas.
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        Todavía no guardaste ninguna búsqueda. Andá a{" "}
        <Link href="/buscar" className="font-medium text-brand-dark hover:underline">
          Buscar
        </Link>
        , armá tus filtros y tocá &quot;Guardar esta búsqueda&quot;.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((s) => (
        <div key={s.search_id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{summarizeFilters(s.filters)}</p>
              <p className="mt-1 text-xs text-muted">
                {s.alert_enabled && s.alert_frequency
                  ? `Alerta ${FREQUENCY_LABELS[s.alert_frequency].toLowerCase()}`
                  : "Sin alertas"}
              </p>
            </div>
            <Link
              href={`/buscar?${searchParamsFromFilters(s.filters).toString()}`}
              className="whitespace-nowrap text-sm font-medium text-brand-dark hover:underline"
            >
              Ver resultados
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <div className="w-40">
              <GlideSelect
                ariaLabel={`Frecuencia de alerta para ${summarizeFilters(s.filters)}`}
                size="sm"
                value={s.alert_frequency ?? ""}
                options={FREQUENCY_SELECT_OPTIONS}
                onChange={(value) => updateAlert(s.search_id, value === "" ? null : (value as AlertFrequency))}
              />
            </div>
            <button type="button" onClick={() => removeSearch(s.search_id)} className="text-sm text-red-600 hover:underline">
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
