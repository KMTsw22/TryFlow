"use client";

import { useAnalysis } from "./AnalysisContext";
import { AnalysisLoadingScreen } from "./AnalysisLoadingScreen";

/**
 * ReportShell — gates the report layout on AI analysis status.
 *
 * 2026-04 교수님 피드백:
 *   "지금은 로딩하는 과정에서 분석된 페이지 형식이 보이는데
 *    그 형식이 아예 안보이고 아이디어 분석 중인 그 내용만 보여야한다"
 *
 * Behavior:
 *   - status === "ready"  → render children (full report layout)
 *   - status === "pending"→ render ONLY AnalysisLoadingScreen (full bleed,
 *                            blocks the underlying report skeleton entirely)
 *   - status === "failed" → render AnalysisLoadingScreen in failed mode with
 *                            retry CTA. (Doesn't fall back to bare report.)
 *
 * The provider must wrap this component for it to read status.
 */
interface Props {
  /** Submitted timestamp string for the loading screen header. */
  submittedDate?: string;
  /** Where the back link points from the loading screen. */
  backHref?: string;
  /** Idea ID — enables "Edit my submission" deep link in failure state. */
  ideaId?: string;
  /** The full report layout — only rendered when AI analysis is ready. */
  children: React.ReactNode;
}

export function ReportShell({ submittedDate, backHref, ideaId, children }: Props) {
  const { status } = useAnalysis();

  if (status === "ready") return <>{children}</>;

  // pending or failed → full-bleed loading takeover, report layout never mounts
  return (
    <AnalysisLoadingScreen
      submittedDate={submittedDate}
      backHref={backHref}
      ideaId={ideaId}
    />
  );
}
