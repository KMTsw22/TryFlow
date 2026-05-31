"use client";

// 대기 평가 재개 — organizer 가 아직 AI 평가가 안 된 출품을 서버에서 한 번에
// 처리하도록 트리거. 제출 시 트리거 유실/레이트리밋으로 멈춘 출품을 복구하는 용도.
//
// /evaluate-pending 는 동시성 제한 큐로 처리하고 remaining(남은 개수)을 리턴한다.
// remaining 이 0 이 될 때까지(또는 최대 N회) 재호출해 전부 평가되게 한다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  competitionId: string;
  /** 아직 평가되지 않은(점수 없음·failed 아님) 출품 수. 0 이면 렌더 안 함. */
  pendingCount: number;
}

export function EvaluatePendingButton({ competitionId, pendingCount }: Props) {
  const router = useRouter();
  const { show: toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (pendingCount <= 0) return null;

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      let lastDone = 0;
      let lastFailed = 0;
      for (let attempt = 0; attempt < 8; attempt++) {
        const res = await fetch(
          `/api/competitions/${competitionId}/evaluate-pending`,
          { method: "POST" }
        );
        const data = (await res.json().catch(() => ({}))) as {
          done?: number;
          failed?: number;
          remaining?: number;
          error?: string;
        };
        if (!res.ok) {
          toast({
            message: data.error ?? "평가 처리 중 오류가 발생했습니다.",
            tone: "danger",
          });
          return;
        }
        lastDone += data.done ?? 0;
        lastFailed += data.failed ?? 0;
        if (!data.remaining || data.remaining <= 0) break;
      }
      toast({
        message:
          lastFailed > 0
            ? `평가 완료 ${lastDone}건 · 실패 ${lastFailed}건. 실패분은 다시 시도할 수 있습니다.`
            : `평가 완료 ${lastDone}건.`,
        tone: lastFailed > 0 ? "danger" : "success",
      });
      router.refresh();
    } catch (err) {
      console.error("evaluate-pending failed", err);
      toast({ message: "네트워크 오류가 발생했습니다.", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 mb-4 flex-wrap"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-ring)",
        borderRadius: 2,
      }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Sparkles
          className="w-3.5 h-3.5 mt-0.5 shrink-0"
          style={{ color: "var(--accent)" }}
          strokeWidth={2.4}
        />
        <p
          className="text-[12px] leading-[1.6]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          아직 AI 평가가 끝나지 않은 출품{" "}
          <strong style={{ color: "var(--accent)" }}>{pendingCount}건</strong>이
          있습니다. 서버에서 한 번에 평가합니다.
        </p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium text-white shrink-0 transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "var(--accent)", borderRadius: 2 }}
      >
        {busy ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            평가 중…
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.4} />
            대기 {pendingCount}건 평가
          </>
        )}
      </button>
    </div>
  );
}
