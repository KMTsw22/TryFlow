import Link from "next/link";
import { Shield } from "lucide-react";
import { PricingCard } from "@/components/pricing/PricingCard";
import { Brand } from "@/components/layout/Brand";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

// Fastlane (2026-05) 요금제. 한국 운영기관·대학·액셀러레이터를 타겟으로
// 단순한 3-plan 구조. 데모 단계라 실제 결제는 비활성화.
const PLANS = [
  {
    id: "free",
    name: "무료",
    price: "₩0",
    period: "",
    description: "소규모 사내 평가용. 평가 기준 입력부터 AI 1차 스코어링까지 체험 가능.",
    features: [
      "월 30건 제안서 평가",
      "기본 6축 평가표 템플릿",
      "AI 다중 실행 (3회)",
      "분산 플래그 표시",
    ],
    locked: [
      "맞춤 평가표 무제한",
      "팀 협업·심사위원 초대",
      "리포트 PDF 내보내기",
    ],
    highlighted: false,
    ctaLabel: "무료로 시작",
    ctaHref: "/competitions",
    plan: null,
  },
  {
    id: "standard",
    name: "표준",
    price: "₩99,000",
    period: "/월",
    description: "대학·창업지원센터·액셀러레이터에 적합. 다중 대회 운영과 협업 기능.",
    features: [
      "월 1,000건 제안서 평가",
      "맞춤 평가표 무제한",
      "AI 다중 실행 (5회)",
      "심사위원 초대 · 협업",
      "분산 플래그 자동 회부",
      "리포트 PDF 내보내기",
    ],
    locked: [
      "전용 클러스터 (대규모 동시 평가)",
      "API 연동",
    ],
    highlighted: true,
    ctaLabel: "표준 플랜 시작",
    ctaHref: "/competitions",
    plan: null,
  },
  {
    id: "institution",
    name: "기관",
    price: "별도 문의",
    period: "",
    description: "중기부·창업진흥원 등 대규모 공모전. 2만 건 단위 평가에 최적화.",
    features: [
      "제안서 평가 무제한",
      "전용 클러스터 (대규모 동시 평가)",
      "API · SSO 연동",
      "감사 로그 · 데이터 보관 정책",
      "전담 PM 지원",
    ],
    locked: [],
    highlighted: false,
    ctaLabel: "도입 문의",
    ctaHref: "mailto:hello@fastlane.kr",
    plan: null,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--t-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Brand size="md" />
        <Link
          href="/competitions"
          className="text-sm transition-colors hover:text-[color:var(--text-primary)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          앱 열기
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-8 max-w-3xl mx-auto">
          <span
            className="text-[11.5px] font-medium tracking-[0.16em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            요금제
          </span>
          <span className="flex-1 h-px" style={{ background: "var(--t-border-subtle)" }} />
        </div>

        <h1
          className="text-center mb-4 mx-auto max-w-3xl leading-[1.03]"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
            letterSpacing: "-0.035em",
            color: "var(--text-primary)",
          }}
        >
          평가 규모에 맞춰<br />
          <span style={{ color: "var(--text-tertiary)" }}>고르세요.</span>
        </h1>
        <p
          className="text-center text-[16px] leading-[1.7] mb-14 max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          무료 플랜으로 평가표 입력부터 분산 플래그까지 전 기능을 체험할 수 있습니다.
          정부 사업·대규모 공모전은 기관 플랜으로 문의 주세요.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} isLoggedIn={false} />
          ))}
        </div>

        <div
          className="flex items-center gap-3 justify-center mt-16 pt-10 border-t"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <p
            className="text-[12px] font-medium tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            결제는 Stripe · 언제든 해지 가능
          </p>
        </div>
      </div>
    </div>
  );
}
