"use client";

// Fastlane 랜딩.
//
// 디자인 결정 (2026-05 senior pass):
//   - 화려한 우주 배경 제거. 절제된 다크 그라디언트 + 미세한 dot grid.
//   - hero 의 회전 단어는 fade + 위로 미는 transition (점프 X).
//   - 본문은 큰 한글 디스플레이 + 영문 라벨로 구성. Korean-first 타이포.
//   - 공정성 3장치는 카드보다 editorial column 으로 — “심사 표준” 톤.

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, Repeat, AlertTriangle } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { LandingTopNav } from "@/components/landing/LandingTopNav";

const SERIF = "'Fraunces', serif";

const ROTATING = ["공정하게.", "투명하게.", "결정 가능하게.", "검증 가능하게."];

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
      style={{
        background:
          "linear-gradient(180deg, #050816 0%, #060d1f 22%, #0a1832 45%, #0d2148 65%, #16315e 85%, #1f3d70 100%)",
      }}
    >
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid #f0f0f0" : "none",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-[64px]">
          <Brand size="md" color={scrolled ? "#0B1026" : "white"} />
          <LandingTopNav scrolled={scrolled} />
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 pt-28 pb-24 overflow-hidden"
      >
        {/* dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* 한 점 글로우 */}
        <div
          aria-hidden
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* trust pill */}
          <div
            className="inline-flex items-center gap-2 mb-9 px-3.5 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              animation: "fadeInUp 0.6s ease both",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span
              className="text-[11.5px] font-medium"
              style={{
                color: "rgba(255,255,255,0.78)",
                letterSpacing: "0.16em",
              }}
            >
              AI 1차 평가 · 인간 최종 심사
            </span>
          </div>

          {/* H1 — Korean display. */}
          <h1
            className="ko-display"
            style={{
              fontFamily: SERIF,
              fontWeight: 800,
              fontSize: "clamp(2.4rem, 5.6vw, 5rem)",
              lineHeight: 1.08,
              color: "#fff",
              letterSpacing: "-0.02em",
              textShadow: "0 1px 30px rgba(0,0,0,0.3)",
            }}
          >
            <span className="block" style={{ animation: "fadeInUp 0.8s ease 0.1s both" }}>
              2만 건의 지원서를
            </span>
            <span
              className="block"
              style={{ animation: "fadeInUp 0.8s ease 0.25s both" }}
            >
              AI 가{" "}
              <span
                style={{
                  display: "inline-block",
                  minWidth: "9.2em",
                  textAlign: "left",
                  background: "linear-gradient(135deg, #818cf8, #c4b5fd)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  opacity: animState === "in" ? 1 : 0,
                  transform:
                    animState === "in" ? "translateY(0)" : "translateY(-6px)",
                  transition:
                    "opacity 240ms ease, transform 240ms cubic-bezier(0.4,0,0.2,1)",
                }}
                key={rotIdx}
              >
                {ROTATING[rotIdx]}
              </span>
            </span>
          </h1>

          <p
            className="mt-8 mx-auto max-w-[620px] text-[16px] md:text-[17px] leading-[1.8]"
            style={{
              color: "rgba(255,255,255,0.7)",
              animation: "fadeInUp 0.8s ease 0.45s both",
            }}
          >
            정부 사업·창업 경진대회의 1차 평가를 AI 가 대신합니다. 동일 제안서를
            5회 실행해 평균과 표준편차로 점수를 산출하고, 분산이 큰 항목은{" "}
            <span style={{ color: "#fff", fontWeight: 600 }}>
              인간 심사위원에게 넘깁니다
            </span>
            .
          </p>

          <div
            className="flex flex-wrap items-center justify-center gap-3 mt-10"
            style={{ animation: "fadeInUp 0.8s ease 0.6s both" }}
          >
            <Link
              href="/competitions"
              className="group inline-flex items-center gap-2 px-7 h-12 text-[14px] font-bold transition-all hover:-translate-y-0.5"
              style={{
                background: "#fff",
                color: "#050816",
                letterSpacing: "0.04em",
              }}
            >
              데모 시연 보기
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/competitions/new"
              className="inline-flex items-center gap-2 px-7 h-12 text-[14px] font-medium transition-colors hover:bg-white/5"
              style={{
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.18)",
                letterSpacing: "0.04em",
              }}
            >
              평가표 만들어보기
            </Link>
          </div>
        </div>
      </section>

      {/* 시장 신호 */}
      <Section heading="한국 시장의 숙제" sub={<>2만 팀이 들어오면,<br />사람은 다 못 본다.</>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.08)" }}>
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
              body: "표준편차가 임계값을 넘는 항목은 인간 심사위원에게 자동 회부.",
            },
          ].map((s) => (
            <div
              key={s.body}
              className="p-9"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-baseline gap-2 mb-4">
                <span
                  className="num-display tabular-nums"
                  style={{
                    fontWeight: 800,
                    fontSize: "2.4rem",
                    letterSpacing: "-0.04em",
                    color: "#fff",
                  }}
                >
                  {s.num}
                </span>
                <span
                  className="text-[12px] uppercase font-medium"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.16em",
                  }}
                >
                  {s.unit}
                </span>
              </div>
              <p
                className="text-[14px] leading-[1.75]"
                style={{ color: "rgba(255,255,255,0.62)" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 흐름 3단계 */}
      <Section heading="평가 흐름" sub={<>평가표를 받고,<br />점수를 돌려준다.</>}>
        <div className="space-y-px" style={{ background: "rgba(255,255,255,0.08)" }}>
          {[
            {
              step: "01",
              title: "주최 측이 평가표 입력",
              body: "항목명, 가중치, 채점 설명을 입력. 6축 기본 템플릿에서 출발해도 되고, 정부사업 공고에서 평가표를 옮겨 적어도 된다.",
            },
            {
              step: "02",
              title: "지원자가 제안서 제출",
              body: "주최 측이 정의한 항목에 따라 답변을 작성. AI 는 주최 측이 적은 채점 기준 그대로 평가한다.",
            },
            {
              step: "03",
              title: "AI 1차 평가 + 분산 플래그",
              body: "동일 제안서를 5회 병렬 실행. 평균을 점수로, 표준편차로 변동성을 측정. 분산 큰 항목은 인간 검토 권고.",
            },
          ].map((it) => (
            <div
              key={it.step}
              className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-x-10 gap-y-3 px-9 py-9"
              style={{ background: "#050816" }}
            >
              <div>
                <span
                  className="num-display tabular-nums"
                  style={{
                    fontWeight: 800,
                    fontSize: "1.8rem",
                    letterSpacing: "-0.03em",
                    color: "rgba(255,255,255,0.32)",
                  }}
                >
                  {it.step}
                </span>
              </div>
              <div>
                <h3
                  className="ko-display mb-3"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 800,
                    fontSize: "1.6rem",
                    lineHeight: 1.2,
                    color: "#fff",
                  }}
                >
                  {it.title}
                </h3>
                <p
                  className="text-[14.5px] leading-[1.85] max-w-2xl"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {it.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 공정성 3장치 */}
      <Section heading="심사 절차 표준" sub={<>LLM 의 비결정성을<br />3단계로 흡수한다.</>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              body: "표준편차가 임계값을 넘는 항목은 ‘검토 권고’. AI 가 흔들리는 영역은 사람에게.",
            },
          ].map((s, i) => (
            <div
              key={s.title}
              className="p-7"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <span
                  className="text-[10.5px] tabular-nums font-bold"
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.16em",
                  }}
                >
                  0{i + 1}
                </span>
                <span className="flex-1 h-px bg-white/10" />
                <s.icon
                  className="w-3.5 h-3.5"
                  style={{ color: "#a5b4fc" }}
                  strokeWidth={2}
                />
              </div>
              <h4
                className="ko-display mb-2.5"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  lineHeight: 1.25,
                  color: "#fff",
                }}
              >
                {s.title}
              </h4>
              <p
                className="text-[13.5px] leading-[1.8]"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <p
          className="mt-10 text-[13.5px] leading-[1.85] max-w-xl"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          AI 는 1차 스코어링까지만 담당합니다. 최종 심사 권한은 항상 인간 심사위원에게 있습니다.
        </p>
      </Section>

      {/* 최종 CTA */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2
            className="ko-display mb-10"
            style={{
              fontFamily: SERIF,
              fontWeight: 800,
              fontSize: "clamp(2.6rem, 5.2vw, 4.5rem)",
              lineHeight: 1.0,
              color: "#fff",
              letterSpacing: "-0.025em",
            }}
          >
            평가, 빠르게.<br />
            <span style={{ color: "rgba(255,255,255,0.45)" }}>
              그리고 공정하게.
            </span>
          </h2>
          <Link
            href="/competitions"
            className="group inline-flex items-center gap-3 px-9 h-14 font-bold text-[14px] transition-all hover:-translate-y-0.5"
            style={{
              background: "#fff",
              color: "#050816",
              letterSpacing: "0.04em",
            }}
          >
            데모 대회 들어가기
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer
        className="py-10 px-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Brand size="md" color="white" />
          <p
            className="text-[11.5px]"
            style={{ color: "rgba(255,255,255,0.32)", letterSpacing: "0.04em" }}
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
      className="py-28 px-6"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-6xl mx-auto">
        <p
          className="text-[11.5px] font-bold uppercase mb-5"
          style={{
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.16em",
          }}
        >
          {heading}
        </p>
        <h2
          className="ko-display mb-14"
          style={{
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: "clamp(2.4rem, 4.6vw, 3.6rem)",
            lineHeight: 1.05,
            color: "#fff",
            letterSpacing: "-0.025em",
          }}
        >
          {sub}
        </h2>
        {children}
      </div>
    </section>
  );
}
