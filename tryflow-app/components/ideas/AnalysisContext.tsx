"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface AnalysisReport {
  viability_score: number;
  summary: string;
  analysis: Record<
    string,
    {
      score: number;
      assessment?: string;
      detailed_assessment?: string;
      [key: string]: unknown;
    }
  >;
  cross_agent_insights: string[];
  opportunities: string[];
  risks: string[];
  next_steps: string[];
}

export type AnalysisStatus = "ready" | "pending" | "failed";

interface AnalysisCtxValue {
  report: AnalysisReport | null;
  status: AnalysisStatus;
}

const AnalysisCtx = createContext<AnalysisCtxValue | null>(null);

interface ProviderProps {
  submissionId: string;
  initialReport: AnalysisReport | null;
  children: React.ReactNode;
}

/**
 * Centralizes the AI analysis fetch + polling for the idea detail page.
 * Ensures every consumer (hero, next-steps, working/breaking, deep-analysis)
 * shares one source of truth and one loading phase — no duplicate requests,
 * no fragmented spinners, everything transitions in together.
 */
export function AnalysisProvider({
  submissionId,
  initialReport,
  children,
}: ProviderProps) {
  const [report, setReport] = useState<AnalysisReport | null>(initialReport);
  const [status, setStatus] = useState<AnalysisStatus>(
    initialReport ? "ready" : "pending"
  );

  useEffect(() => {
    if (initialReport) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 22; // ~90s at 4s interval

    async function tick() {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/analysis?submissionId=${submissionId}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.report) {
          setReport(data.report);
          setStatus("ready");
          return;
        }
      } catch {
        /* not ready yet */
      }
      if (attempts < MAX_ATTEMPTS) {
        timer = setTimeout(tick, 4000);
      } else if (!cancelled) {
        setStatus("failed");
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [submissionId, initialReport]);

  const value = useMemo(() => ({ report, status }), [report, status]);

  return <AnalysisCtx.Provider value={value}>{children}</AnalysisCtx.Provider>;
}

/**
 * Read the shared AI analysis state. Falls back to `{report: null, status: "pending"}`
 * when no provider is mounted (safe for contexts where analysis isn't relevant).
 */
export function useAnalysis(): AnalysisCtxValue {
  return useContext(AnalysisCtx) ?? { report: null, status: "pending" };
}
