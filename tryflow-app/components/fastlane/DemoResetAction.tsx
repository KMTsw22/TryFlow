"use client";

// 데모/시연 리셋 — organizer 가 인간 심사 흔적을 모두 지우고
// "AI 1차 평가 완료" 상태로 되돌릴 수 있게.
//
// 버튼 색은 의도적으로 약하게(회색 outline) 두어 운영용 액션과 시각 분리.
// 데모 페이지인 점도 라벨에서 명확히.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function DemoResetAction({ competitionId }: { competitionId: string }) {
  const router = useRouter();
  const { show: toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    const ok = confirm(
      "이 대회의 심사위원 평가·분쟁 결정·검토 종료 기록을 모두 지우고\n" +
        "'AI 1차 평가 완료' 상태로 되돌립니다.\n\n" +
        "출품과 AI 점수는 그대로 유지됩니다. 계속할까요?"
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/competitions/${competitionId}/reset-review`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        proposalsCount?: number;
      };
      if (!res.ok) {
        toast({
          message: data?.error ?? "리셋에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      toast({
        message: `복원 완료. AI 1차 평가 단계로 돌아왔습니다.`,
        tone: "success",
      });
      router.refresh();
    } catch (err) {
      console.error("reset review failed", err);
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
      title="데모용: AI 1차 평가까지만 끝난 상태로 되돌림"
      className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-60"
      style={{
        border: "1px dashed var(--t-input-border)",
        color: "var(--text-tertiary)",
        background: "transparent",
        borderRadius: 2,
      }}
    >
      {busy ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          되돌리는 중…
        </>
      ) : (
        <>
          <RotateCcw className="w-3 h-3" strokeWidth={2.2} />
          데모: AI 1차 상태로 되돌리기
        </>
      )}
    </button>
  );
}
