"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FallingAlice } from "@/components/ui/FallingAlice";

// ── Tenniel SVGs ──────────────────────────────────────────────────────────

/** Rabbit hopping — pocket watch in hand, mid-jump */
function RabbitHoppingSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Ears — perked forward (running) */}
      <path d="M34 52 Q28 18 30 2 Q36 20 38 52" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M30 2 Q33 14 36 52" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.4"/>
      <path d="M52 50 Q58 16 56 2 Q50 20 48 50" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M56 2 Q53 14 50 50" stroke="currentColor" strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* Head — tilted (looking back/up urgently) */}
      <ellipse cx="43" cy="62" rx="18" ry="16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Worried eyes */}
      <circle cx="36" cy="58" r="2.5" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="50" cy="56" r="2.5" stroke="currentColor" strokeWidth="1" fill="none"/>
      <circle cx="36" cy="58" r="1" fill="currentColor"/>
      <circle cx="50" cy="56" r="1" fill="currentColor"/>
      {/* Eyebrow — furrowed */}
      <path d="M33 54 Q36 52 40 54" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      <path d="M47 52 Q50 50 54 52" stroke="currentColor" strokeWidth="0.8" fill="none"/>
      {/* Nose */}
      <path d="M41 65 L43 68 L45 65" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Whiskers */}
      <path d="M22 62 L38 65" stroke="currentColor" strokeWidth="0.7"/>
      <path d="M22 66 L38 66" stroke="currentColor" strokeWidth="0.7"/>
      <path d="M64 62 L48 65" stroke="currentColor" strokeWidth="0.7"/>
      <path d="M64 66 L48 66" stroke="currentColor" strokeWidth="0.7"/>
      {/* Open mouth — panting */}
      <path d="M38 70 Q43 74 48 70" stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Body */}
      <path d="M28 76 Q20 94 22 116 Q43 126 64 116 Q66 94 58 76" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Waistcoat */}
      <path d="M32 80 L36 106 L43 108 L50 106 L54 80" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M43 80 L43 108" stroke="currentColor" strokeWidth="0.7"/>
      <circle cx="43" cy="88" r="1.2" stroke="currentColor" strokeWidth="0.7" fill="none"/>
      <circle cx="43" cy="96" r="1.2" stroke="currentColor" strokeWidth="0.7" fill="none"/>
      {/* Arm holding watch — raised high */}
      <path d="M28 82 Q14 68 8 54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Pocket watch */}
      <circle cx="8" cy="50" r="9" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      <path d="M8 43 L8 50 L13 50" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
      <path d="M8 41 Q10 38 12 40" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      {/* Watch chain */}
      <path d="M17 50 Q22 52 26 54 Q30 56 32 60" stroke="currentColor" strokeWidth="0.7" strokeDasharray="2 1.5"/>
      {/* Other arm — pumping back */}
      <path d="M58 82 Q72 72 78 62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Legs — mid-hop, both bent */}
      <path d="M28 114 Q18 128 14 144" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M58 114 Q68 124 72 138" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      {/* Feet pushing off / landing */}
      <path d="M8 144 Q14 150 24 146" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
      <path d="M66 138 Q72 144 80 140" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function CardSoldierSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="8" y="10" width="64" height="120" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <text x="14" y="26" fontSize="10" fill="currentColor" fontFamily="serif" opacity="0.5">♠</text>
      <text x="54" y="122" fontSize="10" fill="currentColor" fontFamily="serif" opacity="0.5" transform="rotate(180 62 117)">♠</text>
      <ellipse cx="40" cy="52" rx="13" ry="14" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M27 44 Q40 36 53 44" stroke="currentColor" strokeWidth="1.1" fill="none"/>
      <path d="M30 38 L31 44" stroke="currentColor" strokeWidth="1"/>
      <path d="M40 35 L40 44" stroke="currentColor" strokeWidth="1"/>
      <path d="M50 38 L49 44" stroke="currentColor" strokeWidth="1"/>
      <line x1="34" y1="51" x2="37" y2="51" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="43" y1="51" x2="46" y2="51" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M35 59 Q40 62 45 59" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M27 66 L27 96 L53 96 L53 66" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      <text x="33" y="85" fontSize="13" fill="currentColor" fontFamily="serif" opacity="0.4">♣</text>
      <path d="M27 72 L16 78 L17 88" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      <path d="M53 72 L64 78 L63 88" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      <line x1="17" y1="88" x2="17" y2="124" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M13 92 L17 83 L21 92" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M30 96 L28 124" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M50 96 L52 124" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M22 124 L36 124" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M46 124 L60 124" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// ── Sample investor idea cards ───────────────────────────────────────────
const SAMPLE_IDEAS = [
  { title: "AI-native legal review for SMBs", category: "SaaS / B2B", score: 87, trend: "Rising", tag: "Hot" },
  { title: "Carbon credit marketplace for SE Asia", category: "Marketplace", score: 74, trend: "Rising", tag: "Emerging" },
  { title: "Micro-pension app for gig workers", category: "Fintech", score: 91, trend: "Rising", tag: "Featured" },
  { title: "Voice-first coding for non-engineers", category: "Dev Tools", score: 68, trend: "Stable", tag: null },
  { title: "Sleep health sub for remote teams", category: "Health", score: 82, trend: "Rising", tag: "New" },
  { title: "B2B procurement for restaurants", category: "SaaS / B2B", score: 79, trend: "Stable", tag: null },
];

function IdeaCard({ idea, index }: { idea: typeof SAMPLE_IDEAS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      viewport={{ once: true }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="p-6 border cursor-pointer transition-all duration-300 relative overflow-hidden"
      style={{
        borderColor: hovered ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.1)",
        background: hovered ? "rgba(0,0,0,0.03)" : "white",
      }}
    >
      <span className="absolute top-3 right-4 text-black/10 font-serif text-xl select-none">♠</span>
      {idea.tag && (
        <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 mb-3 border border-black/15 text-black/35">
          {idea.tag}
        </span>
      )}
      <h3 className="font-serif text-black/80 text-sm leading-snug mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}>
        "{idea.title}"
      </h3>
      <p className="text-black/30 text-[11px] uppercase tracking-wider mb-4">{idea.category}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-black/10">
          <motion.div className="h-px bg-black/50"
            initial={{ width: 0 }}
            whileInView={{ width: `${idea.score}%` }}
            transition={{ delay: index * 0.07 + 0.3, duration: 0.9 }}
            viewport={{ once: true }} />
        </div>
        <span className="text-black/40 text-xs font-mono">{idea.score}</span>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  return (
    <div
      className="overflow-x-hidden"
      style={{ background: "#ffffff", fontFamily: "'Inter', sans-serif", color: "#1a1a1a" }}
    >
      <FallingAlice />
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 h-16 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.92)" }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rabbit.png" alt="Rabbit Hole" style={{ width: 36, height: "auto", filter: "grayscale(100%) contrast(1.3)", mixBlendMode: "multiply" }} />
          <span className="font-serif text-black/80 tracking-wide text-lg"
            style={{ fontFamily: "'Playfair Display', serif" }}>Rabbit Hole</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/explore" className="text-black/40 hover:text-black text-sm transition-colors tracking-wide">Trends</Link>
          <Link href="/login" className="text-black/40 hover:text-black text-sm transition-colors tracking-wide">Sign in</Link>
          <Link href="/submit"
            className="text-sm px-5 py-2 border text-black/70 hover:bg-black hover:text-white transition-all tracking-wider"
            style={{ borderColor: "rgba(0,0,0,0.2)" }}>
            Submit Idea
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="pt-32 pb-0 px-6 text-center relative">
        <motion.p
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-black/30 text-xs tracking-[0.4em] uppercase mb-6"
        >Where ideas fall into something real</motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35 }}
          className="text-5xl md:text-8xl font-serif leading-none tracking-tight mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Step into the
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5 }}
          className="text-5xl md:text-8xl font-serif italic leading-none tracking-tight mb-10"
          style={{ fontFamily: "'Playfair Display', serif", color: "rgba(0,0,0,0.4)" }}
        >
          Rabbit Hole.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.9 }}
          className="text-black/40 text-base max-w-md mx-auto mb-12 leading-relaxed"
        >
          Submit your idea anonymously.<br/>
          AI validates it. The right investor finds it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          className="flex items-center justify-center gap-4 mb-4"
        >
          <Link href="/submit">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 text-sm font-medium tracking-widest transition-all border border-black/80 bg-black text-white hover:bg-black/80">
              Submit anonymously — free
            </motion.button>
          </Link>
          <Link href="/explore">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 text-sm font-medium tracking-widest transition-all border text-black/60 hover:border-black/40"
              style={{ borderColor: "rgba(0,0,0,0.15)" }}>
              Browse ideas →
            </motion.button>
          </Link>
        </motion.div>

      </section>

      {/* ══════════════════════════════════════════
          LANDING — Process section
      ══════════════════════════════════════════ */}
      <section className="relative py-40 px-6 overflow-hidden"
        style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-black/25 text-xs tracking-[0.4em] uppercase">The Process</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0">
            {[
              {
                num: "I.",
                title: "You fall in.",
                desc: "Drop your idea anonymously. No pitch deck. No network. No name. Just the raw idea.",
                svg: <img src="/alice.png" alt="Alice" style={{ width: 160, margin: "0 auto", filter: "grayscale(100%) contrast(1.4) opacity(0.75)", mixBlendMode: "multiply" }} />,
              },
              {
                num: "II.",
                title: "It's questioned.",
                desc: "8 AI agents run in parallel — market size, competition, timing, moat, defensibility. Ruthlessly.",
                svg: <img src="/cata.png" alt="Caterpillar" style={{ width: 200, margin: "0 auto", filter: "grayscale(100%) contrast(1.4) opacity(0.85)", mixBlendMode: "multiply" }} />,
              },
              {
                num: "III.",
                title: "The right one finds it.",
                desc: "Investors browse AI-validated ideas. No cold emails. No warm intros. Just signal.",
                svg: <img src="/tea-party.png" alt="Tea Party" style={{ width: 240, margin: "0 auto", filter: "grayscale(100%) contrast(1.4) opacity(0.85)", mixBlendMode: "multiply" }} />,
              },
            ].map((step, i) => (
              <motion.div key={step.num}
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.7 }} viewport={{ once: true }}
                className="py-12 px-8 text-center"
                style={{
                  borderLeft: i > 0 ? "1px solid rgba(0,0,0,0.07)" : "none",
                  borderTop: "1px solid rgba(0,0,0,0.07)",
                }}
              >
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step.svg}
                </div>
                <div className="mt-6 mb-2">
                  <span className="text-black/20 text-xs font-serif tracking-widest"
                    style={{ fontFamily: "'Playfair Display', serif" }}>{step.num}</span>
                </div>
                <h3 className="text-xl font-serif mb-3 text-black/75"
                  style={{ fontFamily: "'Playfair Display', serif" }}>{step.title}</h3>
                <p className="text-black/35 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          INVESTOR GRID
      ══════════════════════════════════════════ */}
      <section className="relative py-40 px-6 overflow-hidden"
        style={{ background: "#ffffff", borderTop: "1px solid rgba(0,0,0,0.07)" }}>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }} viewport={{ once: true }}>
              <p className="text-black/25 text-xs tracking-[0.4em] uppercase mb-3">For Investors</p>
              <h2 className="text-4xl md:text-5xl font-serif"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                The Queen's<br /><em>Garden of Ideas.</em>
              </h2>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }} viewport={{ once: true }}
              className="flex gap-3 items-end">
              {[0, 1, 2].map(i => <CardSoldierSVG key={i} className="w-10 h-16 text-black/15" />)}
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ background: "rgba(0,0,0,0.07)" }}>
            {SAMPLE_IDEAS.map((idea, i) => (
              <div key={idea.title} style={{ background: "#ffffff" }}>
                <IdeaCard idea={idea} index={i} />
              </div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }} viewport={{ once: true }}
            className="text-center mt-10">
            <Link href="/explore"
              className="inline-flex items-center gap-2 text-sm text-black/35 hover:text-black/70 transition-colors tracking-wider border-b pb-0.5"
              style={{ borderColor: "rgba(0,0,0,0.15)" }}>
              View all validated ideas <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CHESHIRE QUOTE — CTA
      ══════════════════════════════════════════ */}
      <section className="relative py-40 px-6 text-center overflow-hidden"
        style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          transition={{ duration: 1.2 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chat.png" alt="Cheshire Cat" style={{ width: 200, margin: "0 auto 3rem", filter: "grayscale(100%) contrast(1.4) opacity(0.82)", mixBlendMode: "multiply" }} />
          <blockquote className="text-3xl md:text-5xl font-serif italic leading-tight text-black/50 mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            "We're all mad here."
          </blockquote>
          <p className="text-black/25 text-sm tracking-wider mb-14">— The Cheshire Cat</p>
          <p className="text-black/40 text-base leading-relaxed max-w-lg mx-auto mb-12">
            The best ideas always sound a little mad at first.<br />
            That's exactly why they need a place to be heard.
          </p>
          <Link href="/submit">
            <motion.button whileHover={{ scale: 1.03, background: "#1a1a1a" }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-3 px-10 py-4 border border-black/20 text-black/70 text-sm tracking-widest transition-all hover:text-white hover:border-black">
              <RabbitHoppingSVG className="w-6 h-9 text-current" />
              Submit your idea — it's free
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-8" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RabbitHoppingSVG className="w-6 h-9 text-black/25" />
            <span className="text-black/30 text-sm font-serif"
              style={{ fontFamily: "'Playfair Display', serif" }}>Rabbit Hole</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/explore" className="text-black/20 hover:text-black/50 text-xs tracking-wider transition-colors">Trends</Link>
            <Link href="/submit" className="text-black/20 hover:text-black/50 text-xs tracking-wider transition-colors">Submit</Link>
            <Link href="/login" className="text-black/20 hover:text-black/50 text-xs tracking-wider transition-colors">Sign in</Link>
          </div>
          <p className="text-black/15 text-xs">© 2026 Rabbit Hole</p>
        </div>
      </footer>
    </div>
  );
}