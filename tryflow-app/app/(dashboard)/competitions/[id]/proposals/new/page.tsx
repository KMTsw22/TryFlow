"use client";

// 제안서 제출 폼.
//
// 디자인:
//   - 새 대회 폼과 톤 통일 — sectioned, borderless input + accent underline.
//   - 익명 제출 허용 (로그인 없어도 됨). 로그인 사용자는 자동으로 submitter_id 채움.
//   - 제출 후 곧바로 제안서 detail 페이지로 이동 → AI 평가가 백그라운드에서 진행.

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

const SUMMARY_MAX = 5000;
const SUMMARY_MIN = 30;

export default function NewProposalPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const competitionId = params.id;
  const { show: toast } = useToast();

  const [title, setTitle] = useState("");
  const [team, setTeam] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!title.trim()) return toast({ message: "제안서 제목을 입력해주세요.", tone: "danger" });
    if (summary.trim().length < SUMMARY_MIN) {
      return toast({
        message: `요약은 최소 ${SUMMARY_MIN}자 이상이어야 합니다.`,
        tone: "danger",
      });
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          team: team.trim(),
          summary: summary.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          message: data?.error ?? "제출에 실패했습니다.",
          tone: "danger",
        });
        return;
      }
      toast({ message: "제출되었습니다. AI 평가가 시작됩니다.", tone: "success" });
      const newId = data?.proposal?.id;
      router.push(
        newId
          ? `/competitions/${competitionId}/proposals/${newId}`
          : `/competitions/${competitionId}`
      );
      router.refresh();
    } catch (err) {
      console.error("submit proposal", err);
      toast({ message: "네트워크 오류가 발생했습니다.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  const summaryRemaining = SUMMARY_MAX - summary.length;
  const summaryShort = summary.trim().length > 0 && summary.trim().length < SUMMARY_MIN;

  return (
    <div className="max-w-3xl mx-auto px-8 pt-10 pb-24">
      <Link
        href={`/competitions/${competitionId}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium mb-10 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        대회로 돌아가기
      </Link>

      <h1
        style={{
          fontWeight: 700,
          fontSize: "1.625rem",
          lineHeight: 1.3,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        출품 제출
      </h1>
      <p
        className="mt-1 text-[12.5px]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
      >
        AI 1차 평가 대상
      </p>
      <p
        className="text-[13.5px] leading-[1.8] mt-4 mb-12 max-w-xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        주최 측이 정의한 평가 항목 (rubric) 에 따라 AI 가 항목별 Draft → Skeptic →
        Judge 3-Pass 검증으로 채점합니다. 제목·팀명·본문 텍스트를 기반으로 평가하니
        작품의 핵심 가치와 차별점이 명확하게 드러나도록 작성해주세요.
      </p>

      <form onSubmit={handleSubmit} className="space-y-12">
        <Section step="01" title="출품 정보">
          <div className="space-y-6">
            <Field label="제목" required>
              <BareInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="작품 / 프로젝트 / 제안 제목"
                maxLength={200}
              />
            </Field>
            <Field label="팀명 / 출품자" hint="선택">
              <BareInput
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="팀명 또는 개인 출품자명"
                maxLength={100}
              />
            </Field>
          </div>
        </Section>

        <Section
          step="02"
          title="본문 / 요약"
          subtitle={`${summary.trim().length}/${SUMMARY_MAX}자 · 최소 ${SUMMARY_MIN}자`}
        >
          <p
            className="text-[12.5px] leading-[1.7] mb-4 max-w-xl"
            style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
          >
            출품작의 핵심 내용을 채점이 가능하도록 작성하세요. AI는 이 텍스트를 그대로
            rubric에 적용해 평가합니다. 분야에 따라 형식이 다릅니다 — 창업이면 문제·해결·시장,
            글쓰기면 본문 전체, 디자인·미술이면 작품 설명·의도·매체 설명.
          </p>
          <textarea
            value={summary}
            onChange={(e) => {
              const next = e.target.value;
              if (next.length > SUMMARY_MAX) return;
              setSummary(next);
            }}
            rows={10}
            placeholder="제안서 내용을 입력하세요…"
            className="w-full px-3 py-3 text-[14px] leading-[1.75] outline-none border resize-y bg-transparent transition-colors focus:border-[color:var(--accent)]"
            style={{
              borderColor: "var(--t-border-subtle)",
              color: "var(--text-primary)",
              fontFamily: SERIF,
              minHeight: 220,
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <p
              className="text-[11.5px]"
              style={{
                color: summaryShort ? "var(--signal-danger)" : "var(--text-tertiary)",
                letterSpacing: "0.02em",
              }}
            >
              {summaryShort
                ? `최소 ${SUMMARY_MIN}자가 필요합니다.`
                : "한 단락이면 충분합니다."}
            </p>
            <p
              className="text-[11px] tabular-nums"
              style={{
                color: summaryRemaining < 200 ? "var(--signal-warning)" : "var(--text-tertiary)",
                letterSpacing: "0.02em",
              }}
            >
              남은 글자 {summaryRemaining}
            </p>
          </div>
        </Section>

        <div
          className="flex items-center justify-between gap-3 pt-8 border-t"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <p
            className="inline-flex items-center gap-2 text-[12.5px]"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={2} />
            제출 직후 AI 평가가 자동으로 시작됩니다.
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`/competitions/${competitionId}`}
              className="px-5 h-11 inline-flex items-center text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--text-secondary)", letterSpacing: "0.04em" }}
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-7 h-11 inline-flex items-center gap-2 text-[13.5px] font-bold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "var(--accent)",
                color: "#fff",
                letterSpacing: "0.04em",
              }}
            >
              {submitting ? "제출 중…" : "제출 후 평가 시작"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div
        className="flex items-end justify-between mb-6 pb-3 border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <div>
          <p
            className="text-[10.5px] font-bold uppercase mb-1.5"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.16em" }}
          >
            {step}
          </p>
          <h2
            style={{
              fontWeight: 700,
              fontSize: "1.125rem",
              lineHeight: 1.4,
              color: "var(--text-primary)",
              letterSpacing: "-0.005em",
            }}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p
            className="text-[12px] tabular-nums"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="flex items-baseline gap-1.5 text-[12px] font-bold uppercase mb-2"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
      >
        {label}
        {required && <span style={{ color: "var(--signal-danger)" }}>*</span>}
        {hint && (
          <span
            className="font-medium"
            style={{
              color: "var(--text-tertiary)",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            ({hint})
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function BareInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      {...props}
      className="w-full bg-transparent outline-none border-b py-2.5 text-[15px] transition-colors focus:border-b-[color:var(--accent)]"
      style={{
        color: "var(--text-primary)",
        borderColor: "var(--t-border-subtle)",
      }}
    />
  );
}
