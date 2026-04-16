"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Circle, X, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  hasIdeas: boolean;
  hasReport: boolean;
  firstIdeaId: string | null;
}

const STORAGE_KEY = "trywepp_onboarding_v1";

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

  const steps = [
    {
      key: "submit",
      done: step1Done,
      title: "Submit your first idea",
      desc: "Get an AI viability score in under 2 minutes.",
      cta: step1Done ? null : { label: "Submit", href: "/submit" },
    },
    {
      key: "report",
      done: step2Done,
      title: "Read your insight report",
      desc: "See viability, market saturation, and trend direction.",
      cta:
        step2Done || !step1Done
          ? null
          : firstIdeaId
          ? { label: "Open report", href: `/ideas/${firstIdeaId}` }
          : null,
    },
    {
      key: "market",
      done: step3Done,
      title: "Browse the market",
      desc: "See what other founders are building across 9 categories.",
      cta: step3Done
        ? null
        : {
            label: "Open Market",
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
    <div
      className="relative border p-5 mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))",
        borderColor: "rgba(129,140,248,0.25)",
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss onboarding"
        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
          Getting started
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto mr-6">
          {completedCount} / 3
        </span>
      </div>
      <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">
        3 steps to get the most out of Try.Wepp
      </h2>

      <ul className="space-y-2">
        {steps.map((s) => (
          <li
            key={s.key}
            className={cn(
              "flex items-center gap-3 p-3 border transition-colors",
              s.done
                ? "opacity-60"
                : "hover:border-indigo-400/40"
            )}
            style={{
              background: "var(--card-bg)",
              borderColor: s.done ? "var(--t-border-subtle)" : "var(--t-border-card)",
            }}
          >
            <div className="shrink-0">
              {s.done ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ) : (
                <Circle className="w-6 h-6 text-gray-400 dark:text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  s.done
                    ? "text-gray-500 dark:text-gray-400 line-through"
                    : "text-gray-900 dark:text-white"
                )}
              >
                {s.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {s.desc}
              </p>
            </div>
            {s.cta && (
              <Link
                href={s.cta.href}
                onClick={s.cta.onClick}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                {s.cta.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
