"use client";
import { useEffect, useRef } from "react";

interface Bubble {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  phase: "floating" | "converging" | "absorbing";
  r: number; g: number; b: number;
  wobble: number; wobbleSpeed: number;
  fontSize: number;
}

const PALETTE = [
  { r: 99,  g: 102, b: 241 }, // indigo-500
  { r: 129, g: 140, b: 248 }, // indigo-400
  { r: 139, g: 92,  b: 246 }, // violet-500
  { r: 167, g: 139, b: 250 }, // violet-400
  { r: 79,  g: 70,  b: 229 }, // indigo-600
];

export function IdeaBubbles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    let raf = 0;

    // Animation state machine
    // Phase A: floating (8s) → Phase B: converging → Phase C: reveal (2s) → reset
    const FLOAT_FRAMES   = 420;  // ~7s float
    const REVEAL_FRAMES  = 140;  // reveal duration
    const RESET_FRAMES   = 90;   // hold after reveal before reset

    let globalFrame = 0;
    let absorbedCount = 0;
    let revealFrame = 0;
    let resetTimer = 0;
    let stage: "float" | "converge" | "reveal" | "resetting" = "float";

    interface Ring { x: number; y: number; r: number; op: number; }
    const rings: Ring[] = [];
    const bubbles: Bubble[] = [];

    const cx = () => W / 2;
    const cy = () => H * 0.43; // where the headline lives

    const makeBubble = (fromEdge = false): Bubble => {
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const radius = 26 + Math.random() * 16;
      let x: number, y: number, vx: number, vy: number;

      if (fromEdge) {
        const side = Math.floor(Math.random() * 4);
        const pad = 50;
        if (side === 0) { x = Math.random() * W; y = -pad; vx = (Math.random() - 0.5) * 0.6; vy = 0.3 + Math.random() * 0.3; }
        else if (side === 1) { x = W + pad; y = Math.random() * H; vx = -(0.3 + Math.random() * 0.3); vy = (Math.random() - 0.5) * 0.6; }
        else if (side === 2) { x = Math.random() * W; y = H + pad; vx = (Math.random() - 0.5) * 0.6; vy = -(0.3 + Math.random() * 0.3); }
        else { x = -pad; y = Math.random() * H; vx = 0.3 + Math.random() * 0.3; vy = (Math.random() - 0.5) * 0.6; }
      } else {
        x = Math.random() * W;
        y = Math.random() * H;
        vx = (Math.random() - 0.5) * 0.7;
        vy = (Math.random() - 0.5) * 0.7;
      }

      return { x, y, vx, vy, radius, opacity: 0.7 + Math.random() * 0.2,
        phase: "floating", r: c.r, g: c.g, b: c.b,
        wobble: Math.random() * Math.PI * 2, wobbleSpeed: 0.018 + Math.random() * 0.015,
        fontSize: Math.floor(radius * 0.44),
      };
    };

    const N = 13;
    for (let i = 0; i < N; i++) bubbles.push(makeBubble(false));

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    canvas.width = W; canvas.height = H;
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawBubble = (b: Bubble) => {
      const { x, y, radius, opacity, r, g, b: bl, fontSize } = b;
      ctx.save();
      ctx.globalAlpha = opacity;

      // Outer glow
      const grd = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.8);
      grd.addColorStop(0, `rgba(${r},${g},${bl},0.18)`);
      grd.addColorStop(1, `rgba(${r},${g},${bl},0)`);
      ctx.beginPath(); ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();

      // Circle fill
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${bl},0.12)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${r},${g},${bl},0.55)`;
      ctx.lineWidth = 1.5; ctx.stroke();

      // "idea" label
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("idea", x, y);

      ctx.restore();
    };

    const drawReveal = (progress: number) => {
      const x = cx(), y = cy();

      // Expanding concentric rings
      for (let i = 0; i < 5; i++) {
        const p = Math.max(0, progress - i * 0.07);
        if (p <= 0) continue;
        const ringR = p * (100 + i * 50);
        const op = (1 - p) * 0.5;
        ctx.beginPath(); ctx.arc(x, y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(129,140,248,${op.toFixed(3)})`;
        ctx.lineWidth = 1.8; ctx.stroke();
      }

      // "market intelligence" text below center
      if (progress > 0.35) {
        const tOp = Math.min(1, (progress - 0.35) / 0.35);
        const rise = (1 - progress) * 12;
        ctx.save();
        ctx.globalAlpha = tOp;
        ctx.translate(x, y + 90 + rise);

        // Glow shadow
        ctx.shadowColor = "rgba(129,140,248,0.9)";
        ctx.shadowBlur = 28;

        // Gradient text
        const grad = ctx.createLinearGradient(-130, 0, 130, 0);
        grad.addColorStop(0, "#818cf8");
        grad.addColorStop(0.5, "#c4b5fd");
        grad.addColorStop(1, "#818cf8");
        ctx.fillStyle = grad;
        ctx.font = "700 18px Inter, system-ui, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.letterSpacing = "0.05em";
        ctx.fillText("→ market intelligence", 0, 0);

        ctx.restore();
      }
    };

    const resetAll = () => {
      stage = "float";
      globalFrame = 0;
      absorbedCount = 0;
      revealFrame = 0;
      resetTimer = 0;
      bubbles.length = 0;
      for (let i = 0; i < N; i++) bubbles.push(makeBubble(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      globalFrame++;

      const targetX = cx(), targetY = cy();

      // Stage transitions
      if (stage === "float" && globalFrame >= FLOAT_FRAMES) stage = "converge";
      if (stage === "converge" && absorbedCount >= N) {
        stage = "reveal";
        revealFrame = 0;
      }
      if (stage === "reveal") {
        revealFrame++;
        if (revealFrame > REVEAL_FRAMES) {
          stage = "resetting";
          resetTimer = 0;
        }
      }
      if (stage === "resetting") {
        resetTimer++;
        if (resetTimer > RESET_FRAMES) resetAll();
      }

      // Reveal overlay
      if (stage === "reveal" || stage === "resetting") {
        const progress = stage === "reveal"
          ? Math.min(1, revealFrame / (REVEAL_FRAMES * 0.65))
          : Math.max(0, 1 - resetTimer / RESET_FRAMES);
        drawReveal(progress);
      }

      // Absorption rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.r += 2.5; ring.op *= 0.93;
        if (ring.op < 0.01) { rings.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(129,140,248,${ring.op.toFixed(3)})`;
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Bubbles
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.wobble += b.wobbleSpeed;

        const dx = targetX - b.x;
        const dy = targetY - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (stage === "converge" && b.phase !== "absorbing") {
          // Strong pull toward center
          const pull = 0.025 + Math.max(0, 1 - dist / 400) * 0.04;
          b.vx += (dx / dist) * pull;
          b.vy += (dy / dist) * pull;
          b.phase = "converging";

          if (dist < 48) b.phase = "absorbing";
        } else if (stage === "float") {
          // Gentle wander + soft drift toward center
          b.vx += (Math.random() - 0.5) * 0.018;
          b.vy += (Math.random() - 0.5) * 0.018;
          // Slight passive pull
          if (dist < 350) {
            b.vx += (dx / dist) * 0.0008;
            b.vy += (dy / dist) * 0.0008;
          }
        }

        if (b.phase === "absorbing") {
          b.radius *= 0.87;
          b.opacity *= 0.87;
          b.vx = dx * 0.1; b.vy = dy * 0.1;
          if (b.radius < 3) {
            bubbles.splice(i, 1);
            absorbedCount++;
            rings.push({ x: targetX, y: targetY, r: 8, op: 0.7 });
            continue;
          }
        }

        // Damping + speed cap
        b.vx *= 0.978; b.vy *= 0.978;
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (spd > 1.8) { b.vx *= 1.8 / spd; b.vy *= 1.8 / spd; }

        b.x += b.vx + Math.sin(b.wobble) * 0.12;
        b.y += b.vy + Math.cos(b.wobble * 0.7) * 0.08;

        // Edge wrap (float stage only)
        if (stage === "float") {
          const pad = b.radius + 10;
          if (b.x < -pad) b.x = W + pad;
          else if (b.x > W + pad) b.x = -pad;
          if (b.y < -pad) b.y = H + pad;
          else if (b.y > H + pad) b.y = -pad;
        }

        drawBubble(b);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}