"use client";
import { useEffect, useRef, useState } from "react";

const GRID = 32;
const TRAIL_MS = 2600;
const W_MARGIN = 0.1; // 10% from edges

interface TrailCell {
  id: number;
  col: number;
  row: number;
  born: number;
}

export function FallingAlice() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [trail, setTrail] = useState<TrailCell[]>([]);
  const rafRef = useRef<number>();
  const stateRef = useRef({
    x: 0,
    y: -220,
    vx: 1.2,
    vy: 0.8,
    lastCol: -1,
    lastRow: -1,
    idCounter: 0,
    frameCount: 0,
    W: 0,
    H: 0,
  });

  useEffect(() => {
    const s = stateRef.current;
    s.W = window.innerWidth;
    s.H = window.innerHeight;
    // Start somewhere near top center
    s.x = s.W * 0.4 + Math.random() * s.W * 0.2;
    s.y = -160;
    s.vx = (Math.random() - 0.5) * 2.4;

    const onResize = () => { s.W = window.innerWidth; s.H = window.innerHeight; };
    window.addEventListener("resize", onResize);

    const tick = () => {
      s.frameCount++;
      const minX = s.W * W_MARGIN;
      const maxX = s.W * (1 - W_MARGIN);

      // Gravity
      s.vy = Math.min(s.vy + 0.07, 3.2);

      // Random left/right nudge every ~55 frames → "툭툭" effect
      if (s.frameCount % 55 === 0) {
        const nudge = (Math.random() - 0.5) * 3.5;
        s.vx += nudge;
        // Clamp vx so it doesn't go crazy
        s.vx = Math.max(-4, Math.min(4, s.vx));
      }

      s.x += s.vx;
      s.y += s.vy;

      // Bounce off walls
      if (s.x < minX) { s.x = minX; s.vx = Math.abs(s.vx) * 0.7; }
      if (s.x > maxX) { s.x = maxX; s.vx = -Math.abs(s.vx) * 0.7; }

      // Reset when off bottom
      if (s.y > s.H + 180) {
        s.y = -180;
        s.vy = 0.6 + Math.random() * 0.8;
        s.vx = (Math.random() - 0.5) * 2.4;
        s.x = minX + Math.random() * (maxX - minX);
      }

      setPos({ x: s.x, y: s.y });

      // Grid trail
      const col = Math.floor(s.x / GRID);
      const row = Math.floor(s.y / GRID);
      if (col !== s.lastCol || row !== s.lastRow) {
        s.lastCol = col;
        s.lastRow = row;
        const now = Date.now();
        setTrail(prev => [
          ...prev.filter(c => now - c.born < TRAIL_MS),
          { id: s.idCounter++, col, row, born: now },
        ]);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Expire old trail
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setTrail(prev => prev.filter(c => now - c.born < TRAIL_MS));
    }, 150);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Grid trail */}
      {trail.map(cell => {
        const age = now - cell.born;
        const t = age / TRAIL_MS;
        const alpha = t < 0.1
          ? (t / 0.1) * 0.18
          : 0.18 * Math.pow(1 - t, 1.4);
        if (alpha < 0.003) return null;
        return (
          <div
            key={cell.id}
            style={{
              position: "absolute",
              left: cell.col * GRID,
              top: cell.row * GRID,
              width: GRID,
              height: GRID,
              opacity: alpha,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)
              `,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0",
            }}
          />
        );
      })}

      {/* Alice image */}
      <div
        style={{
          position: "absolute",
          left: pos.x - 55,
          top: pos.y - 100,
          width: 110,
          willChange: "transform",
        }}
      >
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
        />
      </div>
    </div>
  );
}