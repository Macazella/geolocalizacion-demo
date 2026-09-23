"use client";

// Adaptado de React Bits "Magic Bento" (https://reactbits.dev/components/magic-bento,
// licencia MIT): se toma solo el efecto de "border glow" que sigue al
// cursor (el resto -- particulas, tilt 3D, magnetismo -- se descarta a
// proposito para una LISTA de muchas tarjetas, donde seria pesado y
// distraeria del click real a la ficha). Reescrito a TypeScript, color
// teal del proyecto en vez de violeta.
import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import "./BentoCard.css";

const GLOW_RADIUS = 220;

export function BentoCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--glow-x", `${x}%`);
    el.style.setProperty("--glow-y", `${y}%`);
  };

  const handleMouseEnter = () => {
    gsap.to(ref.current, { "--glow-intensity": 1, duration: 0.2, ease: "power2.out" });
  };
  const handleMouseLeave = () => {
    gsap.to(ref.current, { "--glow-intensity": 0, duration: 0.3, ease: "power2.out" });
  };

  return (
    <div
      ref={ref}
      className={`bento-card ${className}`}
      style={{ "--glow-radius": `${GLOW_RADIUS}px` } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

export default BentoCard;
