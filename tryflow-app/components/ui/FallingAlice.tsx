"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const ALICE_SRC = "/alice.png";
const ROLL_DURATION_S = 0.88;
const ROLL_DURATION_MS = Math.round(ROLL_DURATION_S * 1000);
const LERP = 0.12;
const COLLISION_DIST = 65;
const ITEM_SIZE = 56;

interface FloatingItem {
  id: number;
  type: "cake" | "drink";
  x: number;
  y: number;
  vx: number;
  vy: number;
  frameCount: number;
}

export function FallingAlice() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [spinNonce, setSpinNonce] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [items, setItems] = useState<FloatingItem[]>([]);
  const [aliceScale, setAliceScale] = useState(1);

  const rafRef = useRef<number>();
  const targetRef = useRef({ x: -200, y: -200 });
  const displayRef = useRef({ x: -200, y: -200 });
  const itemsRef = useRef<FloatingItem[]>([]);
  const itemIdRef = useRef(0);
  const scaleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Track mouse
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Main loop: smooth follow + item movement + collision
  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const t = targetRef.current;
      const d = displayRef.current;
      const nx = d.x + (t.x - d.x) * LERP;
      const ny = d.y + (t.y - d.y) * LERP;
      displayRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });

      // Move items + collision
      if (itemsRef.current.length > 0) {
        let collided = false;
        let collisionType: "cake" | "drink" = "cake";
        const W = window.innerWidth;
        const H = window.innerHeight;
        const survived: FloatingItem[] = [];

        for (const item of itemsRef.current) {
          let { vx, vy, frameCount } = item;

          // Random direction nudge every ~120 frames
          frameCount++;
          if (frameCount % 120 === 0) {
            vx += (Math.random() - 0.5) * 1.2;
            vy += (Math.random() - 0.5) * 1.2;
            const spd = Math.sqrt(vx * vx + vy * vy);
            if (spd > 1.8) { vx = (vx / spd) * 1.8; vy = (vy / spd) * 1.8; }
          }

          let ix = item.x + vx;
          let iy = item.y + vy;

          // Bounce off edges
          if (ix < 0) { ix = 0; vx = Math.abs(vx); }
          if (ix > W) { ix = W; vx = -Math.abs(vx); }
          if (iy < 0) { iy = 0; vy = Math.abs(vy); }
          if (iy > H) { iy = H; vy = -Math.abs(vy); }

          const dx = nx - ix;
          const dy = ny - iy;
          if (Math.sqrt(dx * dx + dy * dy) < COLLISION_DIST) {
            collided = true;
            collisionType = item.type;
            continue;
          }
          survived.push({ ...item, x: ix, y: iy, vx, vy, frameCount });
        }

        itemsRef.current = survived;
        setItems([...survived]);

        if (collided) {
          const newScale = collisionType === "cake" ? 1.9 : 0.5;
          setAliceScale(newScale);
          if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
          scaleTimeoutRef.current = setTimeout(() => setAliceScale(1), 2800);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Spawn items
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const spawn = () => {
      const delay = 4000 + Math.random() * 5000;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const type: "cake" | "drink" = Math.random() < 0.5 ? "cake" : "drink";
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 0.8;
        const newItem: FloatingItem = {
          id: itemIdRef.current++,
          type,
          x: W * 0.1 + Math.random() * W * 0.8,
          y: H * 0.1 + Math.random() * H * 0.8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          frameCount: 0,
        };
        itemsRef.current = [...itemsRef.current, newItem];
        setItems([...itemsRef.current]);
        spawn();
      }, delay);
    };

    spawn();
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, []);

  // Occasional roll
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

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Floating items */}
      {items.map(item => (
        <div
          key={item.id}
          style={{
            position: "absolute",
            zIndex: 2,
            left: item.x - ITEM_SIZE / 2,
            top: item.y - ITEM_SIZE / 2,
            width: ITEM_SIZE,
            height: ITEM_SIZE,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.type === "cake" ? "/eattme.png" : "/drink-removebg-preview.png"}
            alt={item.type}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              filter: "grayscale(100%) contrast(1.3)",
              mixBlendMode: "multiply",
              userSelect: "none",
            }}
          />
        </div>
      ))}

      {/* Alice */}
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          left: pos.x - 55,
          top: pos.y - 100,
          width: 110,
          willChange: "transform",
          transform: `scale(${aliceScale})`,
          transition: "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
              filter: "grayscale(100%) contrast(1.4)",
              mixBlendMode: "multiply",
              userSelect: "none",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}