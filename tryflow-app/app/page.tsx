"use client";

// Fastlane 랜딩.
//
// 디자인 톤 (2026-05): 한국식 사무 SaaS.
//   - 라이트 베이스 (#FAFAFA / #FFFFFF) + Pretendard sans + 직각 모서리.
//   - 강조는 단 하나의 진한 네이비. 그라디언트/글로우 일절 사용 X.
//   - 정보 밀도는 사무 문서처럼 단정하고, 라벨은 한국어 행정 톤.
//   - 디스플레이 폰트도 sans 로 통일. Brand wordmark 만 serif (정체성 keep).

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, Repeat, AlertTriangle } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { LandingTopNav } from "@/components/landing/LandingTopNav";

const ROTATING = ["공정하게.", "투명하게.", "결정 가능하게.", "검증 가능하게."];
const LONGEST_ROTATING = ROTATING.reduce((a, b) => (b.length > a.length ? b : a));

// 사무톤 팔레트 — 페이지 내 단일 출처로 일관성 유지.
const TONE = {
  bg: "#FAFAFA",
  bgRaised: "#FFFFFF",
  bgInfo: "#F5F6F8",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  textPrimary: "#0F172A",
  textSecondary: "#334155",
  textTertiary: "#64748B",
  textMuted: "#94A3B8",
  accent: "#1E3A8A",
  accentSoft: "#EEF2FA",
};

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

export default function HomePage() {
  const scrolled = useScrolled();
  const [rotIdx, setRotIdx] = useState(0);
  const [animState, setAnimState] = useState<"in" | "out">("in");

  useEffect(() => {
    const cycle = setInterval(() => {
      setAnimState("out");
      setTimeout(() => {
        setRotIdx((i) => (i + 1) % ROTATING.length);
        setAnimState("in");
      }, 240);
    }, 2400);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: TONE.bg, color: TONE.textPrimary }}
    >
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          background: scrolled ? "rgba(255,255,255,0.96)" : TONE.bg,
          backdropFilter: scrolled ? "blur(8px)" : "none",
          borderBottom: `1px solid ${scrolled ? TONE.border : "transparent"}`,
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-[60px]">
          <Brand size="md" color={TONE.textPrimary} />
          <LandingTopNav scrolled={scrolled} />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-24">
        {/* 미세 dot grid — 사무용 페이퍼 느낌 */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.5] pointer-events-none"
          style={{
            backgroundImage:
              `radial-gradient(circle, ${TONE.borderStrong} 0.6px, transparent 0.6px)`,
            backgroundSize: "24px 24px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* 행정 라벨 */}
          <div
            className="inline-flex items-center gap-2 mb-8 px-3 py-1"
            style={{
              background: TONE.bgRaised,
              border: `1px solid ${TONE.border}`,
              animation: "fadeInUp 0.6s ease both",
            }}
          >
            <span
              className="w-1 h-1"
              style={{ background: TONE.accent }}
              aria-hidden
            />
            <span
              className="text-[11px] font-semibold"
              style={{
                color: TONE.textSecondary,
                letterSpacing: "0.14em",
              }}
            >
              AI 1차 평가 · 전문가 최종 심사
            </span>
          </div>

          {/* H1 — 사무 sans 디스플레이. */}
          <h1
            className="ko-display"
            style={{
              fontWeight: 800,
              fontSize: "clamp(2rem, 4.4vw, 3.6rem)",
              lineHeight: 1.18,
              color: TONE.textPrimary,
              letterSpacing: "-0.025em",
              wordBreak: "keep-all",
            }}
          >
            <span
              className="block"
              style={{ animation: "fadeInUp 0.8s ease 0.1s both" }}
            >
              2만 건의 지원서를
            </span>
            <span
              className="block mt-1"
              style={{ animation: "fadeInUp 0.8s ease 0.25s both" }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  columnGap: "0.32em",
                }}
              >
                <span>AI가</span>
                <span
                  style={{ position: "relative", display: "inline-block" }}
                >
                  <span
                    aria-hidden
                    style={{ visibility: "hidden", whiteSpace: "nowrap" }}
                  >
                    {LONGEST_ROTATING}
                  </span>
                  <span
                    key={rotIdx}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      whiteSpace: "nowrap",
                      color: TONE.accent,
                      opacity: animState === "in" ? 1 : 0,
                      transform:
                        animState === "in"
                          ? "translateY(0)"
                          : "translateY(-4px)",
                      transition:
                        "opacity 220ms ease, transform 220ms cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {ROTATING[rotIdx]}
                  </span>
                </span>
              </span>
            </span>
          </h1>

          <p
            className="mt-6 mx-auto max-w-[640px] text-[15px] md:text-[16px] leading-[1.85]"
            style={{
              color: TONE.textSecondary,
              animation: "fadeInUp 0.8s ease 0.45s both",
              wordBreak: "keep-all",
            }}
          >
            정부 사업·창업 경진대회의 1차 평가를 AI가 대신합니다. 동일 제안서를
            5회 실행해 평균과 표준편차로 점수를 산출하고, 분산이 큰 항목은{" "}
            <span style={{ color: TONE.textPrimary, fontWeight: 600 }}>
              심사위원에게 넘깁니다
            </span>
            .
          </p>

          <div
            className="flex flex-wrap items-center justify-center gap-2 mt-9"
            style={{ animation: "fadeInUp 0.8s ease 0.6s both" }}
          >
            <Link
              href="/competitions"
              className="group inline-flex items-center gap-2 px-6 h-11 text-[13.5px] font-semibold transition-colors"
              style={{
                background: TONE.accent,
                color: "#fff",
                letterSpacing: "0.02em",
              }}
            >
              데모 영상 보기
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.4}
              />
            </Link>
            <Link
              href="/competitions/new"
              className="inline-flex items-center gap-2 px-6 h-11 text-[13.5px] font-semibold transition-colors"
              style={{
                color: TONE.textPrimary,
                background: TONE.bgRaised,
                border: `1px solid ${TONE.borderStrong}`,
                letterSpacing: "0.02em",
              }}
            >
              평가표 만들어보기
            </Link>
          </div>
        </div>
      </section>

      {/* 시장 신호 */}
      <Section
        heading="한국 시장의 숙제"
        sub={
          <>
            2만 팀이 들어오면,
            <br />
            사람은 다 못 본다.
          </>
        }
      >
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            background: TONE.bgRaised,
            border: `1px solid ${TONE.border}`,
          }}
        >
          {[
            {
              num: "2만",
              unit: "건+",
              body: "한 회 창업 경진대회 지원서 규모. 사람 손으로 1차 평가하면 공정성 시비가 따라온다.",
            },
            {
              num: "5회",
              unit: "실행",
              body: "동일 제안서를 다중 실행하고 평균·표준편차로 점수의 신뢰 구간을 정량화.",
            },
            {
              num: "σ↑",
              unit: "검토",
              body: "표준편차가 임계값을 넘는 항목은 심사위원에게 자동 회부.",
            },
          ].map((s, i) => (
            <div
              key={s.body}
              className="p-8"
              style={{
                borderRight:
                  i < 2 ? `1px solid ${TONE.border}` : "none",
              }}
            >
              <div className="flex items-baseline gap-2 mb-4">
                <span
                  className="tabular-nums"
                  style={{
                    fontWeight: 700,
                    fontSize: "2.1rem",
                    letterSpacing: "-0.03em",
                    color: TONE.textPrimary,
                  }}
                >
                  {s.num}
                </span>
                <span
                  className="text-[11px] font-semibold uppercase"
                  style={{
                    color: TONE.textMuted,
                    letterSpacing: "0.16em",
                  }}
                >
                  {s.unit}
                </span>
              </div>
              <p
                className="text-[13.5px] leading-[1.8]"
                style={{ color: TONE.textSecondary, wordBreak: "keep-all" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 평가 흐름 — 사무 문서식 step 표 */}
      <Section
        heading="평가 흐름"
        sub={
          <>
            평가표를 받고,
            <br />
            점수를 돌려준다.
          </>
        }
      >
        <div
          style={{
            background: TONE.bgRaised,
            border: `1px solid ${TONE.border}`,
          }}
        >
          {[
            {
              step: "01",
              title: "주최 측이 평가표 입력",
              body: "항목명, 가중치, 채점 설명을 입력. 6축 기본 템플릿에서 출발해도 되고, 정부사업 공고에서 평가표를 옮겨 적어도 된다.",
            },
            {
              step: "02",
              title: "지원자가 제안서 제출",
              body: "주최 측이 정의한 항목에 따라 답변을 작성. AI는 주최 측이 적은 채점 기준 그대로 평가한다.",
            },
            {
              step: "03",
              title: "AI 1차 평가 + 분산 플래그",
              body: "동일 제안서를 5회 병렬 실행. 평균을 점수로, 표준편차로 변동성을 측정. 분산 큰 항목은 심사위원 검토 권고.",
            },
          ].map((it, idx) => (
            <div
              key={it.step}
              className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-x-8 gap-y-2 px-8 py-7"
              style={{
                borderTop:
                  idx > 0 ? `1px solid ${TONE.border}` : "none",
              }}
            >
              <div>
                <span
                  className="tabular-nums"
                  style={{
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    letterSpacing: "0.04em",
                    color: TONE.accent,
                  }}
                >
                  {it.step}
                </span>
              </div>
              <div>
                <h3
                  className="mb-2"
                  style={{
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    lineHeight: 1.4,
                    color: TONE.textPrimary,
                    wordBreak: "keep-all",
                  }}
                >
                  {it.title}
                </h3>
                <p
                  className="text-[13.5px] leading-[1.85] max-w-2xl"
                  style={{ color: TONE.textSecondary, wordBreak: "keep-all" }}
                >
                  {it.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 공정성 3장치 */}
      <Section
        heading="심사 절차 표준"
        sub={
          <>
            LLM의 비결정성을
            <br />
            3단계로 흡수한다.
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Lock,
              title: "결정성 고정",
              body: "temperature 0, seed 고정. 같은 입력에는 가능한 한 같은 답이 나오도록 호출 자체를 결정적으로.",
            },
            {
              icon: Repeat,
              title: "다중 실행 평균",
              body: "동일 제안서를 5회 병렬 실행. 평균을 점수로, 표준편차로 변동성을 측정.",
            },
            {
              icon: AlertTriangle,
              title: "분산 플래그",
              body: "표준편차가 임계값을 넘는 항목은 ‘검토 권고’. AI가 흔들리는 영역은 사람에게.",
            },
          ].map((s, i) => (
            <div
              key={s.title}
              className="p-7"
              style={{
                background: TONE.bgRaised,
                border: `1px solid ${TONE.border}`,
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <span
                  className="text-[10.5px] tabular-nums font-bold"
                  style={{
                    color: TONE.textMuted,
                    letterSpacing: "0.16em",
                  }}
                >
                  0{i + 1}
                </span>
                <span
                  className="flex-1 h-px"
                  style={{ background: TONE.border }}
                />
                <s.icon
                  className="w-3.5 h-3.5"
                  style={{ color: TONE.accent }}
                  strokeWidth={2}
                />
              </div>
              <h4
                className="mb-2"
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  lineHeight: 1.4,
                  color: TONE.textPrimary,
                  wordBreak: "keep-all",
                }}
              >
                {s.title}
              </h4>
              <p
                className="text-[13px] leading-[1.85]"
                style={{ color: TONE.textSecondary, wordBreak: "keep-all" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-8 px-5 py-4"
          style={{
            background: TONE.accentSoft,
            borderLeft: `3px solid ${TONE.accent}`,
          }}
        >
          <p
            className="text-[13px] leading-[1.75] max-w-2xl"
            style={{ color: TONE.textSecondary, wordBreak: "keep-all" }}
          >
            <span style={{ color: TONE.textPrimary, fontWeight: 600 }}>
              안내.
            </span>{" "}
            AI는 1차 스코어링까지만 담당합니다. 최종 심사 권한은 항상
            심사위원에게 있습니다.
          </p>
        </div>
      </Section>

      {/* 최종 CTA */}
      <section
        className="py-24 px-6 text-center"
        style={{ borderTop: `1px solid ${TONE.border}` }}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="mb-8"
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)",
              lineHeight: 1.2,
              color: TONE.textPrimary,
              letterSpacing: "-0.025em",
              wordBreak: "keep-all",
            }}
          >
            평가, 빠르게.{" "}
            <span style={{ color: TONE.textTertiary }}>
              그리고 공정하게.
            </span>
          </h2>
          <Link
            href="/competitions"
            className="group inline-flex items-center gap-2 px-7 h-12 font-semibold text-[14px] transition-colors"
            style={{
              background: TONE.accent,
              color: "#fff",
              letterSpacing: "0.02em",
            }}
          >
            데모 대회 들어가기
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          </Link>
        </div>
      </section>

      <footer
        className="py-8 px-6"
        style={{ borderTop: `1px solid ${TONE.border}` }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <Brand size="sm" color={TONE.textPrimary} />
          <p
            className="text-[11.5px]"
            style={{ color: TONE.textMuted, letterSpacing: "0.04em" }}
          >
            © 2026 Fastlane · 한국형 AI 평가 플랫폼
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── 섹션 wrapper ──────────────────────────────────────────────────
function Section({
  heading,
  sub,
  children,
}: {
  heading: string;
  sub: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="py-20 px-6"
      style={{ borderTop: `1px solid ${TONE.border}` }}
    >
      <div className="max-w-6xl mx-auto">
        <p
          className="text-[11px] font-bold uppercase mb-4"
          style={{
            color: TONE.accent,
            letterSpacing: "0.18em",
          }}
        >
          {heading}
        </p>
        <h2
          className="mb-12"
          style={{
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            lineHeight: 1.25,
            color: TONE.textPrimary,
            letterSpacing: "-0.02em",
            wordBreak: "keep-all",
          }}
        >
          {sub}
        </h2>
        {children}
      </div>
    </section>
  );
}
