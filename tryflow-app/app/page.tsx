// Fastlane 랜딩 페이지.
//
// 2026-05-21 리디자인:
//   - Hero: 다크 + 도로 차선 모티프 (브랜드 이름 = 차선). 한 줄 카피 + 우측 UI Preview.
//   - 아래 섹션: 운영 시스템 톤 (Workflow / AS IS-TO BE / Trust / CTA).
//   - 톤 분리: Hero 한정 임팩트, 나머지는 실무 시스템 신호.
//
// Live Metrics strip 은 2026-05-21 제거 — 초기 단계라 운영 카운트가 0 으로
// 떠서 오히려 "비어 있다" 신호. 사용자 신뢰 데이터가 쌓이면 재도입.

import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Activity,
  GitBranch,
  Eye,
  Layers,
  ClipboardCheck,
} from "lucide-react";
import { Brand } from "@/components/layout/Brand";

export default async function HomePage() {

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}
    >
      <TopNav />

      <Hero />

      <Workflow />

      <Comparison />

      <TrustFramework />

      <ClosingCTA />

      <Footer />
    </div>
  );
}

// ── Top Nav ──────────────────────────────────────────────────

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
            className="transition-colors hover:text-[color:var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            서비스 소개
          </Link>
          <Link
            href="/pricing"
            className="transition-colors hover:text-[color:var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            요금
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-[color:var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            로그인
          </Link>
          <Link
            href="/competitions/new"
            className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium transition-colors hover:brightness-110"
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

// ── Hero ─────────────────────────────────────────────────────

function Hero() {
  // 도로/차선 컬러 — 다크 무드 + 노란 차선 (yellow #FACC15).
  // hero 한정. 그 아래 섹션은 흰 운영 톤 유지 — 톤 분리 원칙.
  const ROAD_BG = "#0F1115";
  const LANE_YELLOW = "#FACC15";

  // 카피 콘텐츠 — lg 이상은 absolute(차선 사이), lg 미만은 grid 안 인라인
  // 으로 두 번 사용. JSX 변수로 추출해 중복 방지.
  const heroCopy = (
    <>
      <p
        className="text-[12px] mb-3 inline-flex items-center gap-2"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        <span
          className="inline-block w-1.5 h-1.5"
          style={{ background: LANE_YELLOW }}
          aria-hidden
        />
        공모전 · 지원사업 · 경진대회 1차 심사 자동화
      </p>
      <h1
        style={{
          fontWeight: 700,
          fontSize: "clamp(32px, 4vw, 52px)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          color: "#FFFFFF",
          wordBreak: "keep-all",
        }}
      >
        AI가 1차 심사,
        <br />
        <span style={{ color: LANE_YELLOW }}>사람은 분쟁만</span>
      </h1>
      <p
        className="text-[14px] leading-[1.7] mt-5"
        style={{
          color: "rgba(255,255,255,0.7)",
          wordBreak: "keep-all",
        }}
      >
        모든 출품을 같은 기준으로 자동 채점하고, 점수가 갈리는 항목만 사람에게 넘깁니다.
      </p>
      <div className="mt-8 flex items-center gap-4 flex-wrap">
        <Link
          href="/competitions/new"
          className="inline-flex items-center gap-2 px-5 h-11 text-[14px] font-semibold transition-colors hover:brightness-110"
          style={{
            background: LANE_YELLOW,
            color: ROAD_BG,
            borderRadius: 2,
          }}
        >
          무료로 대회 1건 시작
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        </Link>
        <Link
          href="/about"
          className="text-[13px] font-medium underline-offset-4 hover:underline"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          서비스 소개 보기
        </Link>
      </div>
    </>
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: ROAD_BG }}
      aria-label="Fastlane 소개"
    >
      {/* 도로 차선 — 4개 vertical line. 등간격(26%) 유지.
          가운데 2개는 점선(차선), 가장자리 2개는 실선(갓길). */}
      <RoadLane left="12%" color={LANE_YELLOW} solid />
      <RoadLane left="38%" color={LANE_YELLOW} />
      <RoadLane left="64%" color={LANE_YELLOW} />
      <RoadLane left="90%" color={LANE_YELLOW} solid />

      {/* 우상단 → 좌하단 어두운 비넷 — 깊이감 */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 70% 0%, rgba(255,255,255,0.04), transparent 60%)",
        }}
      />

      {/* lg 이상: 카피를 viewport % 기준 absolute 로 1·2번 차선 사이(14~36%)에 박음.
          차선 위치(12%/38%)와 동일 단위라 어떤 viewport 에서도 정확히 들어감. */}
      <div
        className="hidden lg:flex absolute z-10 items-center pointer-events-none"
        style={{ top: 0, bottom: 0, left: "14vw", width: "22vw" }}
      >
        <div className="pointer-events-auto w-full">{heroCopy}</div>
      </div>

      <div className="relative max-w-[1400px] mx-auto px-10 pt-20 pb-32 min-h-[85vh] flex flex-col gap-12 lg:flex-row lg:justify-end lg:items-center">
        {/* lg 미만에서만 카피 인라인 노출 (lg 이상에선 위 absolute 가 담당). */}
        <div className="lg:hidden">{heroCopy}</div>

        {/* UI Preview — 다크 배경 위 흰 카드. lg 이상에선 우측 정렬. */}
        <div
          className="lg:w-[44vw]"
          style={{ filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.35))" }}
        >
          <UIPreview />
        </div>
      </div>
    </section>
  );
}

// 도로 차선 — vertical line. solid = 가장자리 갓길, dashed = 차선.
function RoadLane({
  left,
  color,
  solid = false,
}: {
  left: string;
  color: string;
  solid?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{
        left,
        width: 12,
        background: solid
          ? color
          : `repeating-linear-gradient(to bottom, ${color} 0, ${color} 36px, transparent 36px, transparent 60px)`,
        opacity: solid ? 0.35 : 0.45,
      }}
    />
  );
}


// 실제 운영 화면을 표 형태로 미리 보여줌 — "이게 우리 제품의 실제 화면이다" 신호.
// 스크린샷 대신 데이터 톤으로 렌더해서 잡지스러움 차단.
function UIPreview() {
  const rows: Array<{
    title: string;
    team: string;
    score: number;
    sigma: string;
    status: "검토 필요" | "AI 합의" | "제출됨";
  }> = [
    { title: "임대 계약 도움 Agent", team: "팀 리스가이드", score: 84, sigma: "2.1", status: "AI 합의" },
    { title: "드럼 악보 생성기", team: "팀 비트스코어", score: 78, sigma: "8.4", status: "검토 필요" },
    { title: "쉽게 배우는 코딩", team: "팀 코드베이비", score: 76, sigma: "3.0", status: "AI 합의" },
    { title: "AI 수영 코치", team: "팀 스트로크", score: 71, sigma: "9.2", status: "검토 필요" },
    { title: "AI 주식 코치", team: "팀 차티", score: 69, sigma: "2.8", status: "제출됨" },
  ];

  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--t-border)",
        borderRadius: 10,
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.08), 0 24px 60px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {/* 브라우저 frame — macOS 스타일 traffic light + URL bar */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{
          background:
            "linear-gradient(180deg, #F2F2F4 0%, #E8E8EC 100%)",
          borderBottom: "1px solid #D8D8DC",
        }}
      >
        <span className="flex items-center gap-1.5 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#FF5F57" }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#FEBC2E" }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#28C840" }}
          />
        </span>
        <div
          className="flex-1 mx-2 px-3 py-1 text-[11px] tabular-nums truncate"
          style={{
            background: "#FFFFFF",
            border: "1px solid #D8D8DC",
            borderRadius: 4,
            color: "#6B6B6F",
          }}
        >
          fastlane.app/competitions/2026-kmu-pbl-hackathon
        </div>
      </div>

      {/* 페이지 헤더 영역 — 실제 페이지처럼 카테고리 + 제목 + 메타 */}
      <div
        className="px-4 py-3"
        style={{
          background: "var(--surface-1)",
          borderBottom: "1px solid var(--t-border-subtle)",
        }}
      >
        <p
          className="text-[11px] mb-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          대회 운영 · 리더보드
        </p>
        <p
          className="text-[13px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          2026 국민대 PBL 해커톤
        </p>
        <p
          className="text-[11px] mt-1 tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          출품 8 · 평가 완료 8 · 검토 필요 2 · 마감 D-12
        </p>
      </div>

      <table className="w-full text-[12px]">
        <thead>
          <tr
            style={{
              background: "var(--surface-2)",
              borderBottom: "1px solid var(--t-border)",
            }}
          >
            <th
              className="px-4 py-2 text-left text-[11px] font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              출품
            </th>
            <th
              className="px-3 py-2 text-right text-[11px] font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              점수
            </th>
            <th
              className="px-3 py-2 text-right text-[11px] font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              편차
            </th>
            <th
              className="px-4 py-2 text-left text-[11px] font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              상태
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.title}
              style={{
                borderBottom:
                  i === rows.length - 1
                    ? "none"
                    : "1px solid var(--t-border-subtle)",
              }}
            >
              <td className="px-4 py-2.5">
                <div
                  className="font-medium leading-tight truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {r.title}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {r.team}
                </div>
              </td>
              <td
                className="px-3 py-2.5 text-right tabular-nums"
                style={{ color: "var(--text-primary)", fontWeight: 600 }}
              >
                {r.score}
              </td>
              <td
                className="px-3 py-2.5 text-right tabular-nums"
                style={{
                  color:
                    parseFloat(r.sigma) > 8
                      ? "var(--signal-attention)"
                      : "var(--text-tertiary)",
                  fontWeight: parseFloat(r.sigma) > 8 ? 600 : 400,
                }}
              >
                {r.sigma}
              </td>
              <td className="px-4 py-2.5">
                <StatusPill status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: "검토 필요" | "AI 합의" | "제출됨";
}) {
  const color =
    status === "검토 필요"
      ? "var(--signal-attention)"
      : status === "제출됨"
      ? "var(--signal-success)"
      : "var(--text-tertiary)";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px]"
      style={{
        color,
        border: `1px solid ${color}33`,
        borderRadius: 2,
        fontWeight: 500,
      }}
    >
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {status}
    </span>
  );
}

// ── Workflow ─────────────────────────────────────────────────

function Workflow() {
  const steps = [
    { n: 1, title: "평가 기준 입력", body: "주제·항목·가중치", who: "운영자" },
    { n: 2, title: "AI 채점 가이드 생성", body: "항목별 채점 기준 자동 작성·저장", who: "AI" },
    { n: 3, title: "지원서 접수", body: "PDF·링크 업로드", who: "참가자" },
    { n: 4, title: "AI 1차 평가", body: "Draft·Skeptic·Judge 3단계 검증", who: "AI" },
    { n: 5, title: "분쟁 검토", body: "의견 갈리는 항목만", who: "심사위원" },
    { n: 6, title: "결과 공개", body: "리더보드 + 기록 보존", who: "운영자" },
  ];

  return (
    <section
      className="border-b"
      style={{ borderColor: "var(--t-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-16">
        <SectionHeading
          kicker="운영 흐름"
          title="6단계로 1차 심사가 끝납니다"
        />

        {/* 6단계 압축 strip — 전체 흐름 한눈에 */}
        <div
          className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px"
          style={{ background: "var(--t-border)" }}
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="px-4 py-4"
              style={{ background: "var(--surface-1)" }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-semibold tabular-nums"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    border: "1px solid var(--accent-ring)",
                    borderRadius: 2,
                  }}
                >
                  {s.n}
                </span>
                {i < steps.length - 1 && (
                  <ArrowRight
                    className="w-3 h-3 hidden lg:inline-block"
                    style={{ color: "var(--text-tertiary)" }}
                    strokeWidth={2}
                  />
                )}
              </div>
              <h3
                className="text-[13px] font-semibold mb-1"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.005em",
                }}
              >
                {s.title}
              </h3>
              <p
                className="text-[11px] leading-[1.55]"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.body}
              </p>
              <p
                className="text-[11px] mt-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                {s.who}
              </p>
            </div>
          ))}
        </div>

        {/* 핵심 3단계 — alternating split 으로 깊이 있게 (스코어러+ 패턴 차용) */}
        <div className="mt-20 space-y-20">
          <FeatureSplit
            badge="02"
            kicker="AI 채점 가이드 생성"
            title="주제와 항목만 입력하면 AI가 채점 기준을 만듭니다"
            body="대회마다 새로 작성하던 채점 가이드를 AI가 도메인 특화 형태로 자동 생성합니다. 같은 잣대가 모든 출품에 일관되게 적용되어 사람마다 다르게 채점되는 편차가 사라집니다."
            who="AI · 약 30초 소요"
            mockup={<RubricMockup />}
          />
          <FeatureSplit
            badge="04"
            kicker="AI 1차 평가 · 3-Pass 검증"
            title="같은 출품을 세 관점으로 다시 채점합니다"
            body="Draft(낙관) → Skeptic(양방향 보정) → Judge(가중 평균)의 3단계 검증으로 한 번 호출에서 나오는 즉흥성을 흡수합니다. 점수와 함께 편차(표준편차 σ)도 같이 기록해 AI 자체가 자신 없는 항목을 자동 표시합니다."
            who="AI · 출품당 평균 1-2분"
            mockup={<ThreePassMockup />}
            reverse
          />
          <FeatureSplit
            badge="05"
            kicker="분쟁 자동 감지 → 인간 검토"
            title="AI가 흔들리는 항목만 사람에게 넘깁니다"
            body="세 관점 간 점수 분산이 임계를 넘은 항목은 자동으로 검토 권고로 표시됩니다. 심사위원은 이 항목만 보면 되고, 합의가 충분한 나머지는 자동 통과합니다 — 그만큼 사람의 시간이 절약됩니다."
            who="심사위원 · 의사결정만"
            mockup={<DisputeMockup />}
          />
        </div>
      </div>
    </section>
  );
}

// ── 기능 split 공통 컴포넌트 ─────────────────────────────────

function FeatureSplit({
  badge,
  kicker,
  title,
  body,
  who,
  mockup,
  reverse = false,
}: {
  badge: string;
  kicker: string;
  title: string;
  body: string;
  who: string;
  mockup: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center`}
    >
      {/* 텍스트 */}
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center justify-center w-7 h-7 text-[12px] font-semibold tabular-nums"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border: "1px solid var(--accent-ring)",
              borderRadius: 2,
            }}
          >
            {badge}
          </span>
          <span
            className="text-[12px] font-medium"
            style={{ color: "var(--accent)" }}
          >
            {kicker}
          </span>
        </div>
        <h3
          className="font-semibold mb-3"
          style={{
            fontSize: "clamp(20px, 2.2vw, 26px)",
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </h3>
        <p
          className="text-[14px] leading-[1.75]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          {body}
        </p>
        <p
          className="text-[12px] mt-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          {who}
        </p>
      </div>

      {/* mockup */}
      <div className={reverse ? "lg:order-1" : ""}>{mockup}</div>
    </div>
  );
}

// ── Mockup 3종 ─────────────────────────────────────────────

function RubricMockup() {
  const items = [
    { name: "시장성", weight: 22, desc: "타겟 시장 규모·성장 가능성" },
    { name: "문제 절박성", weight: 18, desc: "사용자가 실제로 겪는 고통의 강도" },
    { name: "제품 우수성", weight: 18, desc: "기존 대비 10배 개선의 근거" },
    { name: "차별화·방어선", weight: 14, desc: "경쟁자 대비 진입 장벽" },
    { name: "수익 모델", weight: 14, desc: "BM 검증 · 단가 · 반복 매출" },
    { name: "시장 타이밍", weight: 14, desc: "지금이어야 하는 이유" },
  ];
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--t-border)",
        borderRadius: 8,
        boxShadow:
          "0 1px 3px rgba(15,17,21,0.04), 0 12px 32px -8px rgba(15,17,21,0.12)",
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between gap-3"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-soft) 0%, rgba(30,58,138,0.02) 100%)",
          borderBottom: "1px solid var(--accent-ring)",
        }}
      >
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--signal-success)",
                boxShadow: "0 0 0 3px rgba(5,150,105,0.15)",
              }}
              aria-hidden
            />
            <p
              className="text-[11px]"
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              AI 생성 완료 · 약 28초
            </p>
          </div>
          <p
            className="text-[14px] font-semibold"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.005em",
            }}
          >
            핀테크 SaaS 평가 기준
          </p>
        </div>
        <span
          className="text-[11px] font-medium px-2 py-1 tabular-nums"
          style={{
            color: "var(--accent)",
            background: "#FFFFFF",
            border: "1px solid var(--accent-ring)",
            borderRadius: 999,
          }}
        >
          6개 항목
        </span>
      </div>
      <div>
        {items.map((it, i) => (
          <div
            key={it.name}
            className="px-5 py-3 flex items-center gap-4"
            style={{
              borderBottom:
                i === items.length - 1
                  ? "none"
                  : "1px solid var(--t-border-subtle)",
              background:
                i === 0
                  ? "linear-gradient(90deg, rgba(30,58,138,0.025), transparent)"
                  : undefined,
            }}
          >
            <span
              className="inline-flex items-center justify-center text-[12px] tabular-nums font-bold shrink-0"
              style={{
                color: "var(--accent)",
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-ring)",
                borderRadius: 4,
                minWidth: 42,
                padding: "2px 6px",
              }}
            >
              {it.weight}%
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-semibold leading-tight"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.003em",
                }}
              >
                {it.name}
              </p>
              <p
                className="text-[11px] leading-tight mt-0.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                {it.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreePassMockup() {
  const passes: Array<{
    name: string;
    score: number;
    role: string;
    isFinal?: boolean;
  }> = [
    { name: "Draft", score: 75, role: "낙관" },
    { name: "Skeptic", score: 71, role: "비판" },
    { name: "Judge", score: 73, role: "합의", isFinal: true },
  ];
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--t-border)",
        borderRadius: 8,
        boxShadow:
          "0 1px 3px rgba(15,17,21,0.04), 0 12px 32px -8px rgba(15,17,21,0.12)",
      }}
    >
      <div
        className="px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, var(--surface-2) 0%, rgba(244,244,245,0.4) 100%)",
          borderBottom: "1px solid var(--t-border)",
        }}
      >
        <p
          className="text-[11px] mb-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          3-Pass 검증 결과 · gpt-4o-mini
        </p>
        <p
          className="text-[14px] font-semibold"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.005em" }}
        >
          시장성 항목 · 출품 #03
        </p>
      </div>
      <div className="px-5 py-5">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 mb-5">
          {passes.map((p, i) => (
            <Fragment key={p.name}>
              <div
                className="text-center"
                style={{
                  background: p.isFinal
                    ? "linear-gradient(135deg, var(--accent-soft) 0%, rgba(30,58,138,0.04) 100%)"
                    : "#FFFFFF",
                  border: p.isFinal
                    ? "1.5px solid var(--accent)"
                    : "1px solid var(--t-border)",
                  borderRadius: 4,
                  padding: "12px 8px 14px",
                  boxShadow: p.isFinal
                    ? "0 2px 8px rgba(30,58,138,0.12)"
                    : undefined,
                }}
              >
                <p
                  className="text-[11px] uppercase tracking-wider mb-1"
                  style={{
                    color: p.isFinal
                      ? "var(--accent)"
                      : "var(--text-tertiary)",
                    fontWeight: p.isFinal ? 600 : 500,
                    letterSpacing: "0.08em",
                  }}
                >
                  {p.name}
                </p>
                <p
                  className="tabular-nums"
                  style={{
                    fontSize: p.isFinal ? "28px" : "24px",
                    fontWeight: 700,
                    color: p.isFinal
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {p.score}
                </p>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {p.role}
                </p>
              </div>
              {i < passes.length - 1 && (
                <ArrowRight
                  className="w-3 h-3"
                  style={{ color: "var(--text-tertiary)" }}
                  strokeWidth={2.4}
                />
              )}
            </Fragment>
          ))}
        </div>
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: "var(--accent-soft)",
            borderRadius: 4,
            border: "1px solid var(--accent-ring)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-5 h-5"
              style={{
                background: "var(--accent)",
                color: "#FFFFFF",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Σ
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              가중 평균 + 분산 기록
            </span>
          </div>
          <span
            className="text-[13px] font-bold tabular-nums"
            style={{ color: "var(--accent)" }}
          >
            73 <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 11 }}>· 편차 1.6</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function DisputeMockup() {
  const axes = [
    { name: "시장성", sigma: 1.6, disputed: false },
    { name: "문제 절박성", sigma: 8.4, disputed: true },
    { name: "제품 우수성", sigma: 2.1, disputed: false },
    { name: "차별화·방어선", sigma: 9.2, disputed: true },
    { name: "수익 모델", sigma: 3.0, disputed: false },
    { name: "시장 타이밍", sigma: 2.8, disputed: false },
  ];
  const THRESHOLD = 8;
  const MAX = 12;
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--t-border)",
        borderRadius: 8,
        boxShadow:
          "0 1px 3px rgba(15,17,21,0.04), 0 12px 32px -8px rgba(15,17,21,0.12)",
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, var(--surface-2) 0%, rgba(244,244,245,0.4) 100%)",
          borderBottom: "1px solid var(--t-border)",
        }}
      >
        <div>
          <p
            className="text-[11px] mb-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            항목별 편차
          </p>
          <p
            className="text-[14px] font-semibold"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.005em",
            }}
          >
            출품 #03 · 임계{" "}
            <span
              className="tabular-nums"
              style={{ color: "var(--signal-attention)" }}
            >
              편차 &gt; {THRESHOLD}
            </span>
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 tabular-nums"
          style={{
            color: "var(--signal-attention)",
            background: "var(--signal-attention-soft)",
            border: "1px solid var(--signal-attention-ring)",
            borderRadius: 999,
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--signal-attention)",
              boxShadow: "0 0 0 3px rgba(180,83,9,0.15)",
            }}
            aria-hidden
          />
          검토 필요 2건
        </span>
      </div>
      <div className="relative">
        {/* 임계선 표시 — 막대 위에 떠 있는 점선 */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            // 막대 영역 안에서 임계 위치 (max 140px 폭, 끝에서 9px 가산은 패딩).
            // 시각적으로 8/12 위치에 점선 표시.
            left: "calc(100% - 24px - 140px + 140px * 8 / 12)",
            width: 1,
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--signal-attention) 0 3px, transparent 3px 6px)",
            opacity: 0.6,
          }}
        />
        {axes.map((a, i) => (
          <div
            key={a.name}
            className="px-5 py-2.5 flex items-center gap-3"
            style={{
              borderBottom:
                i === axes.length - 1
                  ? "none"
                  : "1px solid var(--t-border-subtle)",
              background: a.disputed
                ? "linear-gradient(90deg, rgba(180,83,9,0.06), rgba(180,83,9,0.02))"
                : undefined,
            }}
          >
            <p
              className="text-[12px] flex-1"
              style={{
                color: a.disputed
                  ? "var(--signal-attention)"
                  : "var(--text-secondary)",
                fontWeight: a.disputed ? 600 : 500,
              }}
            >
              {a.name}
            </p>
            <div
              className="relative h-2 flex-shrink-0"
              style={{
                width: 140,
                background: "var(--t-border-subtle)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                className="absolute top-0 bottom-0 left-0"
                style={{
                  width: `${Math.min(100, (a.sigma / MAX) * 100)}%`,
                  background: a.disputed
                    ? "linear-gradient(90deg, rgba(180,83,9,0.6), var(--signal-attention))"
                    : "linear-gradient(90deg, rgba(100,116,139,0.5), var(--text-tertiary))",
                  borderRadius: 999,
                }}
              />
            </div>
            <span
              className="text-[12px] tabular-nums w-9 text-right"
              style={{
                color: a.disputed
                  ? "var(--signal-attention)"
                  : "var(--text-tertiary)",
                fontWeight: a.disputed ? 700 : 500,
              }}
            >
              {a.sigma.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
      <div
        className="px-5 py-3 flex items-center gap-2 text-[11px]"
        style={{
          background: "var(--surface-2)",
          borderTop: "1px solid var(--t-border)",
          color: "var(--text-secondary)",
        }}
      >
        <CheckCircle2
          className="w-3 h-3 shrink-0"
          style={{ color: "var(--signal-success)" }}
          strokeWidth={2.4}
        />
        나머지 4개 항목은 AI 합의 — 자동 통과
      </div>
    </div>
  );
}

// ── Comparison (AS IS / TO BE) ───────────────────────────────
//
// 2026-05-21 리디자인: 스코어러+ 스타일의 두 컬럼 카드형 비교.
// - 좌측 AS IS: 흰 배경에 회색 톤 pill 카드, 점선 connector 로 흐름 표시.
// - 우측 TO BE: accent 박스로 묶고, 핵심 3 단계만 진한 색으로 강조.
// - 양 컬럼 row 수를 맞추기 위해 AS IS 쪽 빈 자리는 spacer 로 둠.

function Comparison() {
  // AS IS — 전통 1차 심사 흐름. null 은 align 용 spacer.
  const asIs: Array<{ label: string } | null> = [
    { label: "공고" },
    null,
    { label: "이메일·엑셀로 출품 접수" },
    { label: "심사위원이 모든 지원서를 직접 읽음" },
    { label: "회의를 다시 잡아 분쟁 조율" },
    { label: "별도 공지문으로 결과 발표" },
    null,
  ];

  // TO BE — Fastlane 흐름. accent=true 인 항목이 핵심 차별 단계.
  const toBe: Array<{ label: string; accent: boolean }> = [
    { label: "공고", accent: false },
    { label: "심사위원 초대 · 역할 배정", accent: false },
    { label: "온라인 출품 접수 · 서식 자동 검증", accent: true },
    { label: "AI 1차 자동 채점 (동일 기준 · 3-Pass)", accent: true },
    { label: "분산 큰 항목만 사람에게 핀포인트", accent: true },
    { label: "리더보드 자동 산출 · 결과 페이지 공개", accent: false },
    { label: "검토 기록 영구 보존", accent: false },
  ];

  return (
    <section
      className="border-b"
      style={{
        borderColor: "var(--t-border)",
        background: "var(--surface-1)",
      }}
    >
      <div className="max-w-[1100px] mx-auto px-10 py-20">
        {/* 중앙 정렬 헤딩 — 스코어러+ 와 동일한 비교 섹션 톤. */}
        <div className="text-center">
          <p
            className="text-[12px] mb-3 tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            AS IS / TO BE
          </p>
          <h2
            style={{
              fontWeight: 700,
              fontSize: "28px",
              lineHeight: 1.35,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
              wordBreak: "keep-all",
            }}
          >
            <span style={{ color: "var(--accent)" }}>Fastlane</span>을 이용하면
          </h2>
          <p
            className="mt-2 text-[15px]"
            style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
          >
            보다 빠르고 투명한 1차 심사가 가능합니다.
          </p>
        </div>

        {/* 비교 컬럼 — 동일 행 수로 맞춰 카드끼리 수평 정렬. */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* AS IS 컬럼 */}
          <div className="relative">
            <p
              className="text-center text-[15px] font-bold mb-5 tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              AS IS
            </p>

            {/* 점선 connector — 카드 사이를 세로로 잇는 흐름 표시. */}
            <div
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: 56,
                bottom: 36,
                borderLeft: "1.5px dashed var(--t-border)",
              }}
            />

            <div className="relative flex flex-col gap-3">
              {asIs.map((item, i) =>
                item ? (
                  <div
                    key={i}
                    className="relative z-10 flex items-center justify-center text-center text-[13px] px-5"
                    style={{
                      background: "var(--surface-1)",
                      border: "1px solid var(--t-border)",
                      borderRadius: 8,
                      color: "var(--text-secondary)",
                      wordBreak: "keep-all",
                      minHeight: 56,
                    }}
                  >
                    {item.label}
                  </div>
                ) : (
                  <div
                    key={i}
                    aria-hidden
                    style={{ minHeight: 56 }}
                  />
                )
              )}
            </div>

            {/* 아래쪽 화살표 — 흐름 종결 신호. */}
            <div className="flex justify-center mt-3">
              <ArrowDown
                className="w-4 h-4"
                style={{ color: "var(--text-tertiary)" }}
                strokeWidth={2}
              />
            </div>
          </div>

          {/* TO BE 컬럼 — accent 박스로 묶어 시각적으로 분리. */}
          <div
            className="p-6 pb-7"
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-ring)",
              borderRadius: 8,
            }}
          >
            <p
              className="text-center text-[15px] font-bold mb-5 tracking-wide"
              style={{ color: "var(--accent)" }}
            >
              TO BE
            </p>

            <div className="flex flex-col gap-3">
              {toBe.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center text-center px-5"
                  style={
                    item.accent
                      ? {
                          background: "var(--accent)",
                          color: "white",
                          border: "1px solid var(--accent)",
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 14,
                          wordBreak: "keep-all",
                          minHeight: 56,
                          boxShadow:
                            "0 2px 6px -2px rgba(15, 23, 42, 0.18)",
                        }
                      : {
                          background: "var(--surface-1)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--t-border)",
                          borderRadius: 8,
                          fontWeight: 500,
                          fontSize: 13.5,
                          wordBreak: "keep-all",
                          minHeight: 56,
                        }
                  }
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Trust Framework ──────────────────────────────────────────

function TrustFramework() {
  const items = [
    { icon: GitBranch, title: "사람이 최종 결정", body: "AI 단독 결정 없음" },
    { icon: Activity, title: "분쟁 자동 감지", body: "분산이 큰 항목 자동 표시" },
    { icon: Eye, title: "점수 근거 공개", body: "항목별 점수와 이유를 함께" },
    { icon: Layers, title: "동일 기준", body: "채점 기준을 미리 고정" },
    { icon: ClipboardCheck, title: "감사 추적", body: "결정 과정을 시간순으로 보존" },
  ];

  return (
    <section
      className="border-b"
      style={{ borderColor: "var(--t-border)" }}
    >
      <div className="max-w-[1400px] mx-auto px-10 py-16">
        <SectionHeading
          kicker="신뢰 구조"
          title="AI를 자동화가 아닌 통제 가능한 도구로"
        />

        <div
          className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px"
          style={{ background: "var(--t-border)" }}
        >
          {items.map((it) => (
            <div
              key={it.title}
              className="px-4 py-4"
              style={{ background: "var(--surface-1)" }}
            >
              <it.icon
                className="w-4 h-4 mb-2.5"
                style={{ color: "var(--accent)" }}
                strokeWidth={2}
              />
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
                className="text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {it.body}
              </p>
            </div>
          ))}
        </div>

        <p
          className="text-[12px] mt-5 flex items-center gap-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          <CheckCircle2
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "var(--signal-success)" }}
            strokeWidth={2.4}
          />
          AI는 1차 평가까지만. 최종 결정은 항상 사람이 합니다.
        </p>
      </div>
    </section>
  );
}

// ── Closing CTA ──────────────────────────────────────────────

function ClosingCTA() {
  return (
    <section style={{ background: "var(--surface-2)" }}>
      <div className="max-w-[1400px] mx-auto px-10 py-14 text-center">
        <h2
          style={{
            fontWeight: 700,
            fontSize: "clamp(22px, 2.4vw, 28px)",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            wordBreak: "keep-all",
          }}
        >
          첫 대회는 무료로 만들어보세요.
        </h2>
        <p
          className="text-[13px] mt-3"
          style={{ color: "var(--text-tertiary)" }}
        >
          카드 등록 없이 가입하자마자 평가표를 만들 수 있습니다.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/competitions/new"
            className="inline-flex items-center gap-2 px-4 h-10 text-[13px] font-medium transition-colors hover:brightness-110"
            style={{
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 2,
            }}
          >
            무료로 대회 1건 시작
            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-4 h-10 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-1)]"
            style={{
              border: "1px solid var(--t-input-border)",
              color: "var(--text-primary)",
              borderRadius: 2,
            }}
          >
            서비스 소개 보기
          </Link>
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

// ── Section heading (재사용) ────────────────────────────────

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
