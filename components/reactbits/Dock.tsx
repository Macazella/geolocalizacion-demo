"use client";

// Adaptado de React Bits "Dock" (https://reactbits.dev/components/dock,
// licencia MIT) -- misma logica de magnificacion por proximidad al
// mouse, reescrito a TypeScript, con los items navegando con next/link
// en vez de onClick de ejemplo, y coloreado con los tokens del proyecto
// (teal, ver app/globals.css) en vez del tema oscuro/violeta original.
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, type MotionValue } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import "./Dock.css";

export interface DockItemDef {
  href: string;
  label: string;
  icon: ReactNode;
}

interface DockItemProps {
  item: DockItemDef;
  mouseX: MotionValue<number>;
  spring: { mass: number; stiffness: number; damping: number };
  distance: number;
  magnification: number;
  baseItemSize: number;
}

function DockItem({ item, mouseX, spring, distance, magnification, baseItemSize }: DockItemProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div style={{ width: size, height: size }} className="dock-item-wrapper">
      <Link
        ref={ref}
        href={item.href}
        aria-label={item.label}
        className="dock-item"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <span className="dock-icon">{item.icon}</span>
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -8 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.15 }}
              className="dock-label"
              role="tooltip"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}

export function Dock({
  items,
  magnification = 44,
  distance = 120,
  baseItemSize = 34,
}: {
  items: DockItemDef[];
  magnification?: number;
  distance?: number;
  baseItemSize?: number;
}) {
  const mouseX = useMotionValue(Infinity);
  const spring = { mass: 0.1, stiffness: 150, damping: 12 };

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="dock-panel"
      role="toolbar"
      aria-label="Navegación"
    >
      {items.map((item) => (
        <DockItem
          key={item.href}
          item={item}
          mouseX={mouseX}
          spring={spring}
          distance={distance}
          magnification={magnification}
          baseItemSize={baseItemSize}
        />
      ))}
    </motion.div>
  );
}

export default Dock;
