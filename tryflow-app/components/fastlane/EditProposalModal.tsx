"use client";

// 출품 수정 — organizer 가 title/team/summary 를 인-페이지 모달에서 편집.
// summary(content) 가 바뀌면 서버가 평가 결과를 비우고 자동 재평가를 트리거.
// 검토 종료된 출품은 API 가 거부.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const SUMMARY_MIN = 30;

interface Props {
  open: boolean;
  onClose: () => void;
  competitionId: string;
  proposalId: string;
  /** 기존 값 — 모달 prefill 용. */
  initial: { title: string; team: string; summary: string };
}

export function EditProposalModal({
  open,
  onClose,
  competitionId,
  proposalId,
  initial,
}: Props) {
  const router = useRouter();
  const { show: toast } = useToast();
  const [title, setTitle] = useState(initial.title);
  const [team, setTeam] = useState(initial.team);
  const [summary, setSummary] = useState(initial.summary);
  const [busy, setBusy] = useState(false);

  // open 될 때마다 폼을 initial 로 리셋 — 닫고 다시 열 때 stale value 방지.
  useEffect(() => {
    if (open) {
      setTitle(initial.title);
      setTeam(initial.team);
      setSummary(initial.summary);
    }
  }, [open, initial.title, initial.team, initial.summary]);

  // ESC 닫기.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const contentChanged = summary.trim() !== initial.summary.trim();
  const summaryInvalid = summary.trim().length < SUMMARY_MIN;
  const titleInvalid = title.trim().length === 0;
  const canSubmit = !busy && !titleInvalid && !summaryInvalid;

  async function handleSave() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/proposals/${proposalId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            team: team.trim(),
            summary: summary.trim(),
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reevaluating?: boolean;
      };
      if (!res.ok) {
        toast({
          message: data.error ?? "수정에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      toast({
        message: data.reevaluating
          ? "수정 완료. 내용이 바뀌어 AI 재평가가 시작됩니다."
          : "수정 완료.",
        tone: "success",
      });
      onClose();
      router.refresh();
    } catch (err) {
      console.error("edit proposal failed", err);
      toast({ message: "네트워크 오류가 발생했습니다.", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-proposal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
          <div>
            <p
              className="text-[11px] font-bold uppercase mb-1"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
            >
              출품 수정
            </p>
            <h2
              id="edit-proposal-title"
              style={{
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
              }}
            >
              {initial.title}
            </h2>
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

        {/* Body */}
        <div className="px-7 py-5 space-y-4">
          <div>
            <label
              className="block text-[11px] font-bold uppercase mb-2"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
            >
              제목 (필수)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 h-10 text-[14px] outline-none"
              style={{
                background: "var(--surface-2)",
                border: `1px solid ${
                  titleInvalid
                    ? "var(--signal-danger)"
                    : "var(--t-border-subtle)"
                }`,
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-bold uppercase mb-2"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
            >
              팀명
            </label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full px-3 h-10 text-[14px] outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--t-border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-bold uppercase mb-2"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
            >
              내용 / 요약 (최소 30자)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={10}
              className="w-full px-3 py-2.5 text-[13px] leading-[1.6] outline-none resize-y"
              style={{
                background: "var(--surface-2)",
                border: `1px solid ${
                  summaryInvalid
                    ? "var(--signal-danger)"
                    : "var(--t-border-subtle)"
                }`,
                color: "var(--text-primary)",
                wordBreak: "keep-all",
                minHeight: 200,
              }}
            />
            <p
              className="text-[11px] mt-1.5 tabular-nums"
              style={{
                color: summaryInvalid
                  ? "var(--signal-danger)"
                  : "var(--text-tertiary)",
              }}
            >
              {summary.trim().length} / {SUMMARY_MIN}+
            </p>
          </div>

          {/* 재평가 경고 — content 가 바뀌면 AI 점수가 비워지고 다시 매김. */}
          {contentChanged && (
            <div
              className="flex items-start gap-2.5 px-3.5 py-3 text-[12px]"
              style={{
                background: "var(--signal-attention-soft)",
                border: "1px solid var(--signal-attention-ring)",
                borderRadius: 2,
                color: "var(--text-secondary)",
                wordBreak: "keep-all",
              }}
            >
              <AlertTriangle
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--signal-attention)" }}
                strokeWidth={2.4}
              />
              <span>
                내용을 변경했습니다. 저장 시 기존 AI 점수·리포트가 초기화되고
                자동으로 재평가됩니다. 심사위원의 평가 기록은 유지됩니다.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-7 py-4"
          style={{ borderTop: "1px solid var(--t-border-subtle)" }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 h-9 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-60"
            style={{
              border: "1px solid var(--t-border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-5 h-9 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--accent)", letterSpacing: "0.01em" }}
          >
            {busy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                저장 중…
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" strokeWidth={2.2} />
                저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
