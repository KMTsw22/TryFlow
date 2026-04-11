import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Check, Lock, Shield } from "lucide-react";
import { PricingCard } from "@/components/pricing/PricingCard";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "아이디어를 제출하고 AI 인사이트를 확인하세요.",
    features: [
      "아이디어 익명 제출",
      "제출 결과 AI 인사이트 확인",
    ],
    locked: [
      "Trends 대시보드 열람",
      "카테고리별 심층 트렌드 분석",
      "투자자/기업 연락 수신",
    ],
    highlighted: false,
    ctaLabel: "시작하기",
    ctaHref: "/submit",
    plan: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    period: "/월",
    description: "VC·투자자·기업을 위한 전체 트렌드 인텔리전스.",
    features: [
      "Trends 대시보드 전체 열람",
      "9개 카테고리 심층 트렌드 분석",
      "실시간 아이디어 흐름 모니터링",
      "카테고리별 기회 시그널 지표",
      "연락 요청 하루 10건",
      "7일 무료 체험",
    ],
    locked: [],
    highlighted: true,
    ctaLabel: "Pro 구독하기",
    ctaHref: null,
    plan: "pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$499",
    period: "/월",
    description: "기업 이노베이션팀·대형 VC를 위한 무제한 플랜.",
    features: [
      "Pro 플랜 모든 기능 포함",
      "무제한 연락 요청",
      "API 접근 권한",
      "커스텀 리포트 제공",
      "팀 멤버 최대 5명",
    ],
    locked: [],
    highlighted: false,
    ctaLabel: "문의하기",
    ctaHref: "mailto:contact@trywepp.com",
    plan: null,
  },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen" style={{ background: "#050816" }}>
      {/* Navbar */}
      <nav
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{
          background: "rgba(5,8,22,0.95)",
          borderColor: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="w-7 h-7" alt="Try.Wepp" />
          <span className="font-bold text-white text-sm">Try.Wepp</span>
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
            }}
          >
            <Lock className="w-3.5 h-3.5" />
            Trends 대시보드는 구독자 전용 콘텐츠입니다
          </div>

          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-3">
            Subscription Plans
          </p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            시장 인텔리전스를 구독하세요
          </h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            예비 창업자들이 익명으로 제출한 아이디어 트렌드를 실시간으로 분석합니다.
            VC·기업 구독자만 열람 가능합니다.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>

        {/* Features breakdown */}
        <div
          className="border p-8 mb-10"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="text-lg font-bold text-white mb-6 text-center">
            Pro 구독으로 얻을 수 있는 것
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                color: "#818cf8",
                title: "실시간 트렌드 대시보드",
                desc: "9개 카테고리의 아이디어 흐름을 실시간으로 모니터링. Rising · Stable · Declining 방향성과 시장 포화도를 한눈에 확인.",
              },
              {
                color: "#34d399",
                title: "기회 시그널 지표",
                desc: "트렌드와 포화도를 결합한 Hot Gap · Heating Up · Competitive 등 9가지 시그널로 투자 적기를 포착.",
              },
              {
                color: "#f472b6",
                title: "아이디어 제출자 연락",
                desc: "관심 있는 아이디어 제출자에게 하루 10건까지 연락. 제출자 이메일은 직접 노출되지 않습니다.",
              },
            ].map(({ color, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-3 justify-center">
          <Shield className="w-4 h-4 text-gray-600 shrink-0" />
          <p className="text-xs text-gray-600">
            결제는 Stripe를 통해 안전하게 처리됩니다. 언제든지 구독을 취소할 수 있으며,
            취소 시 당월 기간이 끝날 때까지 계속 이용 가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
