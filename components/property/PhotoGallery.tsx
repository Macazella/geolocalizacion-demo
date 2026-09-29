"use client";

// Galeria simple: foto principal + tira de miniaturas para cambiarla.
// Sin librerias de carousel -- las fuentes traen entre 1 y ~10 fotos,
// no justifica el peso de una dependencia nueva. Si no hay fotos, no
// renderiza nada (no hay placeholder acá -- el mapa/atributos ya
// comunican bien la ficha sin foto, a diferencia de la tarjeta de
// lista donde el placeholder mantiene la grilla prolija).
import { useState } from "react";

export function PhotoGallery({ photoUrls }: { photoUrls: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (photoUrls.length === 0) return null;

  const active = photoUrls[Math.min(activeIndex, photoUrls.length - 1)];
  const hasMultiple = photoUrls.length > 1;
  // Circular -- de la ultima foto "siguiente" vuelve a la primera y
  // viceversa, para no dejar la flecha muerta en las puntas.
  const goPrev = () => setActiveIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length);
  const goNext = () => setActiveIndex((i) => (i + 1) % photoUrls.length);

  return (
    <div className="mb-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-background sm:aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element -- fuentes externas con dominios variables */}
        <img src={active} alt="" className="h-full w-full object-cover" />
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
              {activeIndex + 1} / {photoUrls.length}
            </span>
          </>
        )}
      </div>

      {photoUrls.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photoUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver foto ${index + 1} de ${photoUrls.length}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === activeIndex ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
