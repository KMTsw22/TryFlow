"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";

interface Props {
  hasIdeas: boolean;
  hasReport: boolean;
  firstIdeaId: string | null;
}

const STORAGE_KEY = "trywepp_onboarding_v1";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

type Stored = { dismissed?: boolean; browsedMarket?: boolean };

function readStored(): Stored {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStored(next: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function OnboardingChecklist({ hasIdeas, hasReport, firstIdeaId }: Props) {
  const [mounted, setMounted] = useState(false);
  const [stored, setStored] = useState<Stored>({});

  useEffect(() => {
    setStored(readStored());
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (stored.dismissed) return null;

  const step1Done = hasIdeas;
  const step2Done = hasReport;
  const step3Done = !!stored.browsedMarket;
  const allDone = step1Done && step2Done && step3Done;

  if (allDone) return null;

  const steps: Array<{
    key: string;
    done: boolean;
    label: string;
    desc: string;
    cta: { label: string; href: string; onClick?: () => void } | null;
  }> = [
    {
      key: "submit",
      done: step1Done,
      label: "Submit",
      desc: "Get an AI viability score in under 2 minutes.",
      cta: step1Done ? null : { label: "Start", href: "/submit" },
    },
    {
      key: "report",
      done: step2Done,
      label: "Read",
      desc: "Open your insight report — score, saturation, trend.",
      cta:
        step2Done || !step1Done
          ? null
          : firstIdeaId
          ? { label: "Open", href: `/ideas/${firstIdeaId}` }
          : null,
    },
    {
      key: "market",
      done: step3Done,
      label: "Explore",
      desc: "See what other founders are building across 9 categories.",
      cta: step3Done
        ? null
        : {
            label: "Browse",
            href: "/explore",
            onClick: () => {
              const next = { ...stored, browsedMarket: true };
              setStored(next);
              writeStored(next);
            },
          },
    },
  ];

  const completedCount = [step1Done, step2Done, step3Done].filter(Boolean).length;

  const dismiss = () => {
    const next = { ...stored, dismissed: true };
    setStored(next);
    writeStored(next);
  };

  return (
    <section
      aria-label="Getting started checklist"
      className="relative mb-14 pb-10 border-b"
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss onboarding"
        className="absolute top-0 right-0 p-2 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-tertiary)" }}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-4 mb-6">
        <span
          className="text-[15px] font-medium tracking-[0.08em] uppercase"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          Getting Started
        </span>
        <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        <span
          className="text-[15px] font-medium tracking-[0.06em] uppercase tabular-nums"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          {completedCount} / 3
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className="flex flex-col"
            style={{ opacity: s.done ? 0.5 : 1 }}
          >
            <div className="flex items-baseline gap-3 mb-2">
              <span
                className="tabular-nums leading-none"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.02em",
                  color: s.done ? "var(--signal-success)" : "var(--text-tertiary)",
                }}
              >
                {s.done ? "✓" : String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="text-[15px] font-medium tracking-[0.08em] uppercase"
                style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
              >
                {s.label}
              </span>
            </div>
            <p
              className="text-[13px] leading-[1.6] mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              {s.desc}
            </p>
            {s.cta && (
              <Link
                href={s.cta.href}
                onClick={s.cta.onClick}
                className="group inline-flex items-center gap-1.5 text-[14px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70 mt-auto"
                style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
              >
                {s.cta.label}
                <ArrowRight
                  className="w-3 h-3 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
