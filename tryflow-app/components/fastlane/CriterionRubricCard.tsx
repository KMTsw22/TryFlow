"use client";

// 대회 detail 페이지에서 항목별 평가 rubric 을 펼쳐볼 수 있는 카드.
// rubric_md 가 있으면 펼침 가능, 없으면 "(생성 전)" 상태 표시.

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Hourglass } from "lucide-react";
import { MarkdownReport } from "./MarkdownReport";
import type { Criterion } from "@/lib/fastlane/types";

const ACCENT_CYCLE = [
  "#6366f1",
  "#0891b2",
  "#059669",
  "#d97706",
  "#be123c",
  "#7c3aed",
  "#0284c7",
  "#65a30d",
];

export function CriterionRubricCard({
  criterion,
  index,
}: {
  criterion: Criterion;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const accent = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
  const hasRubric = !!criterion.rubricMd && criterion.rubricMd.trim().length > 0;

  return (
    <div
      className="relative"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border-subtle)",
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accent }}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasRubric}
        className="w-full text-left flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[color:var(--accent-soft)] disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span
          className="text-[10.5px] font-bold tabular-nums shrink-0 mt-1"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3
              className="text-[15px] font-bold"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.005em" }}
            >
              {criterion.name}
            </h3>
            <span
              className="text-[11px] font-bold uppercase tabular-nums"
              style={{ color: accent, letterSpacing: "0.12em" }}
            >
              {Math.round(criterion.weight * 100)}%
            </span>
            {hasRubric ? (
              <span
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase"
                style={{ color: "var(--signal-success)", letterSpacing: "0.12em" }}
              >
                <FileText className="w-3 h-3" />
                rubric 준비됨
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.12em" }}
              >
                <Hourglass className="w-3 h-3" />
                rubric 미생성
              </span>
            )}
          </div>
          {criterion.description && (
            <p
              className="mt-1 text-[12.5px] leading-[1.65]"
              style={{ color: "var(--text-secondary)" }}
            >
              {criterion.description}
            </p>
          )}
        </div>
        {hasRubric && (
          <span className="shrink-0 mt-1" style={{ color: "var(--text-tertiary)" }}>
            {open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
      </button>
      {open && hasRubric && (
        <div
          className="px-5 pb-6 pt-2 border-t"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <MarkdownReport source={criterion.rubricMd!} />
        </div>
      )}
    </div>
  );
}
