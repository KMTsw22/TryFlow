"use client";

// 분쟁 axis 결정 모달.
//
// 사용 흐름:
//   1) JudgeReviewSection 의 비교 표에서 분쟁(사람 분산 큰) axis 행의 "결정 →"
//      버튼을 누르면 이 모달이 열림.
//   2) 4가지 액션 중 하나 선택:
//        - accept_ai: AI 점수 그대로 final
//        - accept_human_avg: 사람 평균을 final
//        - manual_override: 직접 점수 입력 (사유 권장)
//        - request_rereview: 재평가 요청 (사유 권장)
//   3) 결정 시 onResolve 콜백으로 DisputeResolution 전달. 부모(JudgeReviewSection)
//      가 그 axis 의 결정 상태를 갱신 + 페이지 상태 반영.
//
// 데모 단계 제약:
//   - 결정은 client state 로만 동작. 새로고침하면 초기화. ("저장 안 됨" 라벨 표시.)

import { useEffect, useState } from "react";
import { X, Check, AlertTriangle, Repeat, Pencil, Cpu } from "lucide-react";
import type { DisputeAction, DisputeResolution } from "@/lib/fastlane/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 결정 대상 axis 의 사람이 읽을 이름 (예: "팀 역량") */
  criterionName: string;
  criterionId: string;
  /** 모달 안에서 옵션별 결과 미리보기에 필요한 컨텍스트 점수들. */
  aiMean: number;
  humanAverage: number | null;
  humanStddev: number;
  /** 결정자 (감사용 — 보통 현재 로그인 심사위원장). 데모에서는 첫 judge. */
  decidedBy: { judgeId: string; judgeName: string };
  /** 결정 확정 콜백. */
  onResolve: (resolution: DisputeResolution) => void;
}

// 액션 옵션 정의 — 모달의 시각적 표현은 이 배열을 순회해 만든다.
const OPTIONS: {
  action: DisputeAction;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** 사유 입력을 강제할지 — manual_override / request_rereview 는 권장. */
  reasonRequired: boolean;
}[] = [
  {
    action: "accept_ai",
    label: "AI 점수 채택",
    description: "AI 평균값을 최종 점수로 확정. AI 판단을 사람이 보증한다.",
    icon: Cpu,
    reasonRequired: false,
  },
  {
    action: "accept_human_avg",
    label: "심사위원 평균 채택",
    description: "이미 제출된 심사위원 점수의 평균을 최종으로 확정.",
    icon: Check,
    reasonRequired: false,
  },
  {
    action: "manual_override",
    label: "직접 결정",
    description: "심사위원장이 점수를 직접 입력. 사유를 함께 남긴다.",
    icon: Pencil,
    reasonRequired: true,
  },
  {
    action: "request_rereview",
    label: "재평가 회부",
    description: "추가 심사위원에게 다시 회부. 즉시 점수를 확정하지 않는다.",
    icon: Repeat,
    reasonRequired: true,
  },
];

export function DisputeResolutionModal({
  open,
  onClose,
  criterionName,
  criterionId,
  aiMean,
  humanAverage,
  humanStddev,
  decidedBy,
  onResolve,
}: Props) {
  // 선택된 액션. open 될 때마다 초기화 — 직전 선택이 남아있지 않게.
  const [action, setAction] = useState<DisputeAction>("accept_ai");
  const [manualScore, setManualScore] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (open) {
      setAction("accept_ai");
      setManualScore("");
      setReason("");
    }
  }, [open]);

  // ESC 로 닫기 — 접근성.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const selectedOpt = OPTIONS.find((o) => o.action === action);
  const reasonRequired = selectedOpt?.reasonRequired ?? false;

  // 액션별로 finalScore 가 결정되는 방식이 다름.
  const finalScore =
    action === "accept_ai"
      ? aiMean
      : action === "accept_human_avg"
      ? humanAverage ?? aiMean
      : action === "manual_override"
      ? Number(manualScore)
      : undefined; // request_rereview

  const manualValid =
    action !== "manual_override" ||
    (manualScore.trim().length > 0 &&
      Number.isFinite(Number(manualScore)) &&
      Number(manualScore) >= 0 &&
      Number(manualScore) <= 100);

  const reasonValid = !reasonRequired || reason.trim().length > 0;
  const canSubmit = manualValid && reasonValid;

  function handleSubmit() {
    if (!canSubmit) return;
    const resolution: DisputeResolution = {
      criterionId,
      action,
      finalScore,
      decidedBy,
      decidedAt: new Date().toISOString(),
      reason: reason.trim() || undefined,
    };
    onResolve(resolution);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-modal-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--t-border-bright)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-7 py-5"
          style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
        >
          <div className="min-w-0">
            <p
              className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase mb-1"
              style={{
                color: "var(--signal-attention)",
                letterSpacing: "0.14em",
              }}
            >
              <AlertTriangle className="w-3 h-3" strokeWidth={2.4} />
              분쟁 결정
            </p>
            <h2
              id="dispute-modal-title"
              style={{
                fontWeight: 700,
                fontSize: "1.25rem",
                lineHeight: 1.3,
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
              }}
            >
              {criterionName}
            </h2>
            <p
              className="text-[12px] mt-1 tabular-nums"
              style={{ color: "var(--text-tertiary)" }}
            >
              AI {aiMean} · 사람 평균{" "}
              {humanAverage ?? "—"} · 사람 σ {humanStddev.toFixed(1)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 transition-colors hover:bg-[color:var(--t-border-subtle)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Body — 액션 4개 라디오 */}
        <div className="px-7 py-5 space-y-2">
          {OPTIONS.map((opt) => {
            const selected = opt.action === action;
            // 미리보기 — 선택 시 최종 점수가 어떻게 잡힐지 옆에 작게.
            const preview =
              opt.action === "accept_ai"
                ? `최종 = ${aiMean}`
                : opt.action === "accept_human_avg"
                ? `최종 = ${humanAverage ?? "—"}`
                : opt.action === "manual_override"
                ? "직접 입력"
                : "최종 미정 (재평가)";
            return (
              <button
                key={opt.action}
                type="button"
                onClick={() => setAction(opt.action)}
                aria-pressed={selected}
                className="w-full text-left grid grid-cols-[auto_1fr_auto] items-start gap-4 px-4 py-3.5 transition-colors"
                style={{
                  background: selected ? "var(--accent-soft)" : "var(--surface-2)",
                  border: `1px solid ${
                    selected ? "var(--accent-ring)" : "var(--t-border-subtle)"
                  }`,
                }}
              >
                <opt.icon
                  className="w-4 h-4 mt-0.5 shrink-0"
                  strokeWidth={2.2}
                  // selected 시 accent 색, 아니면 tertiary.
                  // (inline style 로 css 변수 적용)
                  // @ts-expect-error — style on SVG is fine in React
                  style={{
                    color: selected
                      ? "var(--accent)"
                      : "var(--text-tertiary)",
                  }}
                />
                <div className="min-w-0">
                  <p
                    className="text-[13px] font-semibold mb-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {opt.label}
                  </p>
                  <p
                    className="text-[12px] leading-[1.55]"
                    style={{
                      color: "var(--text-secondary)",
                      wordBreak: "keep-all",
                    }}
                  >
                    {opt.description}
                  </p>
                </div>
                <span
                  className="text-[11px] tabular-nums font-semibold whitespace-nowrap pt-0.5"
                  style={{
                    color: selected ? "var(--accent)" : "var(--text-tertiary)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {preview}
                </span>
              </button>
            );
          })}
        </div>

        {/* manual_override 시 점수 입력 */}
        {action === "manual_override" && (
          <div className="px-7 pb-4">
            <label
              className="block text-[11px] font-bold uppercase mb-2"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
            >
              최종 점수 (0~100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={manualScore}
              onChange={(e) => setManualScore(e.target.value)}
              placeholder={`예: ${aiMean}`}
              aria-label="직접 입력 점수"
              className="w-32 px-3 h-10 text-[14px] font-semibold text-right tabular-nums outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--t-border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            {!manualValid && manualScore.length > 0 && (
              <p
                className="mt-1.5 text-[11.5px]"
                style={{ color: "var(--signal-danger)" }}
              >
                0에서 100 사이의 숫자만 입력 가능합니다.
              </p>
            )}
          </div>
        )}

        {/* 사유 — manual_override / request_rereview 에서 권장 */}
        <div className="px-7 pb-2">
          <label
            className="block text-[11px] font-bold uppercase mb-2"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
          >
            결정 사유 {reasonRequired ? "(필수)" : "(선택)"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={
              action === "request_rereview"
                ? "왜 추가 심사위원에게 회부하는지 짧게 적어주세요."
                : action === "manual_override"
                ? "왜 직접 결정했는지 짧게 적어주세요."
                : "추가 메모가 있으면 적어주세요."
            }
            className="w-full px-3 py-2.5 text-[13px] leading-[1.6] outline-none resize-none"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--t-border-subtle)",
              color: "var(--text-primary)",
              wordBreak: "keep-all",
            }}
          />
        </div>

        {/* Footer — 결정자 명시 + 액션 버튼 */}
        <div
          className="flex items-center justify-between gap-4 flex-wrap px-7 py-4 mt-3"
          style={{ borderTop: "1px solid var(--t-border-subtle)" }}
        >
          <p
            className="text-[11.5px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            결정자: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {decidedBy.judgeName}
            </span>{" "}
            · 샘플 데이터 — 새로고침 시 초기화
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
              style={{
                border: "1px solid var(--t-border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-5 h-9 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--accent)", letterSpacing: "0.01em" }}
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
              결정 확정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
