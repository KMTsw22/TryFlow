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
 * Centralizes the AI analysis fetch + SSE streaming for the idea detail page.
 *
 * 2026-04 refactor: replaced 4-second poll with a real SSE stream so the
 * loading screen can show actual per-agent progress instead of a time-based
 * simulation (교수님 피드백: "지금 뭘하고 있는지 보여줘").
 *
 * Flow:
 *   - If `initialReport` already exists → status=ready, no network.
 *   - Otherwise POST to /api/analysis with text/event-stream Accept and parse
 *     SSE events as they arrive: agent passes, synthesizer phases, complete.
 *   - On `complete` → setReport + status=ready.
 *   - On `failed` (other than "already_exists") → status=failed, surface hints.
 *   - On `failed` with stage=already_exists → fall back to a single GET poll
 *     for the existing report (analysis was triggered by another tab/request).
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
  // abort 되고 재시작이 안 되는 버그 수정. 과거엔 startedRef 로 2번째 mount 를
  // 막았는데, 첫 fetch 가 cleanup 에서 abort 되어 아무 것도 안 됐음.
  //
  // 해결: setTimeout 으로 debounce. 첫 mount 는 타이머 세팅만, strict mode
  // cleanup 이 타이머 clear. 두 번째 mount 에서 새 타이머가 실제 fetch 를 쏨.
  // Production 에서는 한 번만 mount → 50ms 지연 후 정상 실행.
  useEffect(() => {
    if (initialReport) return;

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

    async function consume() {
      try {
        const res = await fetch("/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ submissionId }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          // Couldn't even start the stream — fall back to a one-shot poll.
          const existing = await fetchExistingReport();
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

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by blank lines. Each event has one or
          // more `data: …` lines that we concatenate, then JSON-parse.
          let sepIdx;
          while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, sepIdx);
            buffer = buffer.slice(sepIdx + 2);
            const dataLines = raw
              .split("\n")
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.slice(5).trimStart());
            if (dataLines.length === 0) continue;
            try {
              const evt = JSON.parse(dataLines.join("\n")) as {
                event: string;
                [k: string]: unknown;
              };
              handleEvent(evt);
              if (evt.event === "complete" || evt.event === "failed") {
                // Server will close after these — stop reading.
                return;
              }
            } catch (parseErr) {
              console.warn("SSE parse error:", parseErr, raw);
            }
          }
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("AnalysisProvider stream error:", err);
        setStatus("failed");
        setCurrentStage("failed");
      }
    }

    function handleEvent(evt: { event: string; [k: string]: unknown }) {
      switch (evt.event) {
        case "hard_gate_done":
          setCurrentStage("gate");
          break;
        case "agents_start":
          setCurrentStage("agents");
          // Mark all 6 agents as queued (default) — they'll flip to running
          // as soon as their first pass completes.
          setAgentProgress(emptyProgress());
          break;
        case "agent_pass_done": {
          const id = evt.id as AgentId;
          const pass = evt.pass as number;
          const score = evt.score as number | undefined;
          setAgentProgress((prev) => ({
            ...prev,
            [id]: {
              state: "running",
              passesDone: pass,
              score: score ?? prev[id]?.score,
            },
          }));
          setSpotlightAgent(id);
          break;
        }
        case "agent_done": {
          const id = evt.id as AgentId;
          const score = evt.score as number | null | undefined;
          setAgentProgress((prev) => ({
            ...prev,
            [id]: {
              state: score === null ? "failed" : "done",
              passesDone: 2,
              score: typeof score === "number" ? score : prev[id]?.score,
            },
          }));
          break;
        }
        case "synthesizer_start":
        case "synthesizer_draft_done":
          setCurrentStage("synthesizer");
          setSpotlightAgent(null);
          break;
        case "complete": {
          const r = evt.report as AnalysisReport | undefined;
          if (r) {
            setReport(r);
            setStatus("ready");
            setCurrentStage("complete");
          }
          break;
        }
        case "failed": {
          const stage = evt.stage as string | undefined;
          const hints = (evt.hints as string[] | undefined) ?? [];
          if (stage === "already_exists") {
            // Another tab/process generated the report. Poll once for it
            // instead of giving up.
            fetchExistingReport().then((existing) => {
              if (existing) {
                setReport(existing);
                setStatus("ready");
                setCurrentStage("complete");
              } else {
                setStatus("failed");
                setCurrentStage("failed");
              }
            });
          } else {
            setStatus("failed");
            setCurrentStage("failed");
            if (hints.length > 0) setFailureHints(hints);
          }
          break;
        }
      }
    }

    // Debounce 로 strict mode 이중 mount 회피 — 첫 mount 의 cleanup 이 타이머
    // 를 clear 하고, 재 mount 에서 새 타이머가 실제 실행함.
    const timer = setTimeout(() => consume(), 50);

    return () => {
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
