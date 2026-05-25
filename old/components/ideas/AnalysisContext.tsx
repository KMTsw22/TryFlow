"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AGENT_IDS, type AgentId } from "@/lib/viability";

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

export type AgentProgressState = "queued" | "running" | "done" | "failed";

export interface AgentProgress {
  state: AgentProgressState;
  /** 0, 1, or 2 passes complete (draft / judge — 2026-04 merged skeptic into judge). */
  passesDone: number;
  score?: number;
}

export type StageKey =
  | "starting"
  | "gate"
  | "agents"
  | "synthesizer"
  | "complete"
  | "failed";

interface AnalysisCtxValue {
  report: AnalysisReport | null;
  status: AnalysisStatus;
  /** Per-agent live progress. Empty until SSE starts emitting. */
  agentProgress: Record<AgentId, AgentProgress>;
  /** Coarse pipeline stage for header copy. */
  currentStage: StageKey;
  /** Most recently activated agent — used to spotlight on the loading screen. */
  spotlightAgent: AgentId | null;
  /** Optional failure hints surfaced from the server (quality gate misses, etc.). */
  failureHints: string[];
}

const AnalysisCtx = createContext<AnalysisCtxValue | null>(null);

interface ProviderProps {
  submissionId: string;
  initialReport: AnalysisReport | null;
  children: React.ReactNode;
}

function emptyProgress(): Record<AgentId, AgentProgress> {
  const map = {} as Record<AgentId, AgentProgress>;
  for (const id of AGENT_IDS) map[id] = { state: "queued", passesDone: 0 };
  return map;
}

/**
 * Centralizes the AI analysis fetch + progress polling for the idea detail page.
 *
 * 2026-04 refactor: dropped SSE in favor of POST(JSON) + GET-progress polling.
 * 이유: Next.js 16 dev (turbopack) 환경에서 ReadableStream 응답이 실시간으로
 * flush 되지 않아 진행률 게이지가 끝까지 5% 에 머물다 결과만 갑자기 떴음.
 * 폴링 방식은 transport 버퍼링 영향 안 받고 dev/prod 동일하게 동작.
 *
 * Flow:
 *   - If `initialReport` already exists → status=ready, no network.
 *   - Otherwise POST /api/analysis (JSON 모드) — 서버는 30초쯤 LLM 돌리고
 *     완료된 보고서를 응답에 담아 반환. 그 동안 module-scope PROGRESS_MAP 에
 *     단계/agent 진행률 기록함.
 *   - 동시에 1초마다 GET /api/analysis?action=progress 폴링해서 UI 업데이트.
 *   - POST 가 끝나면 report 세팅 + status=ready (폴링도 자동 종료).
 *   - already_exists/실패는 동일하게 처리.
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
  const [agentProgress, setAgentProgress] = useState<Record<AgentId, AgentProgress>>(
    emptyProgress
  );
  const [currentStage, setCurrentStage] = useState<StageKey>(
    initialReport ? "complete" : "starting"
  );
  const [spotlightAgent, setSpotlightAgent] = useState<AgentId | null>(null);
  const [failureHints, setFailureHints] = useState<string[]>([]);

  // 2026-04 fix: React strict mode (dev) 의 이중 mount 에 의해 첫 fetch 가 즉시
  // abort 되고 재시작이 안 되는 버그 수정. setTimeout debounce — 첫 mount 는
  // 타이머만 세팅, cleanup 이 clear. 두 번째 mount 에서 실제 fetch.
  useEffect(() => {
    if (initialReport) return;

    let cancelled = false;
    const abort = new AbortController();

    async function fetchExistingReport(): Promise<AnalysisReport | null> {
      try {
        const res = await fetch(`/api/analysis?submissionId=${submissionId}`, {
          signal: abort.signal,
        });
        const data = await res.json();
        return data?.report ?? null;
      } catch {
        return null;
      }
    }

    // POST 한 번 — 서버가 분석을 끝까지 돌리고 최종 결과를 응답에 담아 반환.
    // 30초쯤 걸리지만 그 동안 progress 폴링이 UI 를 갱신함.
    async function startAnalysis() {
      try {
        const res = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId }),
          signal: abort.signal,
        });
        if (cancelled) return;

        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && data?.report) {
          setReport(data.report as AnalysisReport);
          setStatus("ready");
          setCurrentStage("complete");
          return;
        }

        // 409 already_exists — 다른 탭/요청이 분석을 이미 만들었음. GET 으로 가져옴.
        if (res.status === 409 || data?.stage === "already_exists") {
          const existing = await fetchExistingReport();
          if (cancelled) return;
          if (existing) {
            setReport(existing);
            setStatus("ready");
            setCurrentStage("complete");
          } else {
            setStatus("failed");
            setCurrentStage("failed");
          }
          return;
        }

        // 422 hard_gate / 500 등 — 실패 상태로 전환, hints 노출.
        setStatus("failed");
        setCurrentStage("failed");
        const hints = (data?.hints as string[] | undefined) ?? [];
        if (hints.length > 0) setFailureHints(hints);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        if (cancelled) return;
        console.error("AnalysisProvider POST error:", err);
        setStatus("failed");
        setCurrentStage("failed");
      }
    }

    // 1초마다 진행 상태 폴링. POST 가 끝나면 cancelled=true 또는 폴링이
    // completed/failed 를 받고 자체 종료.
    type ProgressResponse = {
      progress: {
        stage: StageKey;
        agentProgress: Record<string, { state: string; passesDone: number; score?: number }>;
        spotlightAgent: string | null;
        hints?: string[];
        completed: boolean;
        failed: boolean;
      } | null;
    };

    async function pollProgress() {
      // 첫 호출은 약간 지연 — POST 가 PROGRESS_MAP 채울 시간 확보.
      await new Promise<void>((r) => setTimeout(r, 600));
      while (!cancelled) {
        try {
          const res = await fetch(
            `/api/analysis?action=progress&submissionId=${submissionId}`,
            { signal: abort.signal, cache: "no-store" }
          );
          if (cancelled) return;
          const data = (await res.json().catch(() => null)) as ProgressResponse | null;
          if (cancelled) return;

          const p = data?.progress;
          if (p) {
            setCurrentStage(p.stage);
            // agentProgress 키 보정 — 서버는 string 키, 클라는 AgentId 키.
            const ap = {} as Record<AgentId, AgentProgress>;
            for (const id of AGENT_IDS) {
              const sv = p.agentProgress[id];
              ap[id] = sv
                ? {
                    state: (sv.state as AgentProgress["state"]) ?? "queued",
                    passesDone: sv.passesDone ?? 0,
                    score: sv.score,
                  }
                : { state: "queued", passesDone: 0 };
            }
            // 변동 없는 폴링은 skip — 매초 새 객체로 setState 하면 reference 가
            // 바뀌어서 자식 6장이 전부 매초 re-render → "톡톡 끊기는" 느낌의 원인.
            setAgentProgress((prev) => {
              for (const id of AGENT_IDS) {
                const a = prev[id];
                const b = ap[id];
                if (
                  a.state !== b.state ||
                  a.passesDone !== b.passesDone ||
                  a.score !== b.score
                ) {
                  return ap;
                }
              }
              return prev;
            });
            setSpotlightAgent((p.spotlightAgent as AgentId | null) ?? null);
            if (p.hints && p.hints.length > 0) {
              setFailureHints((prev) => {
                if (
                  prev.length === p.hints!.length &&
                  prev.every((h, i) => h === p.hints![i])
                ) {
                  return prev;
                }
                return p.hints!;
              });
            }
            // completed/failed 는 startAnalysis 가 최종 처리. 폴링은 그냥 종료.
            if (p.completed || p.failed) return;
          }
        } catch (err) {
          if ((err as { name?: string })?.name === "AbortError") return;
          // 네트워크 일시적 오류는 무시하고 다음 tick 시도.
        }
        await new Promise<void>((r) => setTimeout(r, 1_000));
      }
    }

    const timer = setTimeout(() => {
      startAnalysis();
      pollProgress();
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      abort.abort();
    };
  }, [submissionId, initialReport]);

  const value = useMemo<AnalysisCtxValue>(
    () => ({
      report,
      status,
      agentProgress,
      currentStage,
      spotlightAgent,
      failureHints,
    }),
    [report, status, agentProgress, currentStage, spotlightAgent, failureHints]
  );

  return <AnalysisCtx.Provider value={value}>{children}</AnalysisCtx.Provider>;
}

/**
 * Read the shared AI analysis state. Falls back to default values when no
 * provider is mounted (safe for contexts where analysis isn't relevant).
 */
export function useAnalysis(): AnalysisCtxValue {
  return (
    useContext(AnalysisCtx) ?? {
      report: null,
      status: "pending",
      agentProgress: emptyProgress(),
      currentStage: "starting",
      spotlightAgent: null,
      failureHints: [],
    }
  );
}
