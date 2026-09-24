"use client";

// Envuelve PixelSnow y lo apaga en /admin/*: en una pagina de datos
// densa (tablas de monitoring, URLs, ids) cualquier punto de confeti
// visible ensucia la lectura, mas alla de que tecnicamente quede
// detras del contenido -- mismo criterio ya aplicado a /buscar (ahi
// ni hace falta apagarlo a mano, los paneles ya lo tapan del todo).
import { usePathname } from "next/navigation";
import { PixelSnow } from "./PixelSnow";

export function BackgroundDecoration() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <PixelSnow />
    </div>
  );
}
