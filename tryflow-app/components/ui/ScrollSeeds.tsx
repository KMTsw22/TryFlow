"use client";
import { useEffect, useRef } from "react";

// Snow-like particles: small, irregular, follow scroll like falling snow
const SNOW_COUNT = 28;
// Landing ripple spots: only 5, small and irregular
const LAND_COUNT = 5;
const CONVERGE_START = 0.82;
const BLOOM_START = 0.93;

interface Snow {
  x: number;
  y: number;
  vx: number;   // horizontal drift
  fallSpeed: number; // individual fall speed
  size: number;
  opacity: number;
  phase: number;
  parallax: number; // 0.1–0.4: how much it follows scroll
}

interface LandSpot {
  x: number;
  y: number;        // current screen y
  groundX: number;
  landed: boolean;
  ripples: Array<{ r: number; alpha: number; maxR: number; speed: number; delay: number; born: number }>;
}

export function ScrollSeeds() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxRaw = canvas.getContext("2d");
    if (!ctxRaw) return;
    const ctx = ctxRaw as CanvasRenderingContext2D;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    let frame = 0;
    let animId: number;
    let lastScrollY = window.scrollY;
    let scrollVel = 0;

    function rnd(min: number, max: number) {
      return min + Math.random() * (max - min);
    }

    // Snow particles — small, white, snow-like
    const snow: Snow[] = Array.from({ length: SNOW_COUNT }, () => ({
      x: rnd(0, W),
      y: rnd(0, H),
      vx: rnd(-0.15, 0.15),
      fallSpeed: rnd(0.08, 0.28),
      size: rnd(0.6, 1.8),
      opacity: rnd(0.08, 0.28),
      phase: rnd(0, Math.PI * 2),
      parallax: rnd(0.12, 0.38),
    }));

    // Landing spots — 5 points where ripples appear at bottom
    const landSpots: LandSpot[] = Array.from({ length: LAND_COUNT }, (_, i) => ({
      x: rnd(0, W),
      y: rnd(H * 0.2, H * 0.7),
      groundX: W * (0.1 + (i / (LAND_COUNT - 1)) * 0.8) + rnd(-W * 0.05, W * 0.05),
      landed: false,
      ripples: [],
    }));

    function getScrollProg() {
      const max = document.documentElement.scrollHeight - H;
      return max > 0 ? Math.min(1, window.scrollY / max) : 0;
    }

    function draw() {
      frame++;
      const sp = getScrollProg();
      const currentScrollY = window.scrollY;
      scrollVel = (currentScrollY - lastScrollY) * 0.3;
      lastScrollY = currentScrollY;

      ctx.clearRect(0, 0, W, H);

      const groundY = H * 0.82;

      // Reset on scroll up
      if (sp < BLOOM_START - 0.04) {
        landSpots.forEach((ls) => {
          ls.landed = false;
          ls.ripples = [];
        });
      }

      // ── Snow particles ──
      snow.forEach((s) => {
        // Natural irregular fall + scroll parallax
        s.x += s.vx + Math.sin(frame * 0.006 + s.phase) * 0.18;
        s.y += s.fallSpeed + scrollVel * s.parallax;

        // Wrap
        if (s.y > H + 10) s.y = -8;
        if (s.x > W + 8) s.x = -8;
        if (s.x < -8) s.x = W + 8;

        // Fade as scroll progresses (stars "settle")
        const alpha = s.opacity * Math.max(0, 1 - sp * 1.4);
        if (alpha < 0.01) return;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 245, 255, ${alpha})`;
        ctx.fill();
      });

      // ── Landing spots + ripples ──
      landSpots.forEach((ls) => {
        if (sp < CONVERGE_START) {
          // Drift gently with snow
          ls.x += Math.sin(frame * 0.004 + ls.x * 0.01) * 0.12;
          ls.y += 0.06 + scrollVel * 0.2;
          if (ls.y > H + 10) ls.y = -10;

          const alpha = 0.18 * Math.max(0, 1 - sp * 1.5);
          ctx.beginPath();
          ctx.arc(ls.x, ls.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
          ctx.fill();

        } else if (sp < BLOOM_START) {
          // Converge toward ground
          ls.x += (ls.groundX - ls.x) * 0.04;
          ls.y += (groundY - ls.y) * 0.04;

          const t = (sp - CONVERGE_START) / (BLOOM_START - CONVERGE_START);
          const alpha = 0.25 * (1 - t * 0.5);
          ctx.beginPath();
          ctx.arc(ls.x, ls.y, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
          ctx.fill();

        } else {
          // Landing
          ls.x += (ls.groundX - ls.x) * 0.12;
          ls.y += (groundY - ls.y) * 0.12;

          if (!ls.landed && Math.abs(ls.y - groundY) < 3) {
            ls.landed = true;
            // 4 rings staggered — each takes ~2s to expand and fade
            ls.ripples = Array.from({ length: 4 }, (_, j) => ({
              r: 0,
              alpha: 0,
              maxR: rnd(55, 95) + j * 18,
              speed: rnd(0.52, 0.72) - j * 0.06,
              delay: j * 14, // frame delay between rings
              born: 0,
            }));
          }

          if (!ls.landed) {
            ctx.beginPath();
            ctx.arc(ls.x, ls.y, 1.4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(200, 220, 255, 0.4)";
            ctx.fill();
          } else {
            ls.ripples.forEach((rp: any) => {
              rp.born++;
              if (rp.born < rp.delay) return;

              // Kick alpha on first active frame
              if (rp.alpha === 0) rp.alpha = 0.72;

              if (rp.r < rp.maxR) rp.r += rp.speed;
              // Fade: slow start, fast at end — 2s total ≈ 120 frames @60fps
              const progress = rp.r / rp.maxR;
              rp.alpha = Math.max(0, 0.72 * Math.pow(1 - progress, 1.4));

              if (rp.alpha < 0.005) return;

              const rx = rp.r;
              const ry = rp.r * 0.32; // flat ellipse for ground perspective

              // Gradient stroke: bright center → transparent edge
              const grad = ctx.createRadialGradient(
                ls.groundX, groundY, Math.max(0, rx - 12),
                ls.groundX, groundY, rx + 8
              );
              grad.addColorStop(0, `rgba(180, 225, 255, ${rp.alpha})`);
              grad.addColorStop(0.5, `rgba(130, 200, 255, ${rp.alpha * 0.6})`);
              grad.addColorStop(1, `rgba(100, 180, 240, 0)`);

              ctx.save();
              ctx.scale(1, ry / rx); // squish to ellipse
              ctx.beginPath();
              ctx.arc(ls.groundX, groundY * (rx / ry), rx, 0, Math.PI * 2);
              ctx.strokeStyle = grad;
              ctx.lineWidth = 2.5 * (1 - progress * 0.5);
              ctx.stroke();
              ctx.restore();
            });
          }
        }
      });

      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
      }}
    />
  );
}