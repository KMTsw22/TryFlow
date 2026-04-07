"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const GRID = 32;
const TRAIL_MS = 1800;
const W_MARGIN = 0.1; // 10% from edges
const ALICE_SRC = "/alice.png";
/** Grid lines — avoid pure black “cells” on white */
const GRID_LINE = "rgba(0,0,0,0.1)";
const TRAIL_PEAK_ALPHA = 0.14;
const TRAIL_FADE_IN = 0.22;
const ROLL_DURATION_S = 0.88;
const ROLL_DURATION_MS = Math.round(ROLL_DURATION_S * 1000);

interface TrailCell {
  id: number;
  col: number;
  row: number;
  born: number;
}

export function FallingAlice() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [trail, setTrail] = useState<TrailCell[]>([]);
  /** Full roll animation (reset key after so idle rotate doesn’t jump from 360°) */
  const [spinNonce, setSpinNonce] = useState(0);
  const [rolling, setRolling] = useState(false);
  /** Trail only after Alice bitmap is decoded (no grid before the figure) */
  const trailAllowedRef = useRef(false);
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
    s.x = s.W * 0.4 + Math.random() * s.W * 0.2;
    s.y = -160;
    s.vx = (Math.random() - 0.5) * 2.4;

    const onResize = () => {
      s.W = window.innerWidth;
      s.H = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    let cancelled = false;
    let loopStarted = false;

    const tick = () => {
      if (cancelled) return;
      s.frameCount++;
      const minX = s.W * W_MARGIN;
      const maxX = s.W * (1 - W_MARGIN);

      s.vy = Math.min(s.vy + 0.07, 3.2);

      if (s.frameCount % 55 === 0) {
        const nudge = (Math.random() - 0.5) * 3.5;
        s.vx += nudge;
        s.vx = Math.max(-4, Math.min(4, s.vx));
      }

      s.x += s.vx;
      s.y += s.vy;

      if (s.x < minX) { s.x = minX; s.vx = Math.abs(s.vx) * 0.7; }
      if (s.x > maxX) { s.x = maxX; s.vx = -Math.abs(s.vx) * 0.7; }

      if (s.y > s.H + 180) {
        s.y = -180;
        s.vy = 0.6 + Math.random() * 0.8;
        s.vx = (Math.random() - 0.5) * 2.4;
        s.x = minX + Math.random() * (maxX - minX);
      }

      setPos({ x: s.x, y: s.y });

      const col = Math.floor(s.x / GRID);
      const row = Math.floor(s.y / GRID);
      if (trailAllowedRef.current) {
        if (col !== s.lastCol || row !== s.lastRow) {
          s.lastCol = col;
          s.lastRow = row;
          const now = Date.now();
          setTrail(prev => [
            ...prev.filter(c => now - c.born < TRAIL_MS),
            { id: s.idCounter++, col, row, born: now },
          ]);
        }
      } else {
        s.lastCol = col;
        s.lastRow = row;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (cancelled || loopStarted) return;
      loopStarted = true;
      trailAllowedRef.current = true;
      setTrail([]);
      rafRef.current = requestAnimationFrame(tick);
    };

    const warmDecode = () => {
      if (cancelled || loopStarted) return;
      const im = new Image();
      im.onload = () => {
        if (cancelled || loopStarted) return;
        const d = im.decode?.();
        if (d && typeof (d as Promise<void>).then === "function") {
          (d as Promise<void>).then(startLoop).catch(startLoop);
        } else {
          startLoop();
        }
      };
      im.onerror = startLoop;
      im.src = ALICE_SRC;
      if (im.complete && im.naturalWidth > 0) {
        im.onload = null;
        const d = im.decode?.();
        if (d && typeof (d as Promise<void>).then === "function") {
          (d as Promise<void>).then(startLoop).catch(startLoop);
        } else {
          startLoop();
        }
      }
    };

    warmDecode();

    return () => {
      cancelled = true;
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

  // Occasional tumble / full roll, then gentle idle sway
  useEffect(() => {
    let cancelled = false;
    let waitId: ReturnType<typeof setTimeout>;
    let rollEndId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = 4200 + Math.random() * 5800;
      waitId = setTimeout(() => {
        if (cancelled) return;
        setRolling(true);
        rollEndId = setTimeout(() => {
          if (cancelled) return;
          setRolling(false);
          setSpinNonce((n) => n + 1);
          schedule();
        }, ROLL_DURATION_MS);
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(waitId);
      clearTimeout(rollEndId);
    };
  }, []);

  const now = Date.now();

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Trail behind Alice so the figure never reads as "under" the grid */}
      {trail.map(cell => {
        const age = now - cell.born;
        const t = age / TRAIL_MS;
        const alpha = t < TRAIL_FADE_IN
          ? (t / TRAIL_FADE_IN) * TRAIL_PEAK_ALPHA
          : TRAIL_PEAK_ALPHA * Math.pow(1 - t, 1.4);
        if (alpha < 0.003) return null;
        return (
          <div
            key={cell.id}
            style={{
              position: "absolute",
              zIndex: 0,
              left: cell.col * GRID,
              top: cell.row * GRID,
              width: GRID,
              height: GRID,
              opacity: alpha,
              backgroundImage: `
                linear-gradient(${GRID_LINE} 1px, transparent 1px),
                linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)
              `,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0",
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          zIndex: 1,
          left: pos.x - 55,
          top: pos.y - 100,
          width: 110,
          willChange: "transform",
        }}
      >
        <motion.div
          key={spinNonce}
          initial={false}
          animate={
            rolling
              ? { rotate: [0, 180, 360], y: [0, -14, 8, 0], scaleY: [1, 0.88, 1] }
              : { rotate: [-5, 5, -5], y: [0, 6, 0] }
          }
          transition={
            rolling
              ? { duration: ROLL_DURATION_S, ease: [0.33, 0, 0.2, 1] as const }
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
          style={{ transformOrigin: "50% 45%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ALICE_SRC}
            alt=""
            draggable={false}
            fetchPriority="high"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              filter: "grayscale(100%) contrast(1.1)",
              mixBlendMode: "multiply",
              userSelect: "none",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}