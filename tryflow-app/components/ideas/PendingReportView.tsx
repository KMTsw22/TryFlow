"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowLeft, Loader2 } from "lucide-react";

/**
 * PendingReportView — 리포트가 아직 생성되지 않은 상태의 풀블리드 로딩 화면.
 *
 * 이 컴포넌트가 존재하는 이유 (교수님 피드백 대응):
 *   - 생성 중에 뒷면의 빈 템플릿 / 휴리스틱 점수(예: 66점)가 절대 노출되지 않아야 한다.
 *   - 로딩이 "그냥 스피너"가 아니라 제품이 일하고 있다는 확신을 줘야 한다.
 *   - 실패했을 때 박힌 가짜 점수 대신, 재시도로 깔끔하게 유도해야 한다.
 *
 * 구조:
 *   - 6-에이전트 스테이지가 순차적으로 완료되는 내러티브 (시간 기반 시뮬레이션)
 *   - 95%에서 멈춰 있다가 실제 리포트가 들어오면 router.refresh()로 교체
 *   - POLL_INTERVAL_MS 주기로 서버 refresh를 걸어 리포트가 생성되면 즉시 전환
 *   - GIVE_UP_AFTER_MS 경과 시 친절한 "계속 기다리는 중 / 재시도" 모드로 전환
 */

const DISPLAY = "'Inter', sans-serif";
const SERIF = "'Fraunces', serif";

const POLL_INTERVAL_MS = 5000;
const GIVE_UP_AFTER_MS = 90_000;

// 에이전트 스테이지 — AnalysisProgressStrip 과 동일한 순서로 유지해
// 사용자가 다른 화면에서도 같은 제품이 같은 일을 하고 있다고 느끼게 한다.
// 2026-04 refactor: 8 axes → 6. See decisions/evaluation-axes-rationale.md.
const AGENT_STAGES: { label: string; hint: string }[] = [
  { label: "Parsing your submission", hint: "Reading category, target user, and description" },
  { label: "Market Size", hint: "Estimating TAM, SAM, and buyer pool" },
  { label: "Problem & Urgency", hint: "Testing pain severity, frequency, and willingness-to-pay signals" },
  { label: "Timing", hint: "Checking tech enablers, buyer readiness, and forcing functions" },
  { label: "Product (10x)", hint: "Comparing the solution to alternatives users actually rank by" },
  { label: "Moat & Defensibility", hint: "Looking for network effects, switching costs, and durable advantages" },
  { label: "Business Model", hint: "Evaluating pricing, unit economics, and go-to-market channels" },
  { label: "Synthesizing the verdict", hint: "Weighting axes and drafting your report" },
];

const TOTAL_ESTIMATE_MS = 45_000;

interface Props {
  submittedDate: string;
}

export function PendingReportView({ submittedDate }: Props) {
  const router = useRouter();
  const startedAtRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // 경과 시간 / 폴링 / 스테이지 계산은 모두 elapsedMs 한 변수에서 파생된다.
  useEffect(() => {
    startedAtRef.current = Date.now();

    // 부드러운 진행바를 위해 250ms 로 elapsed 를 갱신.
    const tickId = setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 250);

    // 서버에 새 리포트가 저장됐는지 주기적으로 재요청.
    const pollId = setInterval(() => {
      const now = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      if (now >= GIVE_UP_AFTER_MS) {
        clearInterval(pollId);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(tickId);
      clearInterval(pollId);
    };
  }, [router]);

  const gaveUp = elapsedMs >= GIVE_UP_AFTER_MS;

  // 실제 리포트가 아직 안 온 동안에는 95%에서 멈춰 있다가, 리포트 도착 시 서버 컴포넌트
  // 가 교체되어 이 화면이 사라진다 — 100% 가 되는 시점은 사용자 눈에 보이지 않아도 괜찮다.
  const pct = Math.min(95, (elapsedMs / TOTAL_ESTIMATE_MS) * 100);
  const stageIdx = Math.min(
    AGENT_STAGES.length - 1,
    Math.floor((pct / 95) * AGENT_STAGES.length)
  );

  const elapsedSec = Math.floor(elapsedMs / 1000);
  const elapsedLabel =
    elapsedSec < 60
      ? `${elapsedSec}s elapsed`
      : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s elapsed`;

  async function handleRerun() {
    // 포기 상태에서 사용자가 명시적으로 재시도할 때만 호출된다.
    if (retrying) return;
    setRetrying(true);
    try {
      // 여기서는 submissionId 를 모르기 때문에 서버 refresh 로 충분히 처리됨.
      // (필요 시 submissionId prop 을 받아서 /api/analysis POST 로 강제 트리거 가능)
      router.refresh();
    } finally {
      // refresh 가 끝나면 이 컴포넌트 자체가 언마운트되므로, 어느 쪽이든 상태 복구는 불필요.
      setTimeout(() => setRetrying(false), 1500);
    }
  }

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] overflow-hidden"
      aria-label="Report generating"
      aria-busy={!gaveUp}
    >
      {/* 배경 — 은은한 그라디언트 + 천천히 도는 액센트 글로우.
          풀블리드 레이어라 뒤쪽 빈 템플릿이 절대 보이지 않는다. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, var(--accent-soft) 0%, transparent 70%), linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, var(--accent), transparent 60%, var(--accent))",
          animation: gaveUp ? "none" : "pending-orbit 18s linear infinite",
        }}
        aria-hidden
      />

      <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16">
        {/* Editorial kicker */}
        <div className="flex items-center gap-4 mb-10">
          <span
            className="inline-flex items-center gap-2.5 text-[13px] font-medium tracking-[0.08em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: gaveUp ? "var(--signal-warning)" : "var(--accent)" }}
          >
            <span
              className={gaveUp ? "w-2 h-2 rounded-full" : "w-2 h-2 rounded-full animate-pulse"}
              style={{ background: gaveUp ? "var(--signal-warning)" : "var(--accent)" }}
              aria-hidden
            />
            {gaveUp ? "Still running" : "AI analysis in progress"}
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
          <span
            className="text-[13px] font-medium tracking-[0.06em] uppercase shrink-0"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            {elapsedLabel}
          </span>
        </div>

        {/* H1 — 에디토리얼 디스플레이, 대시보드/리포트 타이틀 톤과 통일 */}
        <h1
          className="mb-5"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          {gaveUp ? "Your report is taking a little longer." : "We’re reading your idea."}
        </h1>

        <p
          className="text-[17px] leading-[1.7] mb-12 max-w-2xl"
          style={{ color: "var(--text-secondary)" }}
        >
          {gaveUp
            ? "The 6-agent analysis hasn’t completed yet. You can wait, head back to your dashboard — we’ll hold the report for you — or restart the run now."
            : `Six specialist agents are reading your submission from six angles. Submitted ${submittedDate}.`}
        </p>

        {/* Progress bar — 95% 캡 + 부드러운 트랜지션 */}
        {!gaveUp && (
          <div className="mb-10">
            <div
              className="relative w-full h-[3px] overflow-hidden"
              style={{ background: "var(--t-border-subtle)" }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(pct)}
            >
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out"
                style={{ width: `${pct}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        )}

        {/* Agent stage list — 완료 / 진행 / 대기 3개 상태 */}
        <section aria-label="Analysis stages" className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <span
              className="text-[12px] font-medium tracking-[0.08em] uppercase"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              The Pipeline
            </span>
            <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
            <span
              className="text-[12px] font-medium tracking-[0.06em] uppercase shrink-0 tabular-nums"
              style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
            >
              {Math.min(stageIdx + 1, AGENT_STAGES.length)} / {AGENT_STAGES.length}
            </span>
          </div>

          <ol className="space-y-0 border-t" style={{ borderColor: "var(--t-border-subtle)" }}>
            {AGENT_STAGES.map((stage, i) => {
              const state: "done" | "active" | "queued" =
                gaveUp && i > stageIdx
                  ? "queued"
                  : i < stageIdx
                  ? "done"
                  : i === stageIdx
                  ? "active"
                  : "queued";

              return (
                <li
                  key={stage.label}
                  className="flex items-baseline gap-5 py-3.5 border-b"
                  style={{
                    borderColor: "var(--t-border-subtle)",
                    opacity: state === "queued" ? 0.45 : 1,
                  }}
                >
                  {/* Stage index */}
                  <span
                    className="tabular-nums shrink-0 w-8"
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 700,
                      fontSize: "1rem",
                      letterSpacing: "-0.01em",
                      color:
                        state === "done"
                          ? "var(--accent)"
                          : state === "active"
                          ? "var(--text-primary)"
                          : "var(--text-tertiary)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Stage label */}
                  <span
                    className="text-[14px] font-medium tracking-[0.06em] uppercase shrink-0 w-52"
                    style={{
                      fontFamily: DISPLAY,
                      color: state === "active" ? "var(--text-primary)" : "var(--text-tertiary)",
                    }}
                  >
                    {stage.label}
                  </span>

                  {/* Hint */}
                  <span
                    className="flex-1 text-[13.5px] leading-[1.55] truncate"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {stage.hint}
                  </span>

                  {/* State marker */}
                  <span
                    className="shrink-0 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] uppercase tabular-nums"
                    style={{
                      fontFamily: DISPLAY,
                      color:
                        state === "done"
                          ? "var(--accent)"
                          : state === "active"
                          ? "var(--text-primary)"
                          : "var(--text-tertiary)",
                    }}
                  >
                    {state === "done" && (
                      <>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--accent)" }}
                          aria-hidden
                        />
                        Done
                      </>
                    )}
                    {state === "active" && (
                      <>
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: "var(--text-primary)" }}
                          aria-hidden
                        />
                        Running
                      </>
                    )}
                    {state === "queued" && (
                      <>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--t-border-bright)" }}
                          aria-hidden
                        />
                        Queued
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Actions — 기본은 "돌아가기", 포기 상태일 땐 "재시도" 까지 */}
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-[14px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-secondary)" }}
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
            Back to dashboard
          </Link>

          <span aria-hidden className="text-[13px]" style={{ color: "var(--t-border-bright)" }}>
            ·
          </span>

          {gaveUp ? (
            <button
              type="button"
              onClick={handleRerun}
              disabled={retrying}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold tracking-[0.06em] uppercase text-white transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
            >
              {retrying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Check again
                </>
              )}
            </button>
          ) : (
            <Link
              href="/submit"
              className="group inline-flex items-center gap-2 text-[14px] font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
            >
              Submit another idea
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>

        {/* Footer — 기대치 설정용 한 줄 */}
        <p
          className="mt-12 text-[12.5px] leading-[1.6]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Reports typically finish within 60–90 seconds. This page refreshes automatically the
          moment the verdict is ready.
        </p>
      </div>

      {/* 로컬 키프레임 — globals.css 를 건드리지 않고 이 컴포넌트 스코프에 한정 */}
      <style jsx>{`
        @keyframes pending-orbit {
          from {
            transform: translateX(-50%) rotate(0deg);
          }
          to {
            transform: translateX(-50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
