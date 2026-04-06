"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Star, TrendingUp, Eye, Zap } from "lucide-react";

// ── Tenniel-style SVG illustrations (inline) ──────────────────────────────

function RabbitSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Ears */}
      <path d="M38 80 Q32 30 36 8 Q40 28 44 80" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M36 8 Q39 18 42 80" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M68 80 Q74 30 70 8 Q66 28 62 80" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M70 8 Q67 18 64 80" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Head */}
      <ellipse cx="52" cy="90" rx="22" ry="18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Cross-hatch on head */}
      <path d="M34 84 Q52 80 70 84" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3"/>
      <path d="M33 90 Q52 86 71 90" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3"/>
      <path d="M34 96 Q52 92 70 96" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.3"/>
      {/* Eye */}
      <circle cx="44" cy="88" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="44" cy="88" r="1" fill="currentColor"/>
      <circle cx="60" cy="88" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="60" cy="88" r="1" fill="currentColor"/>
      {/* Nose */}
      <path d="M50 94 L52 97 L54 94" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Whiskers */}
      <path d="M30 93 L43 95" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M30 97 L43 97" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M74 93 L61 95" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M74 97 L61 97" stroke="currentColor" strokeWidth="0.8"/>
      {/* Body */}
      <path d="M36 104 Q28 120 30 145 Q52 155 74 145 Q76 120 68 104" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Waistcoat */}
      <path d="M40 108 L44 130 L52 132 L60 130 L64 108" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M52 108 L52 132" stroke="currentColor" strokeWidth="0.8"/>
      {/* Waistcoat buttons */}
      <circle cx="52" cy="114" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      <circle cx="52" cy="120" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      <circle cx="52" cy="126" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      {/* Watch */}
      <circle cx="68" cy="118" r="7" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d="M68 112 L68 118 L72 118" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
      {/* Legs */}
      <path d="M36 144 Q32 162 36 172" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M68 144 Q72 162 68 172" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Feet */}
      <path d="M30 172 Q36 176 44 172" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M62 172 Q68 176 76 172" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function CheshireSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body outline — fading (Cheshire disappearing) */}
      <ellipse cx="100" cy="75" rx="70" ry="35" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 3" opacity="0.4"/>
      {/* Stripes */}
      {[0,1,2,3,4].map(i => (
        <path key={i} d={`M${40+i*15} 50 Q${45+i*15} 75 ${40+i*15} 100`} stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.25"/>
      ))}
      {/* Head */}
      <ellipse cx="100" cy="52" rx="38" ry="30" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Ears */}
      <path d="M68 30 L60 10 L78 24" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d="M132 30 L140 10 L122 24" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      {/* Eyes — wide grin eyes */}
      <ellipse cx="84" cy="46" rx="7" ry="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <ellipse cx="116" cy="46" rx="7" ry="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <circle cx="86" cy="47" r="2" fill="currentColor"/>
      <circle cx="118" cy="47" r="2" fill="currentColor"/>
      <circle cx="85" cy="45" r="0.8" fill="white"/>
      <circle cx="117" cy="45" r="0.8" fill="white"/>
      {/* THE GRIN */}
      <path d="M66 64 Q76 75 100 78 Q124 75 134 64" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M66 64 Q70 60 74 64" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d="M134 64 Q130 60 126 64" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      {/* Teeth */}
      {[0,1,2,3,4,5].map(i => (
        <line key={i} x1={72+i*12} y1="64" x2={72+i*12} y2="70" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
      ))}
      {/* Whiskers */}
      <path d="M40 50 L76 54" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
      <path d="M38 58 L76 58" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
      <path d="M160 50 L124 54" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
      <path d="M162 58 L124 58" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
      {/* Tail curling */}
      <path d="M170 75 Q185 60 178 45 Q172 35 180 28" stroke="currentColor" strokeWidth="1.2" fill="none" strokeDasharray="3 2" opacity="0.5"/>
    </svg>
  );
}

function CaterpillarSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Mushroom */}
      <path d="M30 80 Q30 60 60 55 Q90 50 90 80" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d="M10 60 Q30 30 60 25 Q90 30 110 60" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M10 60 Q60 65 110 60" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Spots */}
      {[[30,45],[50,35],[70,33],[88,42]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="3" stroke="currentColor" strokeWidth="0.8" fill="none"/>)}
      {/* Caterpillar body — segments */}
      {[130,155,178,200,220].map((x,i) => (
        <ellipse key={i} cx={x} cy={60} rx={i===0?18:14} ry={i===0?20:16} stroke="currentColor" strokeWidth="1.2" fill="none"/>
      ))}
      {/* Cross-hatch on segments */}
      {[130,155,178].map((x,i) => (
        <g key={i} opacity="0.2">
          <path d={`M${x-12} ${52} L${x+12} ${52}`} stroke="currentColor" strokeWidth="0.6"/>
          <path d={`M${x-12} ${60} L${x+12} ${60}`} stroke="currentColor" strokeWidth="0.6"/>
          <path d={`M${x-12} ${68} L${x+12} ${68}`} stroke="currentColor" strokeWidth="0.6"/>
        </g>
      ))}
      {/* Head */}
      <ellipse cx="128" cy="58" rx="18" ry="20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Eyes */}
      <circle cx="122" cy="52" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="134" cy="52" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="122" cy="52" r="1.2" fill="currentColor"/>
      <circle cx="134" cy="52" r="1.2" fill="currentColor"/>
      {/* Hookah pipe */}
      <path d="M128 68 Q128 80 120 88 Q112 92 108 88" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <ellipse cx="106" cy="88" rx="6" ry="4" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Smoke */}
      <path d="M108 82 Q100 75 105 68 Q110 62 104 56" stroke="currentColor" strokeWidth="0.8" fill="none" strokeDasharray="2 2" opacity="0.5"/>
      {/* Antennae */}
      <path d="M122 40 Q118 28 114 22" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="114" cy="21" r="2" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      <path d="M134 40 Q138 28 142 22" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="142" cy="21" r="2" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      {/* Legs */}
      {[145,160,175,192,210].map((x,i) => (
        <g key={i}>
          <path d={`M${x} 72 L${x-4} 84`} stroke="currentColor" strokeWidth="0.8"/>
          <path d={`M${x} 72 L${x+4} 84`} stroke="currentColor" strokeWidth="0.8"/>
        </g>
      ))}
    </svg>
  );
}

function CardSoldierSVG({ className, label }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 80 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Card body */}
      <rect x="8" y="10" width="64" height="120" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Corner suit marks */}
      <text x="14" y="26" fontSize="10" fill="currentColor" fontFamily="serif" opacity="0.7">♠</text>
      <text x="54" y="122" fontSize="10" fill="currentColor" fontFamily="serif" opacity="0.7" transform="rotate(180 62 117)">♠</text>
      {/* Face — engraving style */}
      <ellipse cx="40" cy="55" rx="14" ry="16" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Helmet/crown */}
      <path d="M26 47 Q40 36 54 47" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <path d="M30 40 L32 47" stroke="currentColor" strokeWidth="1"/>
      <path d="M40 37 L40 47" stroke="currentColor" strokeWidth="1"/>
      <path d="M50 40 L48 47" stroke="currentColor" strokeWidth="1"/>
      {/* Eyes */}
      <line x1="34" y1="54" x2="38" y2="54" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="42" y1="54" x2="46" y2="54" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Mouth */}
      <path d="M35 62 Q40 65 45 62" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Body / uniform */}
      <path d="M26 71 L26 100 L54 100 L54 71" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      {/* Club/spade on chest */}
      <text x="33" y="90" fontSize="14" fill="currentColor" fontFamily="serif" opacity="0.6">♣</text>
      {/* Arms */}
      <path d="M26 75 L14 82 L16 92" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M54 75 L66 82 L64 92" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      {/* Spear / halberd */}
      <line x1="16" y1="92" x2="16" y2="130" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M12 96 L16 86 L20 96" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Legs */}
      <path d="M30 100 L28 128" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M50 100 L52 128" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Feet */}
      <path d="M24 128 L34 128" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M48 128 L58 128" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Label */}
      {label && <text x="40" y="110" fontSize="7" fill="currentColor" fontFamily="serif" textAnchor="middle" opacity="0.5">{label}</text>}
    </svg>
  );
}

// ── Falling objects for hero background ──────────────────────────────────
const FALLING_ITEMS = ["⌚", "📖", "🔑", "🎩", "☕", "🌹", "🃏", "⚗️"];

function FallingItems() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {FALLING_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-10 select-none"
          style={{ left: `${8 + i * 11.5}%` }}
          initial={{ y: -80, rotate: 0, opacity: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            rotate: [0, 180 + i * 40],
            opacity: [0, 0.12, 0.12, 0],
          }}
          transition={{
            duration: 8 + i * 1.2,
            delay: i * 1.4,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {item}
        </motion.div>
      ))}
    </div>
  );
}

// ── Etching texture overlay ───────────────────────────────────────────────
function EtchLines({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(0,0,0,${opacity}) 3px,
          rgba(0,0,0,${opacity}) 4px
        )`,
      }}
    />
  );
}

// ── Idea card for investor grid ───────────────────────────────────────────
const SAMPLE_IDEAS = [
  { id: "A", title: "AI-native legal contract review for SMBs", category: "SaaS / B2B", score: 87, trend: "Rising", tag: "Hot" },
  { id: "B", title: "Carbon credit marketplace for Southeast Asia", category: "Marketplace", score: 74, trend: "Rising", tag: "Emerging" },
  { id: "C", title: "Micro-pension app for gig economy workers", category: "Fintech", score: 91, trend: "Rising", tag: "Featured" },
  { id: "D", title: "Voice-first coding assistant for non-engineers", category: "Dev Tools", score: 68, trend: "Stable", tag: null },
  { id: "E", title: "Sleep health subscription for remote teams", category: "Health & Wellness", score: 82, trend: "Rising", tag: "New" },
  { id: "F", title: "B2B procurement automation for restaurants", category: "SaaS / B2B", score: 79, trend: "Stable", tag: null },
];

function IdeaCard({ idea, index }: { idea: typeof SAMPLE_IDEAS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      viewport={{ once: true }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative p-5 border cursor-pointer overflow-hidden"
      style={{
        background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        borderColor: hovered ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Corner suit mark */}
      <span className="absolute top-3 right-3 text-white/20 font-serif text-lg select-none">♠</span>

      {idea.tag && (
        <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 mb-3 border"
          style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}>
          {idea.tag}
        </span>
      )}

      <h3 className="font-serif text-white text-sm leading-snug mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
        "{idea.title}"
      </h3>

      <p className="text-white/30 text-[11px] uppercase tracking-wider mb-4">{idea.category}</p>

      {/* Score bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }}>
          <motion.div
            className="h-px bg-white"
            initial={{ width: 0 }}
            whileInView={{ width: `${idea.score}%` }}
            transition={{ delay: index * 0.08 + 0.3, duration: 0.8 }}
            viewport={{ once: true }}
          />
        </div>
        <span className="text-white/60 text-xs font-mono">{idea.score}</span>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-3 border-t flex items-center justify-between"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <span className="text-white/40 text-[11px]">{idea.trend} ↗</span>
            <span className="text-white/60 text-[11px] flex items-center gap-1">
              View report <ArrowRight className="w-3 h-3" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const rabbitY = useTransform(scrollYProgress, [0, 0.3], [0, 300]);
  const rabbitOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const holeScale = useTransform(scrollYProgress, [0.05, 0.3], [0, 1]);
  const holeOpacity = useTransform(scrollYProgress, [0.05, 0.2, 0.4], [0, 1, 0]);

  const [ideaText, setIdeaText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-x-hidden"
      style={{
        background: "#0a0a0a",
        fontFamily: "'Inter', sans-serif",
        color: "white",
      }}
    >
      {/* ── Global etching texture ── */}
      <EtchLines opacity={0.025} />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 h-16 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", background: "rgba(10,10,10,0.8)" }}>
        <div className="flex items-center gap-3">
          <RabbitSVG className="w-8 h-8 text-white/60" />
          <span className="font-serif text-white/90 tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
            Rabbit Hole
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/explore" className="text-white/40 hover:text-white/80 text-sm transition-colors tracking-wide">Trends</Link>
          <Link href="/login" className="text-white/40 hover:text-white/80 text-sm transition-colors tracking-wide">Sign in</Link>
          <Link href="/submit"
            className="text-sm px-5 py-2 border text-white/80 hover:text-white hover:border-white/40 transition-all tracking-wider"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}>
            Submit Idea
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — Step into the Rabbit Hole
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">

        {/* Falling items background */}
        <FallingItems />

        {/* Subtle radial vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(10,10,10,0.85) 100%)" }} />

        {/* Scrolling rabbit */}
        <motion.div
          style={{ y: rabbitY, opacity: rabbitOpacity }}
          className="absolute top-20 right-16 hidden md:block"
        >
          <RabbitSVG className="w-32 h-48 text-white/15" />
        </motion.div>

        {/* Rabbit hole portal */}
        <motion.div
          style={{ scale: holeScale, opacity: holeOpacity }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-40 pointer-events-none"
        >
          <div className="w-full h-full rounded-[50%]"
            style={{
              background: "radial-gradient(ellipse at center, #000 0%, rgba(0,0,0,0.6) 60%, transparent 100%)",
              boxShadow: "0 0 60px 30px rgba(0,0,0,0.8), inset 0 0 40px rgba(255,255,255,0.03)",
            }} />
          {/* Hole rim engraving */}
          <div className="absolute inset-0 rounded-[50%] border"
            style={{ borderColor: "rgba(255,255,255,0.08)" }} />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/30 text-xs tracking-[0.4em] uppercase mb-8"
          >
            Where ideas fall into something real
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl md:text-8xl font-serif leading-none tracking-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Step into the
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.55 }}
            className="text-5xl md:text-8xl font-serif leading-none tracking-tight mb-12 italic"
            style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255,255,255,0.7)" }}
          >
            Rabbit Hole.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/40 text-base leading-relaxed max-w-lg mx-auto mb-12"
          >
            Submit your idea anonymously. Our AI validates it.<br />
            The right investor finds it. And it becomes real.
          </motion.p>

          {/* Big idea input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="relative max-w-2xl mx-auto"
          >
            {/* Ornate border */}
            <div className="absolute -inset-[1px] pointer-events-none"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}>
              {/* Corner ornaments */}
              {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-4 h-4`}
                  style={{
                    borderTop: i < 2 ? "2px solid rgba(255,255,255,0.3)" : "none",
                    borderBottom: i >= 2 ? "2px solid rgba(255,255,255,0.3)" : "none",
                    borderLeft: i % 2 === 0 ? "2px solid rgba(255,255,255,0.3)" : "none",
                    borderRight: i % 2 === 1 ? "2px solid rgba(255,255,255,0.3)" : "none",
                  }} />
              ))}
            </div>

            <textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="Describe your idea... (What problem does it solve? Who is it for?)"
              rows={4}
              className="w-full px-6 py-5 text-white/80 text-sm leading-relaxed resize-none outline-none"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(8px)",
                border: "none",
                fontFamily: "'Inter', sans-serif",
              }}
            />

            <div className="flex items-center justify-between px-6 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-white/20 text-xs tracking-wider">Anonymous · Free · Instant</span>
              <Link href="/submit">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium tracking-wider transition-all"
                  style={{ background: "rgba(255,255,255,0.9)", color: "#0a0a0a" }}
                >
                  Fall in
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="mt-16 flex items-center justify-center gap-2 text-white/20"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                <rect x="1" y="1" width="10" height="18" rx="5" stroke="currentColor" strokeWidth="1"/>
                <circle cx="6" cy="6" r="2" fill="currentColor"/>
              </svg>
            </motion.div>
            <span className="text-xs tracking-widest">SCROLL</span>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PROCESS — The Caterpillar's Question
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 px-6 overflow-hidden">
        <EtchLines opacity={0.02} />

        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <p className="text-white/25 text-xs tracking-[0.4em] uppercase mb-4">The Process</p>
            <h2 className="text-4xl md:text-6xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              "Who are <em>you?</em>"
            </h2>
            <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">
              The caterpillar asked Alice three times. Our AI asks your idea the same — and doesn't stop until it has an answer.
            </p>
          </motion.div>

          {/* Caterpillar illustration */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true }}
            className="flex justify-center mb-20"
          >
            <CaterpillarSVG className="w-full max-w-lg text-white/25" />
          </motion.div>

          {/* 3 process steps */}
          <div className="grid md:grid-cols-3 gap-0">
            {[
              {
                num: "I.",
                title: "You fall.",
                desc: "Drop your idea anonymously. No pitch deck. No network. No name. Just the idea, raw.",
                icon: <RabbitSVG className="w-16 h-24 text-white/20 mx-auto" />,
              },
              {
                num: "II.",
                title: "It's questioned.",
                desc: "8 AI agents run in parallel — market size, competition, timing, moat, defensibility. Ruthlessly.",
                icon: <CheshireSVG className="w-40 h-24 text-white/20 mx-auto" />,
              },
              {
                num: "III.",
                title: "The right one finds it.",
                desc: "Investors browse validated ideas. No cold emails. No warm intros. Just signal.",
                icon: <CardSoldierSVG className="w-16 h-24 text-white/20 mx-auto" />,
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                viewport={{ once: true }}
                className="py-12 px-8 text-center relative"
                style={{
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {step.icon}
                <div className="mt-6 mb-3">
                  <span className="text-white/20 text-xs font-serif tracking-widest"
                    style={{ fontFamily: "'Playfair Display', serif" }}>{step.num}</span>
                </div>
                <h3 className="text-xl font-serif mb-3 text-white/80"
                  style={{ fontFamily: "'Playfair Display', serif" }}>{step.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          INVESTOR VIEW — The Card Soldiers' Grid
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 px-6 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.02) 50%, transparent)" }} />
        <EtchLines opacity={0.02} />

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-white/25 text-xs tracking-[0.4em] uppercase mb-3">For Investors</p>
              <h2 className="text-4xl md:text-5xl font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Queen's<br /><em>Garden of Ideas.</em>
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-xs"
            >
              {/* Card soldiers illustration */}
              <div className="flex gap-2 justify-end mb-4">
                {["♠","♣","♥"].map((suit, i) => (
                  <CardSoldierSVG key={i} className="w-10 h-16 text-white/15" />
                ))}
              </div>
              <p className="text-white/35 text-sm leading-relaxed text-right">
                AI-validated ideas. Scored. Ranked. Anonymous.<br/>
                The signal without the noise.
              </p>
            </motion.div>
          </div>

          {/* Idea grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            {SAMPLE_IDEAS.map((idea, i) => (
              <div key={idea.id} style={{ background: "#0a0a0a" }}>
                <IdeaCard idea={idea} index={i} />
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/explore"
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors tracking-wider border-b pb-0.5"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              View all validated ideas <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CHESHIRE QUOTE — The grin without the cat
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 px-6 text-center overflow-hidden">
        <EtchLines opacity={0.02} />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <CheshireSVG className="w-64 h-32 text-white/12 mx-auto mb-12" />

          <blockquote className="text-3xl md:text-5xl font-serif italic leading-tight text-white/60 mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            "We're all mad here."
          </blockquote>
          <p className="text-white/25 text-sm tracking-wider mb-16">— The Cheshire Cat</p>

          <p className="text-white/40 text-base leading-relaxed max-w-lg mx-auto mb-12">
            The best ideas always sound a little mad at first.<br />
            That's exactly why they need a place to be heard.
          </p>

          <Link href="/submit">
            <motion.button
              whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 px-10 py-4 border text-white/80 text-sm tracking-widest transition-all"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <RabbitSVG className="w-6 h-9 text-white/50" />
              Submit your idea — it's free
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="py-10 px-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RabbitSVG className="w-6 h-9 text-white/30" />
            <span className="text-white/30 text-sm font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Rabbit Hole
            </span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/explore" className="text-white/20 hover:text-white/50 text-xs tracking-wider transition-colors">Trends</Link>
            <Link href="/submit" className="text-white/20 hover:text-white/50 text-xs tracking-wider transition-colors">Submit</Link>
            <Link href="/login" className="text-white/20 hover:text-white/50 text-xs tracking-wider transition-colors">Sign in</Link>
          </div>
          <p className="text-white/15 text-xs">© 2026 Rabbit Hole</p>
        </div>
      </footer>
    </div>
  );
}