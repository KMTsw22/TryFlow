"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  r: number; g: number; b: number; // base RGB
}

// Teal + Blue + Indigo palette
const PALETTE = [
  { r: 20,  g: 184, b: 166 }, // teal-500
  { r: 6,   g: 182, b: 212 }, // cyan-500
  { r: 14,  g: 165, b: 233 }, // sky-500
  { r: 59,  g: 130, b: 246 }, // blue-500
  { r: 96,  g: 165, b: 250 }, // blue-400
  { r: 129, g: 140, b: 248 }, // indigo-400
  { r: 0,   g: 210, b: 255 }, // bright cyan
];

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    let mouseX = W / 2;
    let mouseY = H / 2;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let mouseSpeed = 0;
    let raf = 0;

    const N = Math.min(140, Math.floor((W * H) / 9000));
    const particles: Particle[] = [];

    // ── Init ──────────────────────────────────────────────────────────────
    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < N; i++) {
        const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 1.6 + 0.6,
          r: c.r, g: c.g, b: c.b,
        });
      }
    };

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      initParticles();
    };

    canvas.width = W;
    canvas.height = H;
    initParticles();
    window.addEventListener("resize", resize, { passive: true });

    // ── Mouse ──────────────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      mouseSpeed = Math.sqrt(dx * dx + dy * dy);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // ── Constants ─────────────────────────────────────────────────────────
    const CONN_DIST  = 120;   // max distance to draw connections
    const GRAV_R     = 220;   // gravity influence radius
    const GRAV_BASE  = 0.06;  // base attraction strength
    const ORBIT_STR  = 0.028; // orbit tangential strength
    const DAMPING    = 0.94;
    const WANDER     = 0.018; // random walk

    // ── Draw loop ─────────────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      mouseSpeed *= 0.88;

      // Update physics
      for (const p of particles) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < GRAV_R) {
          const proximity = 1 - dist / GRAV_R;
          // Gravity pull — stronger when mouse moving fast
          const pull = proximity * GRAV_BASE * (1 + mouseSpeed * 0.04);
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;

          // Orbit: add tangential velocity when cursor is slow (hovering)
          if (mouseSpeed < 3) {
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle + Math.PI / 2) * ORBIT_STR * proximity;
            p.vy += Math.sin(angle + Math.PI / 2) * ORBIT_STR * proximity;
          }
        }

        // Random wander
        p.vx += (Math.random() - 0.5) * WANDER;
        p.vy += (Math.random() - 0.5) * WANDER;

        // Damping
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -10) p.x = W + 10;
        else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        else if (p.y > H + 10) p.y = -10;
      }

      // Draw connections (O(n²) — fine for n ≤ 140)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > CONN_DIST * CONN_DIST) continue;

          const d = Math.sqrt(d2);
          const op = (1 - d / CONN_DIST) * 0.18;
          const { r, g, b } = particles[i];
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${op.toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      // Draw particles
      for (const p of particles) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / GRAV_R);

        // Glow halo for particles near cursor
        if (proximity > 0.25) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 8);
          grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${(proximity * 0.25).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 8, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Core dot
        const opacity = 0.55 + proximity * 0.45;
        const radius  = p.size * (1 + proximity * 0.8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${opacity.toFixed(3)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}