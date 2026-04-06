"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface TrailCell {
  id: number;
  x: number; // grid cell col
  y: number; // grid cell row
  born: number; // timestamp
}

const GRID = 28;        // grid cell size px
const TRAIL_DURATION = 2800; // ms each mark stays

export function CursorAlice() {
  const [mouse, setMouse] = useState({ x: -999, y: -999 });
  const [display, setDisplay] = useState({ x: -999, y: -999 }); // smoothed
  const [trail, setTrail] = useState<TrailCell[]>([]);
  const rafRef = useRef<number>();
  const targetRef = useRef({ x: -999, y: -999 });
  const displayRef = useRef({ x: -999, y: -999 });
  const idRef = useRef(0);
  const lastCellRef = useRef({ x: -1, y: -1 });

  // Track raw mouse
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Smooth follow loop
  useEffect(() => {
    const tick = () => {
      const t = targetRef.current;
      const d = displayRef.current;
      const nx = d.x + (t.x - d.x) * 0.14;
      const ny = d.y + (t.y - d.y) * 0.14;
      displayRef.current = { x: nx, y: ny };
      setDisplay({ x: nx, y: ny });

      // Grid cell at current position
      const cellX = Math.floor(nx / GRID);
      const cellY = Math.floor(ny / GRID);
      if (cellX !== lastCellRef.current.x || cellY !== lastCellRef.current.y) {
        lastCellRef.current = { x: cellX, y: cellY };
        const now = Date.now();
        const newId = idRef.current++;
        setTrail(prev => [
          ...prev.filter(c => now - c.born < TRAIL_DURATION),
          { id: newId, x: cellX, y: cellY, born: now },
        ]);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Expire old trail cells
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrail(prev => prev.filter(c => now - c.born < TRAIL_DURATION));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();

  return (
    <>
      {/* ── Grid trail marks ── */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        {trail.map(cell => {
          const age = now - cell.born;
          const t = Math.min(1, age / TRAIL_DURATION);
          // fade: quick in, slow out
          const alpha = t < 0.12
            ? (t / 0.12) * 0.22
            : 0.22 * Math.pow(1 - (t - 0.12) / 0.88, 1.6);

          return (
            <div
              key={cell.id}
              style={{
                position: "absolute",
                left: cell.x * GRID,
                top: cell.y * GRID,
                width: GRID,
                height: GRID,
                opacity: alpha,
                // Grid crosshatch inside cell
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.9) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.9) 1px, transparent 1px)
                `,
                backgroundSize: "7px 7px",
                backgroundPosition: "center center",
              }}
            />
          );
        })}
      </div>

      {/* ── Alice image following cursor ── */}
      <div
        className="fixed pointer-events-none z-40"
        style={{
          left: display.x - 32,
          top: display.y - 80,
          width: 64,
          transition: "none",
          willChange: "transform",
        }}
      >
        {/* Use /alice.png — drop a Tenniel illustration into /public/alice.png */}
        {/* Fallback: show nothing if image missing (img onerror hides it) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/alice.png"
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "auto",
            filter: "grayscale(100%) contrast(1.1)",
            mixBlendMode: "multiply",
            userSelect: "none",
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    </>
  );
}