"use client";

// 일괄 동의 — 본인이 심사위원으로 등록된 대회에서, 분쟁 axis 가 0개인 출품
// 전부에 한 번에 AI 점수 동의 + 제출 처리.
//
// 2026-05-21 도입: 출품마다 상세로 들어가서 개별 동의 누르는 부담을 한 번에.
// "분쟁 없는 출품은 다 자동 통과" 라는 우리 핵심 명제(AI 가 필터, 사람은 분쟁만)
// 의 마지막 마찰을 제거.
//
// 동작:
//   1) 버튼 클릭 → 확인 다이얼로그
//   2) 각 proposalId 에 POST /api/.../reviews 병렬 호출
//      body: { axes: [모든 criterion 에 acceptedAiScore=true], status: "submitted" }
//   3) 결과 카운트 토스트 + router.refresh()
//
// 안전:
//   - 서버에서 이미 본인 review 가 있는 출품은 props 단계에서 제외됨 (page.tsx 의 bulkAcceptIds)
//   - 분쟁 axis 0개도 props 단계에서 보장됨
//   - 그래도 API 가 본인 judge 자격을 다시 확인하므로 우회 불가

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Props {
  competitionId: string;
  /** 일괄 동의 대상 proposal id 들 (server 에서 분쟁 0개 + 미평가 + 평가 완료 필터됨). */
  proposalIds: string[];
  /** 이 대회의 모든 criterion id — 각 axis 에 acceptedAiScore=true 로 박기 위함. */
  criterionIds: string[];
}

export function BulkAcceptAction({
  competitionId,
  proposalIds,
  criterionIds,
}: Props) {
  const router = useRouter();
  const { show: toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (proposalIds.length === 0) return null;

  async function handleClick() {
    if (busy) return;
    const ok = confirm(
      `분쟁 항목이 없는 출품 ${proposalIds.length}건에 모두 AI 점수에 동의하고 일괄 제출합니다.\n\n계속할까요? (실행 후 개별 출품에서 점수 수정은 가능합니다)`
    );
    if (!ok) return;

    setBusy(true);

    // axes 본문 — 모든 criterion 에 acceptedAiScore=true.
    const axes = criterionIds.map((cid) => ({
      criterionId: cid,
      acceptedAiScore: true,
    }));

    const results = await Promise.all(
      proposalIds.map(async (pid): Promise<{ ok: boolean; error?: string }> => {
        try {
          const res = await fetch(
            `/api/competitions/${competitionId}/proposals/${pid}/reviews`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ axes, status: "submitted" }),
            }
          );
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
          }
          return { ok: true };
        } catch (err) {
          console.error("bulk accept POST failed", err);
          return { ok: false, error: "네트워크 오류" };
        }
      })
    );

    const success = results.filter((r) => r.ok).length;
    const failed = results.length - success;
    setBusy(false);

    if (failed === 0) {
      toast({
        message: `${success}건 일괄 동의 제출 완료.`,
        tone: "success",
      });
    } else if (success === 0) {
      toast({
        message: `일괄 동의 실패 (${failed}건). 권한·네트워크를 확인해주세요.`,
        tone: "danger",
      });
    } else {
      toast({
        message: `${success}건 제출 · ${failed}건 실패. 실패한 출품은 개별 처리 필요합니다.`,
        tone: "danger",
      });
    }

    router.refresh();
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
        <Check
          className="w-3.5 h-3.5 mt-0.5 shrink-0"
          style={{ color: "var(--accent)" }}
          strokeWidth={2.4}
        />
        <p
          className="text-[12.5px] leading-[1.6]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          분쟁 항목이 없는 미평가 출품{" "}
          <strong style={{ color: "var(--accent)" }}>{proposalIds.length}건</strong>
          이 있습니다. 한 번에 모두 동의 처리할 수 있습니다.
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
            처리 중…
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
            모두 동의하고 제출 ({proposalIds.length}건)
          </>
        )}
      </button>
    </div>
  );
}
