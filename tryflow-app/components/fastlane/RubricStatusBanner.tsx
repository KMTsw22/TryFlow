"use client";

// 대회 detail 페이지에서 rubric 자동 생성 상태를 표시하는 배너 + 폴링.
// 'generating' / 'pending' 상태에선 4초마다 router.refresh() 로 다시 fetch.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import type { RubricStatus } from "@/lib/fastlane/types";

const POLL_MS = 4000;

export function RubricStatusBanner({
  competitionId,
  status,
  error,
  isOwner,
  generatedCount,
  totalCount,
}: {
  competitionId: string;
  status: RubricStatus;
  error: string | null;
  isOwner: boolean;
  generatedCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (status !== "pending" && status !== "generating") return;
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [status, router]);

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    try {
      await fetch(`/api/competitions/${competitionId}/generate-rubrics`, {
        method: "POST",
      });
      router.refresh();
    } finally {
      setRetrying(false);
    }
  }

  if (status === "ready") {
    return (
      <div
        className="flex items-start gap-3 px-5 py-3.5 mb-8"
        style={{
          background: "color-mix(in srgb, var(--signal-success) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--signal-success) 30%, transparent)",
        }}
      >
        <Check
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color: "var(--signal-success)" }}
          strokeWidth={2.4}
        />
        <div className="flex-1">
          <p
            className="text-[12px] font-bold uppercase mb-0.5"
            style={{ color: "var(--signal-success)", letterSpacing: "0.14em" }}
          >
            평가 가이드 준비 완료
          </p>
          <p className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
            {totalCount}개 항목 모두 도메인 특화 채점 가이드가 생성되어 저장되었습니다. 이후
            모든 제안서는 동일한 잣대로 채점됩니다.
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-[11.5px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              color: "var(--text-tertiary)",
              border: "1px solid var(--t-border-subtle)",
              letterSpacing: "0.04em",
            }}
            title="채점 가이드 다시 생성"
          >
            <RotateCcw className="w-3 h-3" />
            재생성
          </button>
        )}
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div
        className="flex items-start gap-3 px-5 py-3.5 mb-8"
        style={{
          background: "color-mix(in srgb, var(--signal-danger) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--signal-danger) 30%, transparent)",
        }}
      >
        <AlertTriangle
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color: "var(--signal-danger)" }}
          strokeWidth={2.2}
        />
        <div className="flex-1">
          <p
            className="text-[12px] font-bold uppercase mb-0.5"
            style={{ color: "var(--signal-danger)", letterSpacing: "0.14em" }}
          >
            채점 가이드 생성 실패
          </p>
          <p className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
            {error ?? "일부 항목의 채점 가이드 생성에 실패했습니다."}
            {generatedCount > 0 &&
              ` ${generatedCount}/${totalCount}개 항목은 성공적으로 생성됨.`}
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              color: "#fff",
              background: "var(--signal-danger)",
              letterSpacing: "0.04em",
            }}
          >
            {retrying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3" />
            )}
            재시도
          </button>
        )}
      </div>
    );
  }

  // pending / generating — 진행 중.
  const Icon = status === "generating" ? Loader2 : Sparkles;
  return (
    <div
      className="flex items-start gap-3 px-5 py-3.5 mb-8"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-ring)",
      }}
    >
      <Icon
        className={`w-4 h-4 mt-0.5 shrink-0 ${status === "generating" ? "animate-spin" : ""}`}
        style={{ color: "var(--accent)" }}
        strokeWidth={2.2}
      />
      <div className="flex-1">
        <p
          className="text-[12px] font-bold uppercase mb-0.5"
          style={{ color: "var(--accent)", letterSpacing: "0.14em" }}
        >
          {status === "generating"
            ? "AI 채점 가이드 생성 중"
            : "채점 가이드 생성 대기 중"}
        </p>
        <p className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
          {totalCount}개 평가 항목에 대해 도메인 특화 채점 기준 (점수 가이드 +
          calibration anchors) 을 자동 작성하고 있습니다. 보통 30초 이내 완료됩니다.
          이 페이지는 자동으로 갱신됩니다.
        </p>
      </div>
    </div>
  );
}
