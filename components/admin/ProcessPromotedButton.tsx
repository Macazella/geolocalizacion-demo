"use client";

import { useState, useTransition } from "react";
import { dispatchCandidatePromotion } from "@/app/admin/monitoring/actions";

// Dispara el workflow promote_candidates.yml (repo privado). No hay
// polling de estado en vivo -- confirmamos que GitHub aceptó el pedido
// y mandamos a revisar el progreso en Actions a mano, mismo patrón que
// ya usa Maga para monitor.yml.
export function ProcessPromotedButton({ disabled }: { disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await dispatchCandidatePromotion();
      if (res.ok) {
        setResult({ ok: true, message: "Disparado. Revisá el progreso en unos minutos en Actions." });
      } else {
        setResult({ ok: false, message: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Disparando…" : "Procesar promovidos"}
      </button>
      {result && (
        <div className="text-right text-xs">
          <p className={result.ok ? "text-muted" : "text-red-600"}>{result.message}</p>
          {result.ok && (
            <a
              href="https://github.com/Macazella/GEOLOCALIZACION-Propiedades-Private/actions/workflows/promote_candidates.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Ver en GitHub Actions →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
