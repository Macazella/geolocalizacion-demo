"use client";

// Adaptado de React Bits "Crosshair" (https://reactbits.dev/animations/crosshair,
// licencia MIT), reescrito a TypeScript. Acotado a un contenedor (el
// logo del header) en vez de a toda la ventana -- mismo uso que el
// propio ejemplo del componente (prop containerRef).
import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

function getMousePos(e: MouseEvent, container: HTMLElement | null) {
  if (container) {
    const bounds = container.getBoundingClientRect();
    return { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
  }
  return { x: e.clientX, y: e.clientY };
}

export function Crosshair({
  containerRef,
  color = "var(--brand)",
}: {
  containerRef: RefObject<HTMLElement | null>;
  color?: string;
}) {
  const lineHorizontalRef = useRef<HTMLDivElement>(null);
  const lineVerticalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mouse = { x: 0, y: 0 };
    const renderedStyles = {
      tx: { current: 0, amt: 0.2 },
      ty: { current: 0, amt: 0.2 },
    };
    let rafId: number;

    const handleMouseMove = (ev: MouseEvent) => {
      mouse = getMousePos(ev, container);
    };

    const render = () => {
      renderedStyles.tx.current = lerp(renderedStyles.tx.current, mouse.x, renderedStyles.tx.amt);
      renderedStyles.ty.current = lerp(renderedStyles.ty.current, mouse.y, renderedStyles.ty.amt);

      if (lineVerticalRef.current) gsap.set(lineVerticalRef.current, { x: renderedStyles.tx.current });
      if (lineHorizontalRef.current) gsap.set(lineHorizontalRef.current, { y: renderedStyles.ty.current });

      rafId = requestAnimationFrame(render);
    };

    const onEnter = () => {
      gsap.to([lineHorizontalRef.current, lineVerticalRef.current], { opacity: 1, duration: 0.3 });
    };
    const onLeave = () => {
      gsap.to([lineHorizontalRef.current, lineVerticalRef.current], { opacity: 0, duration: 0.3 });
    };

    gsap.set([lineHorizontalRef.current, lineVerticalRef.current], { opacity: 0 });
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(render);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden="true">
      <div
        ref={lineHorizontalRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 1, background: color, opacity: 0 }}
      />
      <div
        ref={lineVerticalRef}
        style={{ position: "absolute", top: 0, left: 0, width: 1, height: "100%", background: color, opacity: 0 }}
      />
    </div>
  );
}

export default Crosshair;
