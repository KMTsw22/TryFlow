"use client";

// 출품 상세 헤더의 "수정" 버튼 + 모달 trigger. organizer 만 보이게 부모에서 분기.

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditProposalModal } from "./EditProposalModal";

export function EditProposalButton({
  competitionId,
  proposalId,
  initial,
}: {
  competitionId: string;
  proposalId: string;
  initial: { title: string; team: string; summary: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="이 출품 정보를 수정합니다 (organizer 전용)."
        className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-2)] shrink-0"
        style={{
          border: "1px solid var(--t-border-subtle)",
          color: "var(--text-secondary)",
          background: "transparent",
          borderRadius: 2,
        }}
      >
        <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
        수정
      </button>
      <EditProposalModal
        open={open}
        onClose={() => setOpen(false)}
        competitionId={competitionId}
        proposalId={proposalId}
        initial={initial}
      />
    </>
  );
}
