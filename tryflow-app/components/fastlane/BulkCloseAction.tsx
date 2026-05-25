"use client";

// 일괄 검토 종료 — organizer 가 모든 위원 제출이 끝난 출품들을 한 번에
// 검토 종료(reviewClosedAt) 처리. 출품마다 상세에 들어가 개별 종료 버튼 누르는
// 부담을 한 번에 해결.
//
// 대상은 server 에서 미리 추려 props 로 전달:
//   - organizer 본인
//   - 미종료(reviewClosedAt 없음)
//   - 분쟁 axis 0개 (분쟁 있는 출품은 운영자가 결정 후 개별 종료)
//   - 모든 배정 심사위원이 review submitted
//
// 모두 만족하는 출품에만 노출. 한 건도 없으면 컴포넌트 자체 안 보임.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  competitionId: string;
  /** server 에서 추려 넘긴 일괄 종료 대상 proposal id 들. */
  proposalIds: string[];
}

export function BulkCloseAction({ competitionId, proposalIds }: Props) {
  const router = useRouter();
  const { show: toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (proposalIds.length === 0) return null;

  async function handleClick() {
    if (busy) return;
    const ok = confirm(
      `심사가 완료된 출품 ${proposalIds.length}건을 일괄 검토 종료합니다.\n\n` +
        "종료된 출품은 점수 수정이 더는 반영되지 않습니다.\n" +
        "(필요 시 출품 상세에서 개별로 종료 취소 가능)"
    );
    if (!ok) return;

    setBusy(true);
    const results = await Promise.all(
      proposalIds.map(async (pid): Promise<{ ok: boolean }> => {
        try {
          const res = await fetch(
            `/api/competitions/${competitionId}/proposals/${pid}/close`,
            { method: "PATCH" }
          );
          return { ok: res.ok };
        } catch (err) {
          console.error("bulk close failed", err);
          return { ok: false };
        }
      })
    );
    const success = results.filter((r) => r.ok).length;
    const failed = results.length - success;
    setBusy(false);

    if (failed === 0) {
      toast({
        message: `${success}건 검토 종료 완료.`,
        tone: "success",
      });
    } else if (success === 0) {
      toast({
        message: `일괄 종료 실패 (${failed}건). 권한·네트워크를 확인해주세요.`,
        tone: "danger",
      });
    } else {
      toast({
        message: `${success}건 종료 · ${failed}건 실패.`,
        tone: "danger",
      });
    }
    router.refresh();
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 mb-4 flex-wrap"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--t-border)",
        borderRadius: 2,
      }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Lock
          className="w-3.5 h-3.5 mt-0.5 shrink-0"
          style={{ color: "var(--signal-success)" }}
          strokeWidth={2.4}
        />
        <p
          className="text-[12px] leading-[1.6]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          모든 심사위원의 평가가 끝난 출품{" "}
          <strong style={{ color: "var(--signal-success)" }}>
            {proposalIds.length}건
          </strong>
          이 있습니다. 한 번에 검토 종료할 수 있습니다.
        </p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3.5 h-9 text-[13px] font-medium text-white shrink-0 transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "var(--signal-success)", borderRadius: 2 }}
      >
        {busy ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            처리 중…
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" strokeWidth={2.4} />
            일괄 검토 종료 ({proposalIds.length}건)
          </>
        )}
      </button>
    </div>
  );
}
