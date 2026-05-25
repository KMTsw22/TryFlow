"use client";

// 제안서 페이지에서 score 가 아직 없을 때 표시하는 상태 카드.
// pending/running 인 경우 자동으로 router.refresh() 폴링해서 평가 결과가
// 들어오면 부드럽게 score Hero 로 전환된다.
//
// 2026-05-25 보강 — "진행 중" 이 침묵하지 않도록:
//   - 경과 시간 표시 (running 상태부터 카운팅)
//   - 4단계(품질 게이트 → 3-Pass 채점 → 심층 분석 → 종합 리포트) 시각화.
//     실제 stage 는 백엔드에서 노출 안 되지만 시간 기반 추정으로도 충분.
//   - 시간 기반 progress bar — 예상 90초 기준 cap.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Clock, Check } from "lucide-react";

type Status = "pending" | "running" | "done" | "failed";

const POLL_MS = 4000;
// 시간 기반 stage 추정 — 실제 단계 정보는 백엔드에서 안 보내므로 평균값.
// 평균 90초 기준. 사용자 환경에 따라 더 짧을 수도 길 수도.
const STAGES: { label: string; reachedAt: number }[] = [
  { label: "품질 게이트", reachedAt: 0 },     // 시작
  { label: "3-Pass 채점", reachedAt: 5 },     // ~5초 후
  { label: "심층 분석", reachedAt: 45 },      // ~45초 후
  { label: "종합 리포트", reachedAt: 70 },    // ~70초 후
];
const ETA_SECONDS = 90;

export function EvaluationStatusCard({
  status,
  error,
}: {
  status: Status;
  error: string | null;
}) {
  const router = useRouter();
  // 컴포넌트 mount 시점부터 1초마다 +1. running 일 때만 카운팅.
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status === "done" || status === "failed") return;
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [status, router]);

  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // 현재 stage index — 시간 기반 추정.
  let currentStageIdx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (elapsed >= STAGES[i].reachedAt) {
      currentStageIdx = i;
      break;
    }
  }
  const progressPct = Math.min(100, Math.round((elapsed / ETA_SECONDS) * 100));

  if (status === "failed") {
    return (
      <section
        className="mb-14 px-6 py-5 flex items-start gap-4"
        style={{
          background: "var(--signal-danger-soft, color-mix(in srgb, var(--signal-danger) 8%, transparent))",
          border: "1px solid color-mix(in srgb, var(--signal-danger) 30%, transparent)",
        }}
      >
        <AlertTriangle
          className="w-5 h-5 mt-0.5 shrink-0"
          style={{ color: "var(--signal-danger)" }}
          strokeWidth={2.2}
        />
        <div>
          <p
            className="text-[11px] font-bold mb-1.5"
            style={{ color: "var(--signal-danger)", letterSpacing: "0.04em" }}
          >
            평가 실패
          </p>
          <p
            className="text-[14px] mb-1"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            AI 채점 중 오류가 발생했습니다.
          </p>
          {error && (
            <p
              className="text-[12px] leading-[1.6] mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {error}
            </p>
          )}
        </div>
      </section>
    );
  }

  // pending / running.
  const Icon = status === "running" ? Loader2 : Clock;
  return (
    <section
      className="mb-14 px-6 py-5"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-ring)",
      }}
    >
      <div className="flex items-start gap-4">
        <Icon
          className={`w-5 h-5 mt-0.5 shrink-0 ${status === "running" ? "animate-spin" : ""}`}
          style={{ color: "var(--accent)" }}
          strokeWidth={2.2}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
            <p
              className="text-[11px] font-bold"
              style={{ color: "var(--accent)", letterSpacing: "0.04em" }}
            >
              {status === "running" ? "AI 평가 진행 중" : "평가 대기 중"}
            </p>
            {status === "running" && (
              <span
                className="text-[11px] tabular-nums"
                style={{ color: "var(--text-tertiary)" }}
              >
                · {elapsed}초 경과 · 예상 1~2분
              </span>
            )}
          </div>
          <p
            className="text-[14px] mb-1"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            {status === "running"
              ? `${STAGES[currentStageIdx].label} 단계 진행 중`
              : "곧 평가가 시작됩니다."}
          </p>
          <p
            className="text-[12px] leading-[1.6] mt-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            이 페이지는 자동으로 갱신됩니다. 다른 페이지로 이동해도 평가는
            백그라운드에서 계속됩니다.
          </p>
        </div>
      </div>

      {/* Stage progress — running 일 때만 노출. */}
      {status === "running" && (
        <div className="mt-5">
          {/* 진행 막대 (시간 기반 추정) */}
          <div
            className="h-1 mb-3 overflow-hidden"
            style={{ background: "var(--t-border-subtle)" }}
          >
            <div
              className="h-full transition-[width] duration-1000 ease-linear"
              style={{
                width: `${progressPct}%`,
                background: "var(--accent)",
              }}
            />
          </div>
          {/* 4 단계 시각화 */}
          <ol className="grid grid-cols-4 gap-2">
            {STAGES.map((s, i) => {
              const done = i < currentStageIdx;
              const active = i === currentStageIdx;
              return (
                <li
                  key={s.label}
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{
                    color: active
                      ? "var(--accent)"
                      : done
                      ? "var(--text-secondary)"
                      : "var(--text-tertiary)",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {done ? (
                    <Check
                      className="w-3 h-3 shrink-0"
                      strokeWidth={2.4}
                      style={{ color: "var(--signal-success)" }}
                    />
                  ) : active ? (
                    <Loader2
                      className="w-3 h-3 shrink-0 animate-spin"
                      strokeWidth={2.4}
                    />
                  ) : (
                    <span
                      className="w-3 h-3 shrink-0 rounded-full"
                      style={{
                        border: "1.5px solid var(--text-tertiary)",
                        opacity: 0.4,
                      }}
                    />
                  )}
                  <span className="truncate">{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
