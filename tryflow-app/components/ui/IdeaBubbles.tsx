"use client";
import { useEffect, useRef } from "react";

interface Emoji {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  opacity: number;
  phase: "floating" | "converging" | "absorbed";
  wobble: number; wobbleSpeed: number;
  rotation: number; rotSpeed: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  opacity: number;
  r: number; g: number; b: number;
}

const BURST_COLORS = [
  { r: 99,  g: 102, b: 241 },
  { r: 129, g: 140, b: 248 },
  { r: 167, g: 139, b: 250 },
  { r: 251, g: 191, b: 36  },
  { r: 255, g: 220, b: 80  },
  { r: 250, g: 204, b: 21  },
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

    // ── State machine ────────────────────────────────────────────────────────
    type Stage = "float" | "converge" | "burst" | "settle" | "done";
    let stage: Stage = "float";
    let stageFrame = 0;
    const FLOAT_DUR   = 320;   // frames before converge starts (~5.3s)
    const SETTLE_HOLD = 200;   // frames to hold after settling before reset

    // ── Central orb ─────────────────────────────────────────────────────────
    const ORB_MAX         = 90;
    const ORB_PER_ABSORB  = ORB_MAX / 12;
    let orbRadius         = 0;
    let flashOpacity      = 0; // burst flash

    // ── Particles ────────────────────────────────────────────────────────────
    const particles: Particle[] = [];

    // ── Emojis ───────────────────────────────────────────────────────────────
    const N = 13;
    const emojis: Emoji[] = [];

    const makeEmoji = (fromEdge = false): Emoji => {
      const pad = 60;
      let x: number, y: number, vx: number, vy: number;
      if (fromEdge) {
        const side = Math.floor(Math.random() * 4);
        if      (side === 0) { x = Math.random()*W; y = -pad; vx = (Math.random()-.5)*.5; vy =  .3+Math.random()*.4; }
        else if (side === 1) { x = W+pad; y = Math.random()*H; vx = -(.3+Math.random()*.4); vy = (Math.random()-.5)*.5; }
        else if (side === 2) { x = Math.random()*W; y = H+pad; vx = (Math.random()-.5)*.5; vy = -(.3+Math.random()*.4); }
        else                 { x = -pad; y = Math.random()*H; vx =  .3+Math.random()*.4;  vy = (Math.random()-.5)*.5; }
      } else {
        x = 60 + Math.random() * (W - 120);
        y = 60 + Math.random() * (H - 120);
        vx = (Math.random() - .5) * .9;
        vy = (Math.random() - .5) * .9;
      }
      return {
        x, y, vx, vy,
        size: 30 + Math.random() * 22,
        opacity: 0.75 + Math.random() * 0.25,
        phase: "floating",
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: .018 + Math.random() * .015,
        rotation: (Math.random() - .5) * .25,
        rotSpeed:  (Math.random() - .5) * .006,
      };
    };

    for (let i = 0; i < N; i++) emojis.push(makeEmoji(false));

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    canvas.width = W; canvas.height = H;
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Explosion ─────────────────────────────────────────────────────────────
    const explode = () => {
      const ox = cx(), oy = cy();
      flashOpacity = 1;

      // Radial burst — 70 particles
      for (let i = 0; i < 70; i++) {
        const angle = (Math.PI * 2 * i) / 70 + (Math.random() - .5) * .18;
        const speed = 2.5 + Math.random() * 9;
        const c = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
        particles.push({
          x: ox, y: oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2.5 + Math.random() * 5,
          opacity: .9 + Math.random() * .1,
          r: c.r, g: c.g, b: c.b,
        });
      }

      // 💡 emoji shards (10 larger slow ones)
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 4;
        particles.push({
          x: ox, y: oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 12, // big = emoji-sized, drawn differently below
          opacity: .85,
          r: 251, g: 191, b: 36,
        });
      }

      stage = "burst";
      stageFrame = 0;
      setTimeout(() => onRevealRef.current?.(), 300);
    };

    // ── Orb draw ─────────────────────────────────────────────────────────────
    const drawOrb = () => {
      if (orbRadius <= 0) return;
      const ox = cx(), oy = cy();
      const pulse = 1 + Math.sin(frame * 0.1) * 0.05;
      const r = orbRadius * pulse;
      const prog = orbRadius / ORB_MAX;

      // Glow halos
      for (let i = 3; i >= 0; i--) {
        const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * (1.6 + i * 0.6));
        grd.addColorStop(0, `rgba(129,140,248,${(0.1 - i * 0.02) * prog})`);
        grd.addColorStop(1, "rgba(129,140,248,0)");
        ctx.beginPath(); ctx.arc(ox, oy, r * (1.6 + i * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
      }

      // Core
      const core = ctx.createRadialGradient(ox, oy - r * .25, r * .05, ox, oy, r);
      core.addColorStop(0,   `rgba(220,225,255,${.65 * prog})`);
      core.addColorStop(0.4, `rgba(129,140,248,${.45 * prog})`);
      core.addColorStop(1,   `rgba(79, 70, 229,${.25 * prog})`);
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.fillStyle = core; ctx.fill();

      // Rim
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,210,255,${.7 * prog})`;
      ctx.lineWidth = 2.5; ctx.stroke();
    };

    // ── Draw loop ─────────────────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++; stageFrame++;

      const ox = cx(), oy = cy();

      // Stage transitions
      if (stage === "float" && stageFrame >= FLOAT_DUR) {
        stage = "converge"; stageFrame = 0;
      }

      // Orb visible during converge
      if (stage === "converge") drawOrb();

      // Burst flash
      if (flashOpacity > 0) {
        const flashR = orbRadius * (1 + (1 - flashOpacity) * 4);
        const grd = ctx.createRadialGradient(ox, oy, 0, ox, oy, flashR);
        grd.addColorStop(0,   `rgba(240,245,255,${flashOpacity * .9})`);
        grd.addColorStop(0.3, `rgba(167,139,250,${flashOpacity * .5})`);
        grd.addColorStop(1,   "rgba(129,140,248,0)");
        ctx.beginPath(); ctx.arc(ox, oy, flashR, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        flashOpacity = Math.max(0, flashOpacity - 0.045);
      }

      // Particles
      if (stage === "burst" || stage === "settle") {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.vx *= .94; p.vy *= .94;
          p.vy += .04; // subtle gravity
          p.x += p.vx; p.y += p.vy;
          p.opacity *= .975;
          if (p.opacity < 0.02) { particles.splice(i, 1); continue; }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.opacity.toFixed(3)})`;
          ctx.fill();
        }

        if (stage === "burst" && stageFrame > 15) { stage = "settle"; stageFrame = 0; }
        if (stage === "settle" && particles.length === 0) { stage = "done"; stageFrame = 0; }
      }

      // Done → reset
      if (stage === "done" && stageFrame > SETTLE_HOLD) {
        stage = "float"; stageFrame = 0;
        orbRadius = 0; flashOpacity = 0;
        particles.length = 0;
        emojis.length = 0;
        for (let i = 0; i < N; i++) emojis.push(makeEmoji(true));
      }

      // Check if all absorbed → explode
      const activeEmojis = emojis.filter(e => e.phase !== "absorbed");
      if (stage === "converge" && activeEmojis.length === 0) explode();

      // ── Emojis ──────────────────────────────────────────────────────────────
      for (let i = emojis.length - 1; i >= 0; i--) {
        const e = emojis[i];
        if (e.phase === "absorbed") continue;
        if (stage === "burst" || stage === "settle" || stage === "done") continue;

        e.wobble += e.wobbleSpeed;
        e.rotation += e.rotSpeed;

        const dx = ox - e.x;
        const dy = oy - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (stage === "converge") {
          // Strong pull
          const pull = .028 + (1 - Math.min(1, dist / 380)) * .05;
          e.vx += (dx / dist) * pull;
          e.vy += (dy / dist) * pull;
          e.phase = "converging";

          // Absorbed when close enough to orb surface
          if (dist < 42 + orbRadius) {
            e.phase = "absorbed";
            orbRadius = Math.min(ORB_MAX, orbRadius + ORB_PER_ABSORB);
            continue;
          }
        } else {
          // Float: gentle drift + very soft passive pull
          e.vx += (Math.random() - .5) * .022;
          e.vy += (Math.random() - .5) * .022;
          if (dist < 320) {
            e.vx += (dx / dist) * .0006;
            e.vy += (dy / dist) * .0006;
          }
        }

        // Damping + speed cap
        e.vx *= .98; e.vy *= .98;
        const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
        if (spd > 2.2) { e.vx *= 2.2 / spd; e.vy *= 2.2 / spd; }

        e.x += e.vx + Math.sin(e.wobble) * .14;
        e.y += e.vy + Math.cos(e.wobble * .7) * .1;

        // Edge wrap (float only)
        if (stage === "float") {
          const pad = e.size + 12;
          if (e.x < -pad) e.x = W + pad;
          else if (e.x > W + pad) e.x = -pad;
          if (e.y < -pad) e.y = H + pad;
          else if (e.y > H + pad) e.y = -pad;
        }

        // Draw 💡
        ctx.save();
        ctx.globalAlpha = e.opacity;
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotation);
        ctx.font = `${Math.floor(e.size)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💡", 0, 0);
        ctx.restore();
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