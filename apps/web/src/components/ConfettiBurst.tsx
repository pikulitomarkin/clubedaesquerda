"use client";

import { useMemo } from "react";

// Sobrevoo de confete + purpurina para o popup de match. Implementado sem
// dependência nova (evita mexer no lockfile do pnpm só por um efeito
// visual): partículas são <span> posicionadas e animadas via CSS puro,
// geradas uma vez por partícula (useMemo) para não re-sortear a cada
// re-render do popup.
const CORES = ["#e94f7a", "#f5b692", "#7b3fa0", "#2e7d32", "#1976d2", "#f9a825"];

interface Particula {
  left: number; // % horizontal de partida
  delay: number; // s
  duration: number; // s
  size: number; // px
  color: string;
  rotate: number; // deg final
  tipo: "confete" | "purpurina";
}

export function ConfettiBurst({ count = 70 }: { count?: number }) {
  const particulas = useMemo<Particula[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.2 + Math.random() * 1.4,
        size: 6 + Math.random() * 8,
        color: CORES[Math.floor(Math.random() * CORES.length)] ?? "#e94f7a",
        rotate: Math.random() * 720 - 360,
        tipo: Math.random() > 0.7 ? "purpurina" : "confete",
      })),
    [count],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {particulas.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-[-5%]"
          style={
            {
              left: `${p.left}%`,
              width: p.tipo === "confete" ? `${p.size}px` : `${p.size * 0.6}px`,
              height: p.tipo === "confete" ? `${p.size * 0.5}px` : `${p.size * 0.6}px`,
              backgroundColor: p.color,
              borderRadius: p.tipo === "purpurina" ? "50%" : "1px",
              boxShadow: p.tipo === "purpurina" ? `0 0 4px ${p.color}` : undefined,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--rotate-final": `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
