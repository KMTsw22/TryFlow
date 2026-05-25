"use client";

// 항목별 평가 — collapsible 컨테이너.
//
// 2026-05-21 도입: AI 봉투 안 "항목별 평가" 섹션이 8개 행으로 펼쳐져 있어
// 페이지 세로가 길어지고, 심사 작업 영역으로 가는 스크롤이 과함.
//   Hero 의 종합 점수 + verdict + 검토 권고 카드만으로도 핵심은 전달되므로
//   상세 분석은 기본 접고 토글로 제공.
//
// 동작:
//   - 기본 접힘. 한 줄 summary: "항목별 평가 · N개 항목 · 검토 권고 K개" + 펼치기 버튼
//   - 펼침 시 AxisScoreBar × N + 채점 기준 설명 노출
//   - 각 AxisScoreBar 안의 "심층 분석 보기" 토글은 별개 (그대로 동작)
//
// 톤: 봉투 안이라 에디토리얼 자유. 단 컨트롤은 운영 톤(작은 chevron + 라벨).

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AxisScoreBar } from "./AxisScoreBar";
import type { AxisScore, Criterion } from "@/lib/fastlane/types";

interface Props {
  criteria: Criterion[];
  axes: AxisScore[];
  axisReports: Record<string, { markdown: string; generatedAt?: string }>;
  /** 기본 펼침 상태 override. 기본 true — 첫 진입 시 점수 한눈에 보임. */
  defaultOpen?: boolean;
}

export function CollapsibleAxisGrid({
  criteria,
  axes,
  axisReports,
  defaultOpen = true,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const reviewCount = axes.filter((a) => a.needsReview).length;
  const items = criteria.filter((c) =>
    axes.some((a) => a.criterionId === c.id)
  );

  return (
    <section className="mb-10">
      {/* 토글 헤더 — 클릭으로 펼침/접힘 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between w-full pb-3 mb-0 group"
        style={{
          borderBottom: open
            ? "1px solid var(--t-border-subtle)"
            : "1px solid transparent",
        }}
      >
        <div className="text-left">
          <h2
            className="flex items-baseline gap-2"
            style={{
              fontWeight: 700,
              fontSize: "1.125rem",
              lineHeight: 1.4,
              color: "var(--text-primary)",
              letterSpacing: "-0.005em",
            }}
          >
            항목별 평가
            <span
              className="text-[12px] font-normal"
              style={{ color: "var(--text-tertiary)" }}
            >
              {items.length}개 항목
              {reviewCount > 0 && (
                <>
                  {" · "}
                  <span
                    style={{
                      color: "var(--signal-attention)",
                      fontWeight: 500,
                    }}
                  >
                    검토 권고 {reviewCount}개
                  </span>
                </>
              )}
            </span>
          </h2>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[12px] font-medium shrink-0 pl-4"
          style={{ color: "var(--accent)" }}
        >
          {open ? "접기" : "펼치기"}
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              color: "var(--accent)",
            }}
            strokeWidth={2.2}
          />
        </span>
      </button>

      {/* 펼침 본문 — 기존 항목별 평가 그대로 */}
      {open && (
        <div className="pt-3">
          <p
            className="text-[12px] mb-4"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
          >
            3-Pass (Draft → Skeptic → Judge) · 편차 = 세 agent 점수의 흔들림
            (표준편차 σ). 임계값 초과 시 검토 권고.
          </p>
          <div
            className="border-t"
            style={{ borderColor: "var(--t-border-subtle)" }}
          >
            {items.map((c) => {
              const axis = axes.find((a) => a.criterionId === c.id);
              if (!axis) return null;
              return (
                <div
                  key={c.id}
                  className="border-b"
                  style={{ borderColor: "var(--t-border-subtle)" }}
                >
                  <AxisScoreBar
                    axis={axis}
                    criterionName={c.name}
                    weight={c.weight}
                    axisMarkdown={axisReports[c.id]?.markdown}
                  />
                  <p
                    className="pb-3.5 -mt-2 text-[12px] leading-[1.65]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    채점 기준: {c.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
