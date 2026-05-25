// /about — 서비스 소개 페이지.
//
// 2026-05-21 신설: 이 페이지의 목적은 "마케팅" 이 아니라 "사내 결재 보조 도구".
//   행정 담당자가 윗선(부장·교수·기관장)에게 도입 검토를 요청할 때,
//   캡처·인용·붙여넣기를 할 수 있는 보고서 형태로 설계.
//
// 구조 (스코어러 플러스 about 패턴 + 우리 자리 보강):
//   1. 헤더 + 1줄 정의
//   2. 도입 사유 — "왜 지금 자동화가 필요한가" 한 줄 + 통계 3개
//   3. 6개 기능 카드
//   4. AS IS / TO BE 비교 표 (랜딩과 동일 — 보고서에 일관성)
//   5. 6단계 도입 흐름
//   6. 공정성 3장치 + 보강 계획
//   7. 가격 (시작가 표기, 정식 견적은 문의)
//   8. 도입 6단계 + CTA

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileText,
  Inbox,
  Scale,
  AlertTriangle,
  Trophy,
  ClipboardCheck,
} from "lucide-react";
import { Brand } from "@/components/layout/Brand";

export const metadata = {
  title: "서비스 소개 · Fastlane",
  description:
    "공모전·지원사업·경진대회 1차 심사 자동화 시스템. AI 1차 평가 + 분쟁 항목 인간 검토 + 진척 추적 매트릭스.",
};

export default function AboutPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}
    >
      <TopNav />

      <PageHeader />
      <Definition />
      <Features />
      <Comparison />
      <Workflow />
      <Fairness />
      <Pricing />
      <Closing />

      <Footer />
    </div>
  );
}

// ── TopNav (랜딩과 동일) ─────────────────────────────────────

function TopNav() {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(255,255,255,0.94)",
        borderBottom: "1px solid var(--t-border)",
        backdropFilter: "saturate(140%) blur(6px)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center justify-between">
        <Brand size="sm" />
        <nav className="flex items-center gap-6 text-[13px]">
          <Link
            href="/about"
            style={{ color: "var(--text-primary)", fontWeight: 500 }}
          >
            서비스 소개
          </Link>
          <Link href="/pricing" style={{ color: "var(--text-secondary)" }}>
            요금
          </Link>
          <Link href="/login" style={{ color: "var(--text-secondary)" }}>
            로그인
          </Link>
          <Link
            href="/competitions/new"
            className="inline-flex items-center gap-1.5 px-3 h-8 text-[12.5px] font-medium hover:brightness-110"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 2,
            }}
          >
            무료로 시작
            <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
          </Link>
        </nav>
      </div>
    </header>
  );
}

// ── 페이지 헤더 ──────────────────────────────────────────────

function PageHeader() {
  return (
    <section
      className="border-b"
      style={{ borderColor: "var(--t-border)", background: "var(--surface-1)" }}
    >
      <div className="max-w-[1400px] mx-auto px-10 pt-12 pb-8">
        <p
          className="text-[12px] mb-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          서비스 소개
        </p>
        <h1
          style={{
            fontWeight: 700,
            fontSize: "clamp(24px, 2.8vw, 30px)",
            lineHeight: 1.3,
            letterSpacing: "-0.012em",
            color: "var(--text-primary)",
            wordBreak: "keep-all",
          }}
        >
          1차 심사 자동화 운영 시스템
        </h1>
        <p
          className="text-[13.5px] leading-[1.7] mt-3 max-w-xl"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          공모전·지원사업·경진대회의 1차 평가를 AI가 맡고, 의견이 갈리는 항목만
          심사위원에게 넘깁니다.
        </p>
      </div>
    </section>
  );
}

// ── 정의 (Why now) ───────────────────────────────────────────

function Definition() {
  return (
    <section
      className="border-b"
      style={{ borderColor: "var(--t-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <SectionHeading kicker="도입 사유" title="병목 구조" />
        <div
          className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-px"
          style={{ background: "var(--t-border)" }}
        >
          <ProblemBox
            label="지원서"
            value="증가"
            note="대회당 수백~수천 건"
          />
          <ProblemBox
            label="심사위원"
            value="부족"
            note="섭외·일정 조율 제약"
          />
          <ProblemBox
            label="결과"
            value="형식적 통과"
            note="기준 편차 · 추적 불가"
            tone="attention"
          />
        </div>
      </div>
    </section>
  );
}

function ProblemBox({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "attention";
}) {
  const color =
    tone === "attention" ? "var(--signal-attention)" : "var(--text-primary)";
  return (
    <div className="px-5 py-4" style={{ background: "var(--surface-1)" }}>
      <p
        className="text-[11.5px] mb-1.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <p
        style={{
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: "-0.01em",
          color,
        }}
      >
        {value}
      </p>
      <p
        className="text-[11.5px] mt-1"
        style={{ color: "var(--text-tertiary)" }}
      >
        {note}
      </p>
    </div>
  );
}

function StatBox({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "attention";
}) {
  const color =
    tone === "accent"
      ? "var(--accent)"
      : tone === "attention"
      ? "var(--signal-attention)"
      : "var(--text-primary)";
  return (
    <div className="px-4 py-4" style={{ background: "var(--surface-1)" }}>
      <p
        className="text-[11px] mb-1.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <p
        className="text-[14px]"
        style={{ color, fontWeight: 600, letterSpacing: "-0.005em" }}
      >
        {value}
      </p>
    </div>
  );
}

// ── 6 기능 카드 ─────────────────────────────────────────────

function Features() {
  const items = [
    { icon: FileText, title: "채점 가이드 자동 생성", body: "주제·항목·가중치만 입력하면 끝" },
    { icon: Inbox, title: "지원서 접수", body: "PDF·링크 · 익명 평가 옵션" },
    { icon: Sparkles, title: "AI 1차 평가", body: "Draft·Skeptic·Judge 3단계 검증" },
    { icon: AlertTriangle, title: "분쟁 자동 감지", body: "의견 갈리는 항목만 사람에게" },
    { icon: Scale, title: "심사위원 검토", body: "매트릭스로 실시간 진척 확인" },
    { icon: Trophy, title: "결과 공개", body: "리더보드 + 결정 기록 보존" },
  ];

  return (
    <section
      className="border-b"
      style={{
        borderColor: "var(--t-border)",
        background: "var(--surface-1)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-12">
        <SectionHeading kicker="기능" title="6개 기능, 하나의 흐름" />
        <div
          className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px"
          style={{ background: "var(--t-border)" }}
        >
          {items.map((it, i) => (
            <div
              key={it.title}
              className="px-4 py-4"
              style={{ background: "var(--surface-1)" }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: "var(--accent)" }}
                >
                  0{i + 1}
                </span>
                <it.icon
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--text-tertiary)" }}
                  strokeWidth={2}
                />
              </div>
              <h3
                className="text-[13px] font-semibold mb-0.5"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.005em",
                }}
              >
                {it.title}
              </h3>
              <p
                className="text-[11.5px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AS IS / TO BE 비교 ───────────────────────────────────────

function Comparison() {
  const rows: Array<{
    dim: string;
    before: string;
    after: string;
  }> = [
    {
      dim: "1차 심사 방식",
      before: "심사위원이 모든 지원서를 직접 읽음",
      after: "AI가 같은 기준으로 자동 채점, 사람은 의견 갈리는 항목만 검토",
    },
    {
      dim: "채점 편차",
      before: "심사위원마다 기준이 달라 점수가 흔들림",
      after: "채점 기준을 미리 정해놓고 3단계로 다시 검증",
    },
    {
      dim: "진척 추적",
      before: "이메일·엑셀로 흩어져 누가 어디까지 봤는지 모름",
      after: "심사위원 × 출품 매트릭스로 실시간 확인",
    },
    {
      dim: "근거 기록",
      before: "감(感)으로 결정, 사후에 왜 그 점수인지 알 수 없음",
      after: "항목별 점수·분산(σ)·근거 요약을 자동으로 남김",
    },
    {
      dim: "분쟁 처리",
      before: "회의를 다시 잡아야 하고 결정이 늦어짐",
      after: "분산이 큰 항목만 골라 사람에게 즉시 전달",
    },
    {
      dim: "결과 공개",
      before: "내부 정리 후 별도 공지문 작성",
      after: "리더보드와 검토 기록을 그대로 공개",
    },
  ];

  return (
    <section
      className="border-b"
      style={{ borderColor: "var(--t-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-14">
        <SectionHeading
          kicker="AS IS / TO BE"
          title="무엇이 어떻게 달라지나"
        />
        <div
          className="mt-7 overflow-x-auto"
          style={{ border: "1px solid var(--t-border)", borderRadius: 2 }}
        >
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--t-border)",
                }}
              >
                <th
                  className="px-5 py-3 text-left text-[11.5px] font-semibold"
                  style={{ color: "var(--text-tertiary)", width: "22%" }}
                >
                  영역
                </th>
                <th
                  className="px-5 py-3 text-left text-[11.5px] font-semibold"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  기존 방식 (AS IS)
                </th>
                <th
                  className="px-5 py-3 text-left text-[11.5px] font-semibold"
                  style={{
                    color: "var(--accent)",
                    background: "var(--accent-soft)",
                    borderLeft: "1px solid var(--accent-ring)",
                  }}
                >
                  Fastlane (TO BE)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.dim}
                  style={{
                    borderBottom:
                      i === rows.length - 1
                        ? "none"
                        : "1px solid var(--t-border-subtle)",
                  }}
                >
                  <td
                    className="px-5 py-3.5 align-top"
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 500,
                      background: "var(--surface-1)",
                    }}
                  >
                    {r.dim}
                  </td>
                  <td
                    className="px-5 py-3.5 align-top"
                    style={{
                      color: "var(--text-secondary)",
                      wordBreak: "keep-all",
                    }}
                  >
                    {r.before}
                  </td>
                  <td
                    className="px-5 py-3.5 align-top"
                    style={{
                      color: "var(--text-primary)",
                      background: "var(--accent-soft)",
                      borderLeft: "1px solid var(--accent-ring)",
                      wordBreak: "keep-all",
                    }}
                  >
                    {r.after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── 도입 6단계 ────────────────────────────────────────────────

function Workflow() {
  const steps = [
    { n: 1, title: "도입 상담", body: "30분 통화로 운영 규모와 기준 공유", who: "Fastlane" },
    { n: 2, title: "시범 계정 발급", body: "대회 1건을 무료로 운영해볼 수 있는 워크스페이스", who: "Fastlane" },
    { n: 3, title: "평가표·심사위원 세팅", body: "초대 링크로 심사위원 추가", who: "운영 기관" },
    { n: 4, title: "지원서 접수 + AI 평가", body: "자동 실행 · 분쟁 항목 자동 표시", who: "AI" },
    { n: 5, title: "분쟁 항목 검토", body: "매트릭스로 진척 확인", who: "심사위원" },
    { n: 6, title: "결과 공개 + 정식 전환", body: "시범 데이터를 함께 검토하고 정식 도입", who: "공동" },
  ];

  return (
    <section
      className="border-b"
      style={{
        borderColor: "var(--t-border)",
        background: "var(--surface-1)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-12">
        <SectionHeading
          kicker="도입 절차"
          title="6단계 · 평균 2주"
        />
        <ol
          className="mt-7"
          style={{
            border: "1px solid var(--t-border)",
            borderRadius: 2,
            background: "var(--surface-1)",
          }}
        >
          {steps.map((s, i) => (
            <li
              key={s.n}
              className="grid grid-cols-[60px_1fr_140px] gap-5 px-6 py-4 items-start"
              style={{
                borderBottom:
                  i === steps.length - 1
                    ? "none"
                    : "1px solid var(--t-border-subtle)",
              }}
            >
              <span
                className="inline-flex items-center justify-center w-7 h-7 text-[12.5px] font-semibold tabular-nums mt-0.5"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-ring)",
                  borderRadius: 2,
                }}
              >
                {s.n}
              </span>
              <div>
                <h3
                  className="text-[14px] font-semibold mb-1"
                  style={{
                    color: "var(--text-primary)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-[12.5px] leading-[1.7]"
                  style={{
                    color: "var(--text-secondary)",
                    wordBreak: "keep-all",
                  }}
                >
                  {s.body}
                </p>
              </div>
              <span
                className="inline-flex items-center justify-center px-2 py-1 text-[11.5px] font-medium self-start"
                style={{
                  color: "var(--text-secondary)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--t-border)",
                  borderRadius: 2,
                }}
              >
                {s.who}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── 공정성 ───────────────────────────────────────────────────

function Fairness() {
  return (
    <section
      className="border-b"
      style={{ borderColor: "var(--t-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-14">
        <SectionHeading
          kicker="공정성"
          title="AI를 자동화가 아닌 통제 가능한 도구로"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-7">
          {/* 좌: 현재 적용 */}
          <div
            className="px-6 py-6"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--t-border)",
              borderRadius: 2,
            }}
          >
            <p
              className="text-[11.5px] mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              현재 적용된 3장치
            </p>
            <FairnessItem
              num="01"
              title="도메인 특화 채점 기준"
              body="대회를 만들 때 AI가 평가 기준을 미리 작성해 저장해둡니다. 모든 출품이 같은 잣대로 채점됩니다."
            />
            <FairnessItem
              num="02"
              title="3단계 검증"
              body="Draft·Skeptic·Judge 세 관점으로 다시 채점합니다. 한 번 호출에서 나오는 즉흥성을 구조로 흡수합니다."
            />
            <FairnessItem
              num="03"
              title="분쟁 항목 자동 표시"
              body="세 관점의 의견이 갈리는 항목(분산이 임계를 넘은 항목)을 자동으로 사람에게 넘깁니다."
              last
            />
          </div>

          {/* 우: 보강 계획 */}
          <div
            className="px-6 py-6"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--t-border)",
              borderRadius: 2,
            }}
          >
            <p
              className="text-[11.5px] mb-3"
              style={{ color: "var(--text-tertiary)" }}
            >
              보강 예정
            </p>
            <ul className="space-y-3 text-[13px]">
              <PlanItem text="심사위원 간 합의도(IRR) 추적 — 시간이 지나도 일관성이 유지되는지 확인" />
              <PlanItem text="익명 평가 (팀명·소속 가림) 로 인적 편향 차단" />
              <PlanItem text="AI 점수 근거 인용 — 어느 문장을 보고 그 점수를 줬는지 표시" />
              <PlanItem text="분기마다 공정성 감사 결과를 외부에 공개" />
            </ul>
            <p
              className="text-[11.5px] mt-5 pt-4 border-t"
              style={{
                color: "var(--text-tertiary)",
                borderColor: "var(--t-border)",
                wordBreak: "keep-all",
              }}
            >
              AI는 1차 평가까지만. 최종 결정 권한은 항상 심사위원에게 있습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FairnessItem({
  num,
  title,
  body,
  last,
}: {
  num: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[40px_1fr] gap-4 py-3 ${
        last ? "" : "border-b"
      }`}
      style={{ borderColor: "var(--t-border-subtle)" }}
    >
      <span
        className="text-[12px] font-semibold tabular-nums"
        style={{ color: "var(--accent)" }}
      >
        {num}
      </span>
      <div>
        <h4
          className="text-[13.5px] font-semibold mb-0.5"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </h4>
        <p
          className="text-[12.5px] leading-[1.7]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

function PlanItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <ClipboardCheck
        className="w-3.5 h-3.5 mt-0.5 shrink-0"
        style={{ color: "var(--accent)" }}
        strokeWidth={2.2}
      />
      <span
        style={{
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          wordBreak: "keep-all",
        }}
      >
        {text}
      </span>
    </li>
  );
}

// ── 가격 ─────────────────────────────────────────────────────

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "₩0",
      unit: "/ 영구",
      desc: "소규모 대회 1건. 출품 30건까지.",
      features: [
        "AI 1차 평가",
        "심사위원 3명까지",
        "검토 종료 후 결과 공개",
      ],
      cta: "무료로 시작",
      ctaHref: "/competitions/new",
      highlight: false,
    },
    {
      name: "Pro",
      price: "문의",
      unit: "/ 대회당 월 구독",
      desc: "운영 기관 · 학내 단체 · 액셀러레이터 등.",
      features: [
        "출품·심사위원 무제한",
        "분쟁 자동 회부 + 매트릭스",
        "감사 로그 export",
      ],
      cta: "도입 상담",
      ctaHref: "/about#contact",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "문의",
      unit: "/ 연간 라이선스",
      desc: "공공기관 · 정부 R&D · 입학사정 등 다중 대회 운영.",
      features: [
        "SSO · 워크 이메일 인증",
        "감사 리포트 외부 공개",
        "전담 도입 지원",
      ],
      cta: "도입 상담",
      ctaHref: "/about#contact",
      highlight: false,
    },
  ];

  return (
    <section
      className="border-b"
      style={{
        borderColor: "var(--t-border)",
        background: "var(--surface-1)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-12">
        <SectionHeading
          kicker="요금"
          title="시범 무료 · 정식은 규모 기반 견적"
        />
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--t-border)" }}>
          {tiers.map((t) => (
            <div
              key={t.name}
              className="px-6 py-6 flex flex-col"
              style={{
                background: t.highlight
                  ? "var(--accent-soft)"
                  : "var(--surface-1)",
                borderLeft: t.highlight ? "2px solid var(--accent)" : "none",
              }}
            >
              <p
                className="text-[12px] mb-1"
                style={{
                  color: t.highlight ? "var(--accent)" : "var(--text-tertiary)",
                  fontWeight: t.highlight ? 600 : 400,
                }}
              >
                {t.name}
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 26,
                    letterSpacing: "-0.015em",
                    color: "var(--text-primary)",
                  }}
                >
                  {t.price}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {t.unit}
                </span>
              </div>
              <p
                className="text-[12.5px] leading-[1.65] mb-4"
                style={{
                  color: "var(--text-secondary)",
                  wordBreak: "keep-all",
                }}
              >
                {t.desc}
              </p>
              <ul className="space-y-2 text-[12.5px] mb-6 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: "var(--signal-success)" }}
                      strokeWidth={2.2}
                    />
                    <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.ctaHref}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 text-[13px] font-medium transition-colors"
                style={{
                  background: t.highlight ? "var(--accent)" : "var(--surface-1)",
                  color: t.highlight ? "#fff" : "var(--text-primary)",
                  border: t.highlight
                    ? "1px solid var(--accent)"
                    : "1px solid var(--t-input-border)",
                  borderRadius: 2,
                }}
              >
                {t.cta}
                <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 클로징 / Contact ─────────────────────────────────────────

function Closing() {
  return (
    <section id="contact" style={{ background: "var(--surface-2)" }}>
      <div className="max-w-[1400px] mx-auto px-10 py-12 text-center">
        <h2
          style={{
            fontWeight: 700,
            fontSize: "clamp(20px, 2.2vw, 26px)",
            lineHeight: 1.4,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            wordBreak: "keep-all",
          }}
        >
          첫 대회는 무료로 만들어보세요
        </h2>
        <p
          className="text-[13px] mt-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          기관 단위 도입은 30분 통화로 견적 산출이 가능합니다.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/competitions/new"
            className="inline-flex items-center gap-2 px-4 h-10 text-[13.5px] font-medium hover:brightness-110"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 2,
            }}
          >
            무료로 대회 1건 시작
            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
          </Link>
          <a
            href="mailto:contact@fastlane.example"
            className="inline-flex items-center px-4 h-10 text-[13.5px] font-medium transition-colors hover:bg-[color:var(--surface-1)]"
            style={{
              border: "1px solid var(--t-input-border)",
              color: "var(--text-primary)",
              borderRadius: 2,
            }}
          >
            도입 상담 요청
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: "var(--t-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-8 flex items-center justify-between flex-wrap gap-4 text-[12px]">
        <div className="flex items-center gap-3">
          <Brand size="sm" color="var(--text-secondary)" />
          <span style={{ color: "var(--text-tertiary)" }}>© 2026</span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/about"
            style={{ color: "var(--text-tertiary)" }}
            className="hover:text-[color:var(--text-secondary)]"
          >
            서비스 소개
          </Link>
          <Link
            href="/pricing"
            style={{ color: "var(--text-tertiary)" }}
            className="hover:text-[color:var(--text-secondary)]"
          >
            요금
          </Link>
          <Link
            href="/login"
            style={{ color: "var(--text-tertiary)" }}
            className="hover:text-[color:var(--text-secondary)]"
          >
            로그인
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ── primitives ───────────────────────────────────────────────

function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <p
        className="text-[12px] mb-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        {kicker}
      </p>
      <h2
        style={{
          fontWeight: 600,
          fontSize: "22px",
          lineHeight: 1.35,
          letterSpacing: "-0.005em",
          color: "var(--text-primary)",
          wordBreak: "keep-all",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-[13px] leading-[1.7] mt-2 max-w-2xl"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
