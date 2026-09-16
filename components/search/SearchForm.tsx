"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Location } from "@/types/property";
import { TIPOS } from "@/types/property";
import { tipoLabel } from "@/lib/formatters/format";

interface SearchFormProps {
  locations: Location[];
}

// Los selects geográficos se derivan SIEMPRE de `locations` -- nunca
// un array hardcodeado dentro del componente (brief P1 §21). Agregar
// una zona nueva es una fila más en locations.json, nunca un cambio acá.
export function SearchForm({ locations }: SearchFormProps) {
  const router = useRouter();
  const [province, setProvince] = useState("");
  const [partido, setPartido] = useState("");
  const [locality, setLocality] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);

  const provinces = useMemo(() => [...new Set(locations.map((l) => l.province))], [locations]);
  const partidos = useMemo(
    () => [...new Set(locations.filter((l) => !province || l.province === province).map((l) => l.partido))],
    [locations, province]
  );
  const localities = useMemo(
    () => locations.filter((l) => !partido || l.partido === partido).map((l) => l.locality),
    [locations, partido]
  );

  function toggleTipo(tipo: string) {
    setTipos((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (province) params.set("province", province);
    if (partido) params.set("partido", partido);
    if (locality) params.set("locality", locality);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (tipos.length) params.set("tipos", tipos.join(","));
    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select label="Provincia" value={province} onChange={(v) => { setProvince(v); setPartido(""); setLocality(""); }} options={provinces} />
        <Select label="Partido" value={partido} onChange={(v) => { setPartido(v); setLocality(""); }} options={partidos} />
        <Select label="Localidad" value={locality} onChange={setLocality} options={localities} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Precio mínimo (USD)</label>
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            placeholder="40.000"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Precio máximo (USD)</label>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            placeholder="60.000"
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="mb-1 block text-sm font-medium text-foreground">Tipo</span>
        <div className="flex flex-wrap gap-3">
          {TIPOS.map((tipo) => (
            <label key={tipo} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={tipos.includes(tipo)}
                onChange={() => toggleTipo(tipo)}
                className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
              />
              {tipoLabel(tipo)}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark sm:w-auto"
      >
        Buscar propiedades
      </button>
    </form>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
      >
        <option value="">Todas</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
