"use client";

// 항목별 점수 시각화 — 평균을 굵은 마커로, σ 범위를 옅은 띠로.
// "AI 가 N번 돌렸는데 결과가 이만큼 흔들렸다" 를 한 눈에.
//
// 디자인 결정:
//   - 막대는 0~100 의 트랙. 회색 베이스 위에 σ 범위 띠와 평균 마커 두 레이어.
//   - σ 가 큰 항목: 띠가 amber. 정상 항목: 띠가 accent indigo.
//   - 평균 마커: 1px 폭의 vertical line + 큰 dot. 위치가 시각적으로 "집힌다".
//   - 점수 숫자는 ScoreChip 으로 통일 — 다른 곳과 같은 무게감으로 보이게.
//   - Judge assessment 한 줄 + (axisMarkdown 있으면) 클릭으로 펼쳐 심층 분석 노출.

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AxisScore } from "@/lib/fastlane/types";
import { ScoreChip } from "./ScoreChip";
import { MarkdownReport } from "./MarkdownReport";

interface Props {
  axis: AxisScore;
  criterionName: string;
  weight: number;
  /** Phase 2 axis_analyzer 가 만든 심층 분석 markdown. 있으면 펼쳐서 표시. */
  axisMarkdown?: string;
}

export function AxisScoreBar({ axis, criterionName, weight, axisMarkdown }: Props) {
  const { mean, stddev, needsReview } = axis;
  const [expanded, setExpanded] = useState(false);
  const hasDeepAnalysis = !!axisMarkdown && axisMarkdown.trim().length > 0;

  // σ 범위 — mean ± stddev. 0~100 클램프.
  const sigmaLo = Math.max(0, mean - stddev);
  const sigmaHi = Math.min(100, mean + stddev);

  return (
    <div className="py-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <span
            className="ko-display text-[14px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {criterionName}
          </span>
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
          >
            가중치 {Math.round(weight * 100)}%
          </span>
        </div>
        <ScoreChip
          mean={mean}
          stddev={stddev}
          needsReview={needsReview}
          size="md"
          centered={false}
        />
      </div>

      {/* 트랙 — 0~100 */}
      <div
        className="relative h-[6px] rounded-full overflow-visible"
        style={{ background: "var(--t-border-subtle)" }}
      >
        {/* σ 범위 띠 */}
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            left: `${sigmaLo}%`,
            width: `${Math.max(1, sigmaHi - sigmaLo)}%`,
            background: needsReview
              ? "var(--signal-attention-ring)"
              : "var(--accent-ring)",
          }}
        />
        {/* 평균 마커 — 굵은 dot + 세로 라인 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{
            left: `${mean}%`,
            width: 2,
            height: 14,
            background:
              mean >= 75
                ? "var(--signal-success)"
                : mean >= 55
                ? "var(--signal-warning)"
                : "var(--signal-danger)",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{
            left: `${mean}%`,
            background: "var(--page-bg)",
            border: `2px solid ${
              mean >= 75
                ? "var(--signal-success)"
                : mean >= 55
                ? "var(--signal-warning)"
                : "var(--signal-danger)"
            }`,
          }}
        />
      </div>

      {/* σ 범위 라벨 — 좁은 텍스트로 정량 정보 보강 */}
      <div className="flex items-center justify-between mt-2 gap-3">
        <span
          className="text-[11px] tabular-nums shrink-0"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
        >
          3-Pass · {sigmaLo.toFixed(0)}–{sigmaHi.toFixed(0)} 범위
        </span>
        {hasDeepAnalysis && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-80 shrink-0"
            style={{ color: "var(--accent)", letterSpacing: "0.04em" }}
          >
            {expanded ? "분석 접기" : "심층 분석 보기"}
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Judge assessment — 한 줄 요약. 펼치면 줄바꿈 허용. */}
      {axis.reasoning && (
        <p
          className={`mt-2 text-[12px] leading-[1.7] ${expanded ? "" : "line-clamp-2"}`}
          style={{
            color: "var(--text-secondary)",
            fontStyle: "italic",
            fontFamily: "'Fraunces', serif",
          }}
        >
          &ldquo;{axis.reasoning}&rdquo;
        </p>
      )}

      {/* 심층 분석 — axis_analyzer 가 만든 markdown 전체. */}
      {expanded && hasDeepAnalysis && (
        <div
          className="mt-4 px-4 py-4"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--t-border-subtle)",
          }}
        >
          <MarkdownReport source={axisMarkdown!} />
        </div>
      )}
    </div>
  );
}
