"use client";

// Adaptado de React Bits "Line Sidebar" (https://reactbits.dev/components/line-sidebar,
// licencia MIT): mismo efecto de proximidad al cursor (un rAF loop
// suaviza --effect por item), pero reescrito para seleccion MULTIPLE
// con checkbox real en vez de una unica seccion activa -- pedido
// explicito de Maga ("para cuando haya que seleccionar casa, tipo,
// caracteristicas... junto con el checkbox de opcion multiple").
import { useCallback, useEffect, useRef } from "react";
import "./CheckboxLineList.css";

export interface LineListItem {
  value: string;
  label: string;
}

const FALLOFF = (p: number) => p * p * (3 - 2 * p); // "smooth" del original

export function CheckboxLineList({
  items,
  checkedValues,
  onToggle,
  proximityRadius = 60,
  className = "",
}: {
  items: LineListItem[];
  checkedValues: string[];
  onToggle: (value: string) => void;
  proximityRadius?: number;
  className?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targets = useRef<number[]>([]);
  const current = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  // Ref (no useCallback) a proposito -- el loop se llama a si mismo
  // via requestAnimationFrame, y con useCallback ESLint marca "usada
  // antes de declararse" (react-hooks/immutability) porque la funcion
  // se referencia a si misma en su propio cuerpo.
  const runFrameRef = useRef<() => void>(() => {});
  useEffect(() => {
    // Se define una sola vez -- solo lee refs en el momento en que se
    // llama, nunca closurea sobre props/estado que cambien por render.
    runFrameRef.current = () => {
      let moving = false;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = targets.current[i] || 0;
        const cur = current.current[i] || 0;
        const next = cur + (target - cur) * 0.25;
        const settled = Math.abs(target - next) < 0.002;
        const value = settled ? target : next;
        current.current[i] = value;
        el.style.setProperty("--effect", value.toFixed(4));
        if (!settled) moving = true;
      });
      rafRef.current = moving ? requestAnimationFrame(() => runFrameRef.current()) : null;
    };
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(() => runFrameRef.current());
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const center = el.offsetTop + el.offsetHeight / 2;
        const distance = Math.abs(pointerY - center);
        targets.current[i] = FALLOFF(Math.max(0, 1 - distance / proximityRadius));
      });
      startLoop();
    },
    [proximityRadius, startLoop]
  );

  const handlePointerLeave = useCallback(() => {
    targets.current = targets.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return (
    <ul
      ref={listRef}
      className={`checkbox-line-list ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {items.map((item, index) => {
        const checked = checkedValues.includes(item.value);
        return (
          <li
            key={item.value}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="checkbox-line-list__item"
          >
            <label className="checkbox-line-list__label">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.value)}
                className="checkbox-line-list__input"
              />
              <span className="checkbox-line-list__marker" aria-hidden="true" />
              <span className="checkbox-line-list__text">{item.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export default CheckboxLineList;
