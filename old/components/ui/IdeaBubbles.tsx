"use client";
import { useEffect, useRef } from "react";

interface Orb {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  phase: "floating" | "converging" | "absorbed";
  wobble: number; wobbleSpeed: number;
  // color
  r: number; g: number; b: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  r: number; g: number; b: number;
}

// Warm-cool palette: amber + indigo/violet mix
const ORB_PALETTE = [
  { r: 255, g: 243, b: 180 }, // 파스텔 레몬
  { r: 254, g: 240, b: 138 }, // 파스텔 옐로우
  { r: 253, g: 230, b: 138 }, // 파스텔 amber
  { r: 255, g: 247, b: 200 }, // 크림 옐로우
  { r: 254, g: 249, b: 195 }, // 연한 레몬
  { r: 252, g: 211, b: 77  }, // 살짝 진한 골드 (포인트)
  { r: 255, g: 237, b: 160 }, // 파스텔 허니
];

const BURST_COLORS = [
  { r: 255, g: 243, b: 180 },
  { r: 254, g: 240, b: 138 },
  { r: 253, g: 230, b: 138 },
  { r: 255, g: 255, b: 255 },
  { r: 255, g: 247, b: 200 },
  { r: 252, g: 211, b: 77  },
];

export function IdeaBubbles({ onReveal }: { onReveal?: () => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    let raf = 0;
    let frame = 0;

    const cx = () => W / 2;
    const cy = () => H * 0.43;

    type Stage = "float" | "converge" | "burst" | "settle" | "done";
    let stage: Stage = "float";
    let stageFrame = 0;
    const FLOAT_DUR   = 80;
    const SETTLE_HOLD = 40;

    const ORB_MAX        = 88;
    const N              = 14;
    let orbRadius        = 0;
    let flashOpacity     = 0;

    const particles: Particle[] = [];
    const orbs: Orb[] = [];

    const makeOrb = (scatter = false): Orb => {
      const pad = 60;
      let x: number, y: number, vx: number, vy: number;
      if (!scatter) {
        const side = Math.floor(Math.random() * 4);
        if      (side === 0) { x = Math.random()*W; y = -pad;  vx = (Math.random()-.5)*.5; vy =  .25+Math.random()*.35; }
        else if (side === 1) { x = W+pad; y = Math.random()*H; vx = -(.25+Math.random()*.35); vy = (Math.random()-.5)*.5; }
        else if (side === 2) { x = Math.random()*W; y = H+pad; vx = (Math.random()-.5)*.5; vy = -(.25+Math.random()*.35); }
        else                 { x = -pad; y = Math.random()*H;  vx =  .25+Math.random()*.35; vy = (Math.random()-.5)*.5; }
      } else {
        x = 80 + Math.random() * (W - 160);
        y = 80 + Math.random() * (H - 160);
        vx = (Math.random() - .5) * .9;
        vy = (Math.random() - .5) * .9;
      }
      const c = ORB_PALETTE[Math.floor(Math.random() * ORB_PALETTE.length)];
      return {
        x, y, vx, vy,
        radius: 5 + Math.random() * 10,
        opacity: 0.6 + Math.random() * 0.35,
        phase: "floating",
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: .016 + Math.random() * .014,
        r: c.r, g: c.g, b: c.b,
      };
    };

    for (let i = 0; i < N; i++) orbs.push(makeOrb(true));

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    canvas.width = W; canvas.height = H;
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Draw a single glowing orb ─────────────────────────────────────────────
    const drawOrb = (o: Orb) => {
      const { x, y, radius, opacity, r, g, b } = o;
      ctx.save();
      ctx.globalAlpha = opacity;

      // Outer glow (large, soft)
      const outerGrd = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
      outerGrd.addColorStop(0, `rgba(${r},${g},${b},0.22)`);
      outerGrd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
      ctx.fillStyle = outerGrd; ctx.fill();

      // Inner glow
      const innerGrd = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.6);
      innerGrd.addColorStop(0, `rgba(${r},${g},${b},0.7)`);
      innerGrd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(x, y, radius * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = innerGrd; ctx.fill();

      // Bright core
      const coreGrd = ctx.createRadialGradient(x - radius*.25, y - radius*.25, 0, x, y, radius);
      coreGrd.addColorStop(0, `rgba(255,255,255,0.95)`);
      coreGrd.addColorStop(0.35, `rgba(${r},${g},${b},0.85)`);
      coreGrd.addColorStop(1, `rgba(${r},${g},${b},0.3)`);
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrd; ctx.fill();

      ctx.restore();
    };

    // ── Central orb (grows as absorbs) ───────────────────────────────────────
    const drawCentralOrb = () => {
      if (orbRadius <= 0) return;
      const ox = cx(), oy = cy();
      const pulse = 1 + Math.sin(frame * .08) * .055;
      const r = orbRadius * pulse;
      const prog = orbRadius / ORB_MAX;

      // Layered glow
      for (let i = 4; i >= 0; i--) {
        const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * (1.8 + i * .7));
        grd.addColorStop(0, `rgba(129,140,248,${(.12 - i * .02) * prog})`);
        grd.addColorStop(1, "rgba(129,140,248,0)");
        ctx.beginPath(); ctx.arc(ox, oy, r * (1.8 + i * .7), 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
      }

      // Core sphere
      const core = ctx.createRadialGradient(ox - r*.2, oy - r*.2, r*.05, ox, oy, r);
      core.addColorStop(0,   `rgba(240,242,255,${.85 * prog})`);
      core.addColorStop(0.3, `rgba(167,139,250,${.65 * prog})`);
      core.addColorStop(0.7, `rgba(99,102,241,${.45 * prog})`);
      core.addColorStop(1,   `rgba(67,56,202, ${.25 * prog})`);
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fillStyle = core; ctx.fill();

      // Rim light
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(196,181,253,${.6 * prog})`;
      ctx.lineWidth = 1.8; ctx.stroke();
    };

    // ── Explosion ─────────────────────────────────────────────────────────────
    const explode = () => {
      const ox = cx(), oy = cy();
      flashOpacity = 1;

      for (let i = 0; i < 80; i++) {
        const angle = (Math.PI * 2 * i / 80) + (Math.random() - .5) * .15;
        const speed = 2 + Math.random() * 10;
        const c = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
        particles.push({
          x: ox + (Math.random()-.5) * orbRadius,
          y: oy + (Math.random()-.5) * orbRadius,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.5 + Math.random() * 4.5,
          opacity: .85 + Math.random() * .15,
          r: c.r, g: c.g, b: c.b,
        });
      }

      stage = "burst"; stageFrame = 0;
      setTimeout(() => onRevealRef.current?.(), 250);
    };

    // ── Main draw loop ────────────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++; stageFrame++;

      const ox = cx(), oy = cy();

      if (stage === "float" && stageFrame >= FLOAT_DUR) { stage = "converge"; stageFrame = 0; }

      if (stage === "converge") drawCentralOrb();

      // Flash
      if (flashOpacity > 0) {
        const flashR = (orbRadius + 30) * (1 + (1 - flashOpacity) * 3);
        const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, flashR);
        grd.addColorStop(0,   `rgba(220,225,255,${flashOpacity * .95})`);
        grd.addColorStop(0.4, `rgba(167,139,250,${flashOpacity * .5})`);
        grd.addColorStop(1,   "rgba(129,140,248,0)");
        ctx.beginPath(); ctx.arc(ox, oy, flashR, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        flashOpacity = Math.max(0, flashOpacity - .04);
      }

      // Particles
      if (stage === "burst" || stage === "settle") {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.vx *= .93; p.vy *= .93;
          p.vy += .035;
          p.x += p.vx; p.y += p.vy;
          p.opacity *= .974;
          if (p.opacity < 0.02) { particles.splice(i, 1); continue; }

          // Draw particle as small glowing dot
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
          grd.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${p.opacity.toFixed(2)})`);
          grd.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = grd; ctx.fill();

          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * .7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${(p.opacity * .9).toFixed(2)})`;
          ctx.fill();
        }

        if (stage === "burst"  && stageFrame > 12) { stage = "settle"; stageFrame = 0; }
        if (stage === "settle" && particles.length === 0) { stage = "done"; stageFrame = 0; }
      }

      if (stage === "done" && stageFrame > SETTLE_HOLD) {
        cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, W, H);
        return;
      }

      // Check all absorbed
      if (stage === "converge" && orbs.every(o => o.phase === "absorbed")) explode();

      // Update + draw orbs
      for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        if (o.phase === "absorbed") continue;
        if (stage === "burst" || stage === "settle" || stage === "done") continue;

        o.wobble += o.wobbleSpeed;

        const dx = ox - o.x;
        const dy = oy - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (stage === "converge") {
          const pull = .13 + (1 - Math.min(1, dist / 400)) * .20;
          o.vx += (dx / dist) * pull;
          o.vy += (dy / dist) * pull;
          o.phase = "converging";
          if (dist < 44 + orbRadius) {
            o.phase = "absorbed";
            orbRadius = Math.min(ORB_MAX, orbRadius + ORB_MAX / N);
            continue;
          }
        } else {
          // Float: gentle random walk + soft pull
          o.vx += (Math.random() - .5) * .02;
          o.vy += (Math.random() - .5) * .02;
          if (dist < 350) { o.vx += (dx / dist) * .0005; o.vy += (dy / dist) * .0005; }
        }

        o.vx *= .98; o.vy *= .98;
        const spd = Math.sqrt(o.vx * o.vx + o.vy * o.vy);
        if (spd > 2) { o.vx *= 2 / spd; o.vy *= 2 / spd; }

        o.x += o.vx + Math.sin(o.wobble) * .12;
        o.y += o.vy + Math.cos(o.wobble * .7) * .09;

        if (stage === "float") {
          const pad = o.radius + 12;
          if (o.x < -pad) o.x = W + pad; else if (o.x > W + pad) o.x = -pad;
          if (o.y < -pad) o.y = H + pad; else if (o.y > H + pad) o.y = -pad;
        }

        drawOrb(o);
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