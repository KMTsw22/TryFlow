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
  bloomR: number;
  sproutH: number;
}

export function ScrollSeeds() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      bloomR: 0,
      sproutH: 0,
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

    function drawBloom(x: number, y: number, r: number, sproutH: number) {
      // Expanding ring
      const ringAlpha = Math.max(0, 1 - r / 26);
      if (ringAlpha > 0) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 220, 130, ${ringAlpha * 0.75})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Seed glow dot
      const seedGrd = ctx.createRadialGradient(x, y, 0, x, y, 5);
      seedGrd.addColorStop(0, `rgba(180, 240, 160, ${Math.min(1, ringAlpha + 0.5)})`);
      seedGrd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = seedGrd;
      ctx.fill();

      // Sprout stem
      if (sproutH > 1) {
        ctx.strokeStyle = `rgba(110, 210, 120, 0.85)`;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x, y - sproutH);
        ctx.stroke();

        // Leaf — appears once stem is tall enough
        if (sproutH > 12) {
          const leafP = Math.min(1, (sproutH - 12) / 18);
          ctx.strokeStyle = `rgba(120, 220, 120, ${leafP * 0.8})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y - sproutH * 0.55);
          ctx.quadraticCurveTo(
            x + 11 * leafP,
            y - sproutH * 0.55 - 7 * leafP,
            x + 5 * leafP,
            y - sproutH * 0.55 - 15 * leafP
          );
          ctx.stroke();
        }
      }
    }

    function draw() {
      frame++;
      const sp = getScrollProg();
      const currentScrollY = window.scrollY;
      scrollVel = (currentScrollY - lastScrollY) * 0.26;
      lastScrollY = currentScrollY;

      ctx.clearRect(0, 0, W, H);

      const groundY = H * 0.84;

      // Reset bloom if user scrolled back up
      if (sp < BLOOM_START - 0.03) {
        stars.forEach((s) => {
          s.landed = false;
          s.bloomR = 0;
          s.sproutH = 0;
        });
      }

      stars.forEach((star) => {
        const floatX = Math.sin(frame * 0.004 + star.phase) * 2.2;
        const floatY = Math.cos(frame * 0.003 + star.phase * 1.3) * 1.6;

        if (sp < CONVERGE_START) {
          // Floating + parallax scroll follow
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
          // Landing + bloom
          star.x += (star.groundX - star.x) * 0.1;
          star.y += (groundY - star.y) * 0.1;

          if (!star.landed && Math.abs(star.y - groundY) < 4) {
            star.landed = true;
          }

          if (!star.landed) {
            drawStar(star.x, star.y, star.size, star.opacity * 0.45, star.color);
          } else {
            star.bloomR = Math.min(star.bloomR + 0.42, 26);
            star.sproutH = Math.min(star.sproutH + 0.36, 30);
            drawBloom(star.groundX, groundY, star.bloomR, star.sproutH);
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