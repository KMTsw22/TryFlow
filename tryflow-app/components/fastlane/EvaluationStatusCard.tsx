"use client";

// 제안서 페이지에서 score 가 아직 없을 때 표시하는 상태 카드.
// pending/running 인 경우 자동으로 router.refresh() 폴링해서 평가 결과가
// 들어오면 부드럽게 score Hero 로 전환된다.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Clock } from "lucide-react";

type Status = "pending" | "running" | "done" | "failed";

const POLL_MS = 4000;

export function EvaluationStatusCard({
  status,
  error,
}: {
  status: Status;
  error: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (status === "done" || status === "failed") return;
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [status, router]);

  if (status === "failed") {
    return (
      <section
        className="mb-14 px-6 py-5 flex items-start gap-4"
        style={{
          background: "var(--signal-danger-soft, color-mix(in srgb, var(--signal-danger) 8%, transparent))",
          border: "1px solid color-mix(in srgb, var(--signal-danger) 30%, transparent)",
        }}
      >
        <AlertTriangle
          className="w-5 h-5 mt-0.5 shrink-0"
          style={{ color: "var(--signal-danger)" }}
          strokeWidth={2.2}
        />
        <div>
          <p
            className="text-[10.5px] font-bold uppercase mb-1.5"
            style={{ color: "var(--signal-danger)", letterSpacing: "0.16em" }}
          >
            평가 실패
          </p>
          <p
            className="text-[14px] mb-1"
            style={{ color: "var(--text-primary)", fontWeight: 600 }}
          >
            AI 채점 중 오류가 발생했습니다.
          </p>
          {error && (
            <p
              className="text-[12.5px] leading-[1.6] mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {error}
            </p>
          )}
        </div>
      </section>
    );
  }

  // pending / running.
  const Icon = status === "running" ? Loader2 : Clock;
  return (
    <section
      className="mb-14 px-6 py-5 flex items-start gap-4"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-ring)",
      }}
    >
      <Icon
        className={`w-5 h-5 mt-0.5 shrink-0 ${status === "running" ? "animate-spin" : ""}`}
        style={{ color: "var(--accent)" }}
        strokeWidth={2.2}
      />
      <div>
        <p
          className="text-[10.5px] font-bold uppercase mb-1.5"
          style={{ color: "var(--accent)", letterSpacing: "0.16em" }}
        >
          {status === "running" ? "AI 평가 진행 중" : "평가 대기 중"}
        </p>
        <p
          className="text-[14px] mb-1"
          style={{ color: "var(--text-primary)", fontWeight: 600 }}
        >
          항목별 Draft → Skeptic → Judge 3-Pass 검증 중입니다. 잠시 후 결과가 표시됩니다.
        </p>
        <p
          className="text-[12px] leading-[1.6] mt-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          이 페이지는 자동으로 갱신됩니다.
        </p>
      </div>
    </section>
  );
}
