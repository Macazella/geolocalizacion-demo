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

  return (
    <div className="mb-6">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-background sm:aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element -- fuentes externas con dominios variables */}
        <img src={active} alt="" className="h-full w-full object-cover" />
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
