"use client";
import { useEffect, useRef } from "react";

const STAR_COUNT = 38;
const CONVERGE_START = 0.80;
const BLOOM_START = 0.92;

const PALETTE = [
  { r: 255, g: 243, b: 180 },
  { r: 254, g: 240, b: 138 },
  { r: 255, g: 249, b: 195 },
  { r: 252, g: 211, b: 77 },
  { r: 255, g: 237, b: 160 },
];

interface Ripple {
  r: number;
  alpha: number;
  speed: number;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  phase: number;
  color: { r: number; g: number; b: number };
  groundX: number;
  landed: boolean;
  ripples: Ripple[];
  glowAlpha: number;
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

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: rnd(0, W),
      y: rnd(0, H * 0.9),
      vx: rnd(-0.12, 0.12),
      vy: rnd(-0.04, 0.04),
      size: rnd(1, 2.8),
      opacity: rnd(0.18, 0.52),
      phase: rnd(0, Math.PI * 2),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      groundX: rnd(W * 0.06, W * 0.94),
      landed: false,
      ripples: [],
      glowAlpha: 0,
    }));

    function getScrollProg() {
      const max = document.documentElement.scrollHeight - H;
      return max > 0 ? Math.min(1, window.scrollY / max) : 0;
    }

    function drawStar(
      x: number,
      y: number,
      size: number,
      alpha: number,
      color: { r: number; g: number; b: number }
    ) {
      if (alpha < 0.01) return;
      const { r, g, b } = color;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
      grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.32})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(x, y, size * 6, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }

    function drawRipples(x: number, y: number, ripples: Ripple[], glowAlpha: number) {
      // Persistent soft glow where star landed
      if (glowAlpha > 0.01) {
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 14);
        grd.addColorStop(0, `rgba(180, 210, 255, ${glowAlpha * 0.55})`);
        grd.addColorStop(0.5, `rgba(140, 180, 255, ${glowAlpha * 0.2})`);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Ripple rings
      ripples.forEach((rp) => {
        if (rp.alpha < 0.005) return;
        ctx.beginPath();
        ctx.ellipse(x, y, rp.r, rp.r * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(160, 210, 255, ${rp.alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    }

    function draw() {
      frame++;
      const sp = getScrollProg();
      const currentScrollY = window.scrollY;
      scrollVel = (currentScrollY - lastScrollY) * 0.26;
      lastScrollY = currentScrollY;

      ctx.clearRect(0, 0, W, H);

      const groundY = H * 0.84;

      // Reset if scrolled back up
      if (sp < BLOOM_START - 0.03) {
        stars.forEach((s) => {
          s.landed = false;
          s.ripples = [];
          s.glowAlpha = 0;
        });
      }

      stars.forEach((star) => {
        const floatX = Math.sin(frame * 0.004 + star.phase) * 2.2;
        const floatY = Math.cos(frame * 0.003 + star.phase * 1.3) * 1.6;

        if (sp < CONVERGE_START) {
          // Floating + parallax
          star.x += star.vx + floatX * 0.04;
          star.y += star.vy + scrollVel;

          if (star.y > H + 30) star.y = -20;
          if (star.y < -30) star.y = H + 20;
          if (star.x > W + 20) star.x = -15;
          if (star.x < -20) star.x = W + 15;

          const alpha = star.opacity * Math.max(0.04, 1 - sp * 1.25);
          drawStar(star.x + floatX, star.y + floatY, star.size, alpha, star.color);
        } else if (sp < BLOOM_START) {
          // Converge toward ground
          star.x += (star.groundX - star.x) * 0.042;
          star.y += (groundY - star.y) * 0.042;

          const t = (sp - CONVERGE_START) / (BLOOM_START - CONVERGE_START);
          const alpha = star.opacity * (1 - t * 0.45);
          drawStar(star.x, star.y, star.size, alpha, star.color);
        } else {
          // Landing + ripple
          star.x += (star.groundX - star.x) * 0.1;
          star.y += (groundY - star.y) * 0.1;

          if (!star.landed && Math.abs(star.y - groundY) < 4) {
            star.landed = true;
            // Emit 3 staggered ripple rings
            star.ripples = [
              { r: 1, alpha: 0.75, speed: 0.7 },
              { r: 1, alpha: 0,    speed: 0.55 }, // delayed — starts invisible
              { r: 1, alpha: 0,    speed: 0.42 }, // more delayed
            ];
          }

          if (!star.landed) {
            drawStar(star.x, star.y, star.size, star.opacity * 0.45, star.color);
          } else {
            // Expand ripples, stagger emit
            star.ripples.forEach((rp, i) => {
              const delay = i * 18; // frame delay between rings
              const framesSinceLand = star.ripples[0].r / star.ripples[0].speed;
              if (framesSinceLand >= delay) {
                if (rp.alpha === 0 && i > 0) rp.alpha = 0.55 - i * 0.1;
                rp.r += rp.speed;
                rp.alpha = Math.max(0, rp.alpha - 0.006);
              }
            });

            // Soft glow builds up
            star.glowAlpha = Math.min(star.glowAlpha + 0.015, 0.38);

            drawRipples(star.groundX, groundY, star.ripples, star.glowAlpha);
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