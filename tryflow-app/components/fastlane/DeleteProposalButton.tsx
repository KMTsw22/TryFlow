"use client";

// 출품 삭제 — organizer 본인만 노출되는 작은 위험 액션.
// confirm() 으로 마지막 게이트 두고, 성공 시 대회 상세로 이동.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function DeleteProposalButton({
  competitionId,
  proposalId,
  proposalTitle,
}: {
  competitionId: string;
  proposalId: string;
  proposalTitle: string;
}) {
  const router = useRouter();
  const { show: toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    const ok = confirm(
      `정말 이 출품을 삭제하시겠습니까?\n\n"${proposalTitle}"\n\n` +
        "삭제 시 출품과 함께 AI 평가·심사위원 평가·분쟁 결정 기록이 모두 사라집니다. 되돌릴 수 없습니다."
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/proposals/${proposalId}`,
        { method: "DELETE" }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast({
          message: data.error ?? "삭제에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      toast({ message: "출품을 삭제했습니다.", tone: "success" });
      router.push(`/competitions/${competitionId}`);
      router.refresh();
    } catch (err) {
      console.error("delete proposal failed", err);
      toast({ message: "네트워크 오류가 발생했습니다.", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title="이 출품을 삭제합니다 (organizer 전용)."
      className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-60 shrink-0"
      style={{
        border: "1px solid var(--t-border-subtle)",
        color: "var(--signal-danger)",
        background: "transparent",
        borderRadius: 2,
      }}
    >
      {busy ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          삭제 중…
        </>
      ) : (
        <>
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
          출품 삭제
        </>
      )}
    </button>
  );
}
