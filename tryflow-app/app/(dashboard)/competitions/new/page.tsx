"use client";

// 평가 기준 입력 폼.
//
// 디자인 결정 (2026-05 senior pass):
//   - 좌측 100% 가중치 합계 막대 (가로) — 색상 segment 가 라이브로 합쳐짐.
//     사용자가 가중치를 조정하면 segment 너비가 즉시 반영. 시각적 피드백.
//   - 항목 카드: 큰 체크박스/번호 대신 좌측 vertical accent line 으로 모던하게.
//   - 입력 필드는 borderless. focus 시 아래에 accent 라인.
//   - "100% 가 맞춰졌습니다" 검증 카드는 단순한 inline statusline 으로.

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
} from "lucide-react";
import { BUILTIN_TEMPLATE } from "@/lib/fastlane/mock";
import type { Criterion } from "@/lib/fastlane/types";
import { useToast } from "@/components/ui/Toast";

// 기본 마감일 = 오늘 + 30일. <input type="date"> 가 받는 YYYY-MM-DD 포맷.
function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

// 카드 좌측 vertical accent line 의 사이클 색상. 시각적으로 항목 구분.
const ACCENT_CYCLE = [
  "#6366f1", // indigo
  "#0891b2", // cyan
  "#059669", // emerald
  "#d97706", // amber
  "#be123c", // rose
  "#7c3aed", // violet
  "#0284c7", // sky
  "#65a30d", // lime
];

let criterionCount = 0;
function newCriterion(): Criterion {
  criterionCount += 1;
  return {
    id: `c${Date.now()}-${criterionCount}`,
    name: "",
    weight: 0,
    description: "",
  };
}

export default function NewCompetitionPage() {
  const router = useRouter();
  const { show: toast } = useToast();
  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [theme, setTheme] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [submitting, setSubmitting] = useState(false);
  // 일반 대회 (미술, 글쓰기, 과학, 창업, ...) 전부 지원하므로 기본값은 비어있음.
  // 창업 6축 preset 은 옆 버튼으로 명시적으로 불러와야 함.
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  const totalWeight = useMemo(
    () => criteria.reduce((s, c) => s + c.weight, 0),
    [criteria]
  );
  const totalPct = Math.round(totalWeight * 100);
  const weightOk = Math.abs(totalPct - 100) <= 1;

  function loadBuiltin() {
    setCriteria(BUILTIN_TEMPLATE.criteria.map((c) => ({ ...c })));
  }
  function clearAll() {
    setCriteria([]);
  }
  function addCriterion() {
    setCriteria((prev) => [...prev, newCriterion()]);
  }
  function removeCriterion(id: string) {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  }
  function updateCriterion(id: string, patch: Partial<Criterion>) {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function normalizeWeights() {
    if (criteria.length === 0) return;
    const equal = +(1 / criteria.length).toFixed(2);
    setCriteria((prev) => prev.map((c) => ({ ...c, weight: equal })));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim()) return toast({ message: "대회명을 입력해주세요.", tone: "danger" });
    if (criteria.length === 0)
      return toast({ message: "평가 항목을 1개 이상 추가해주세요.", tone: "danger" });
    if (!weightOk)
      return toast({
        message: `가중치 합이 100% 가 되어야 합니다. (현재 ${totalPct}%)`,
        tone: "danger",
      });
    if (criteria.some((c) => !c.name.trim()))
      return toast({ message: "모든 항목의 이름을 입력해주세요.", tone: "danger" });
    if (!theme.trim())
      return toast({
        message: "주제를 입력해주세요. AI rubric 생성에 사용됩니다.",
        tone: "danger",
      });
    if (!deadline) return toast({ message: "마감일을 선택해주세요.", tone: "danger" });

    setSubmitting(true);
    try {
      // <input type="date"> 는 시간이 비므로 그날 23:59:59 로 채워서 전송.
      const deadlineIso = new Date(`${deadline}T23:59:59`).toISOString();
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          organizer: organizer.trim(),
          theme: theme.trim(),
          deadline: deadlineIso,
          template: {
            id: `custom-${Date.now()}`,
            name: name.trim(),
            isBuiltin: false,
            criteria: criteria.map((c) => ({
              ...c,
              name: c.name.trim(),
              description: c.description.trim(),
            })),
          },
        }),
      });

      if (res.status === 401) {
        toast({ message: "로그인이 필요합니다.", tone: "danger" });
        router.push("/login");
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          message: data?.error ?? "대회 생성에 실패했습니다.",
          tone: "danger",
        });
        return;
      }

      toast({ message: "대회가 생성되었습니다.", tone: "success" });
      const newId = data?.competition?.id;
      router.push(newId ? `/competitions/${newId}` : "/competitions");
      router.refresh();
    } catch (err) {
      console.error("create competition", err);
      toast({ message: "네트워크 오류가 발생했습니다.", tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-8 pt-10 pb-24">
      <Link
        href="/competitions"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium mb-10 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        대회 목록
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
        새 대회
      </h1>
      <p
        className="mt-1 text-[12.5px]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
      >
        평가표 정의
      </p>
      <p
        className="text-[13.5px] leading-[1.8] mt-4 mb-12 max-w-xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        대회를 만들면 입력한 주제와 평가 항목으로부터 AI가 항목별 채점 rubric
        (도메인 지식 + 점수 가이드 + calibration anchors) 을 자동 생성해
        DB에 저장합니다. 이후 모든 제안서는 이 동일한 rubric으로 채점되어
        일관성이 보장됩니다.
      </p>

      <form onSubmit={handleSave} className="space-y-14">
        {/* 01 — 대회 정보 */}
        <Section step="01" title="대회 정보">
          <FieldStack>
            <Field label="대회명" required>
              <BareInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 2026 모두의 창업경진대회"
              />
            </Field>
            <Field label="주최 기관" hint="선택">
              <BareInput
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="예: 중소벤처기업부 · 창업진흥원"
              />
            </Field>
            <Field
              label="주제 / 도메인"
              required
              hint="rubric 자동 생성에 사용"
            >
              <BareInput
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="예: 환경 사진 공모전, 청소년 단편소설, 고등 화학 경진대회, 핀테크 SaaS"
              />
              <p
                className="mt-2 text-[11.5px] leading-[1.65]"
                style={{ color: "var(--text-tertiary)" }}
              >
                창업·미술·사진·글쓰기·과학·디자인·해커톤 등 어떤 분야든 OK. 구체적일수록
                도메인 특화된 rubric이 생성됩니다 — "헬스케어" 보다는 "헬스케어 - 만성질환
                환자 모니터링", "그림" 보다는 "수채화 풍경 공모전 - 도시" 처럼.
              </p>
            </Field>
            <Field label="제출 마감" required>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full bg-transparent outline-none border-b py-2.5 text-[15px] tabular-nums transition-colors focus:border-b-[color:var(--accent)]"
                style={{
                  color: "var(--text-primary)",
                  borderColor: "var(--t-border-subtle)",
                  colorScheme: "light dark",
                }}
              />
            </Field>
          </FieldStack>
        </Section>

        {/* 02 — 평가 항목 */}
        <Section
          step="02"
          title={`평가 항목`}
          subtitle={`${criteria.length}개 항목 · 가중치 합 ${totalPct}%`}
        >
          {/* 라이브 가중치 막대 — segment 들이 합쳐져 100% 를 채운다 */}
          <WeightBalanceBar criteria={criteria} totalPct={totalPct} weightOk={weightOk} />

          {/* 액션 row */}
          <div className="flex items-center flex-wrap gap-2 mt-4 mb-4">
            <button
              type="button"
              onClick={loadBuiltin}
              className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold transition-colors"
              style={{
                color: "var(--accent)",
                background: "var(--accent-soft)",
                letterSpacing: "0.04em",
              }}
              title="시장성·문제 절박성·제품 우수성·차별화·수익 모델·시장 타이밍"
            >
              <Sparkles className="w-3 h-3" />
              창업 6축 예시 불러오기
            </button>
            <button
              type="button"
              onClick={normalizeWeights}
              disabled={criteria.length === 0}
              className="px-3 h-8 text-[12px] font-medium transition-colors disabled:opacity-40"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--t-border-subtle)",
                letterSpacing: "0.04em",
              }}
            >
              가중치 균등화
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={criteria.length === 0}
              className="px-3 h-8 text-[12px] font-medium transition-opacity hover:opacity-70 disabled:opacity-30"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
            >
              전체 비우기
            </button>
          </div>

          {/* 항목 카드들 */}
          <div className="space-y-2.5">
            {criteria.length === 0 && (
              <div
                className="text-center py-12"
                style={{
                  border: "1px dashed var(--t-border-subtle)",
                }}
              >
                <p
                  className="text-[14px] italic"
                  style={{ fontFamily: SERIF, color: "var(--text-tertiary)" }}
                >
                  아직 평가 항목이 없습니다.
                </p>
              </div>
            )}

            {criteria.map((c, i) => {
              const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
              return (
                <div
                  key={c.id}
                  className="relative pl-5 pr-3 py-4"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--t-border-subtle)",
                  }}
                >
                  {/* 좌측 vertical accent */}
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: accent }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_36px] gap-3 md:gap-5 items-start">
                    {/* 이름 + 설명 */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-[10.5px] font-bold tabular-nums"
                          style={{
                            color: "var(--text-tertiary)",
                            letterSpacing: "0.14em",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <BareInput
                          value={c.name}
                          onChange={(e) =>
                            updateCriterion(c.id, { name: e.target.value })
                          }
                          placeholder="항목명 (예: 독창성, 완성도, 표현력, 시장성)"
                          large
                        />
                      </div>
                      <textarea
                        value={c.description}
                        onChange={(e) =>
                          updateCriterion(c.id, { description: e.target.value })
                        }
                        placeholder="채점 기준 한 줄 설명. AI가 이 텍스트로 rubric을 자동 생성합니다."
                        rows={2}
                        className="w-full px-2 py-1.5 text-[13px] leading-[1.65] outline-none border-b resize-none bg-transparent transition-colors focus:border-b-[color:var(--accent)]"
                        style={{
                          borderColor: "var(--t-border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      />
                    </div>

                    {/* 가중치 */}
                    <div>
                      <p
                        className="text-[10.5px] font-bold uppercase mb-1.5"
                        style={{
                          color: "var(--text-tertiary)",
                          letterSpacing: "0.14em",
                        }}
                      >
                        가중치
                      </p>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(c.weight * 100)}
                          onChange={(e) =>
                            updateCriterion(c.id, {
                              weight:
                                Math.max(0, Math.min(100, +e.target.value)) / 100,
                            })
                          }
                          className="w-14 px-1 py-1 num-display tabular-nums text-right outline-none border-b transition-colors focus:border-b-[color:var(--accent)] bg-transparent"
                          style={{
                            fontWeight: 700,
                            fontSize: "1.4rem",
                            letterSpacing: "-0.02em",
                            color: "var(--text-primary)",
                            borderColor: "var(--t-border-subtle)",
                          }}
                        />
                        <span
                          className="text-[14px] font-medium"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          %
                        </span>
                      </div>
                    </div>

                    {/* 삭제 */}
                    <button
                      type="button"
                      onClick={() => removeCriterion(c.id)}
                      aria-label={`항목 ${i + 1} 삭제`}
                      className="self-start p-2 transition-colors hover:bg-[color:var(--t-border-subtle)]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addCriterion}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors hover:bg-[color:var(--accent-soft)]"
            style={{
              color: "var(--accent)",
              border: "1px dashed var(--accent-ring)",
              letterSpacing: "0.04em",
            }}
          >
            <Plus className="w-4 h-4" />
            항목 추가
          </button>
        </Section>

        {/* 액션 — 하단 sticky 톤 */}
        <div
          className="flex items-center justify-between gap-3 pt-8 border-t"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <WeightStatus weightOk={weightOk} totalPct={totalPct} />
          <div className="flex items-center gap-2">
            <Link
              href="/competitions"
              className="px-5 h-11 inline-flex items-center text-[13px] font-medium transition-opacity hover:opacity-70"
              style={{
                color: "var(--text-secondary)",
                letterSpacing: "0.04em",
              }}
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
              {submitting ? "저장 중…" : "대회 만들기"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

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
      <div className="flex items-end justify-between mb-6 pb-3 border-b" style={{ borderColor: "var(--t-border-subtle)" }}>
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

function FieldStack({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
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
      <label className="flex items-baseline gap-1.5 text-[12px] font-bold uppercase mb-2" style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}>
        {label}
        {required && <span style={{ color: "var(--signal-danger)" }}>*</span>}
        {hint && (
          <span
            className="font-medium"
            style={{ color: "var(--text-tertiary)", textTransform: "none", letterSpacing: 0 }}
          >
            ({hint})
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function BareInput({
  large = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { large?: boolean }) {
  return (
    <input
      type="text"
      {...props}
      className={`w-full bg-transparent outline-none border-b transition-colors focus:border-b-[color:var(--accent)] ${
        large ? "py-1.5 text-[15px] font-semibold" : "py-2.5 text-[15px]"
      }`}
      style={{
        color: "var(--text-primary)",
        borderColor: "var(--t-border-subtle)",
      }}
    />
  );
}

function WeightBalanceBar({
  criteria,
  totalPct,
  weightOk,
}: {
  criteria: Criterion[];
  totalPct: number;
  weightOk: boolean;
}) {
  // segment 너비는 weight 그대로. 100% 를 넘으면 트랙 끝까지만 표시 + overflow 표시.
  const overflow = Math.max(0, totalPct - 100);
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <p
          className="text-[10.5px] font-bold uppercase"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
        >
          가중치 합계
        </p>
        <p className="tabular-nums num-display" style={{ fontWeight: 800, fontSize: "1.5rem", color: weightOk ? "var(--signal-success)" : "var(--text-primary)", letterSpacing: "-0.02em" }}>
          {totalPct}%
        </p>
      </div>
      <div
        className="relative h-2.5 overflow-hidden"
        style={{ background: "var(--t-border-subtle)" }}
      >
        {criteria.reduce<{ left: number; nodes: React.ReactNode[] }>(
          (acc, c, i) => {
            const w = Math.min(100 - acc.left, c.weight * 100);
            if (w <= 0) return acc;
            const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
            acc.nodes.push(
              <div
                key={c.id}
                className="absolute top-0 bottom-0"
                style={{
                  left: `${acc.left}%`,
                  width: `${w}%`,
                  background: accent,
                  opacity: 0.85,
                  borderRight:
                    i < criteria.length - 1
                      ? "1px solid var(--page-bg)"
                      : "none",
                  transition: "all 200ms ease",
                }}
                title={`${c.name || `항목 ${i + 1}`} · ${Math.round(c.weight * 100)}%`}
              />
            );
            acc.left += w;
            return acc;
          },
          { left: 0, nodes: [] }
        ).nodes}

        {overflow > 0 && (
          <div
            className="absolute top-0 bottom-0 right-0 flex items-center justify-end pr-1"
            style={{
              background:
                "repeating-linear-gradient(45deg, var(--signal-danger) 0 4px, transparent 4px 8px)",
              width: "12%",
              opacity: 0.55,
            }}
            title={`초과 ${overflow}%`}
          />
        )}
      </div>
    </div>
  );
}

function WeightStatus({
  weightOk,
  totalPct,
}: {
  weightOk: boolean;
  totalPct: number;
}) {
  if (weightOk) {
    return (
      <div className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--signal-success)" }}>
        <Check className="w-4 h-4" strokeWidth={2.4} />
        <span style={{ fontWeight: 600 }}>가중치 합 100% — 저장 가능합니다.</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--signal-danger)" }}>
      <AlertTriangle className="w-4 h-4" strokeWidth={2.2} />
      <span style={{ fontWeight: 600 }}>
        가중치 합 {totalPct}% — {totalPct > 100 ? `${totalPct - 100}% 초과` : `${100 - totalPct}% 부족`}
      </span>
    </div>
  );
}
