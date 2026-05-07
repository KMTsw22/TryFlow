"use client";

// Fastlane 랜딩 — 공문 형식(번호·□/○) + 큰 본문 + 포스트잇

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, Cpu, FileText } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { LandingTopNav } from "@/components/landing/LandingTopNav";
import { ScrollFolder } from "@/components/landing/ScrollFolder";
import folder from "@/components/landing/scrollFolder.module.css";
import g from "./gongmun.module.css";

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

function todayGongmun(): string {
  const d = new Date();
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

/** 2절 표 — 주요 수치 요약(사무·공문 표 형식) */
const STAT_TABLE_ROWS = [
  {
    item: "지원서 규모",
    summary: "2만 건+",
    detail:
      "단일 행사 기준 지원서 규모. 인력만으로 1차 평가 시 공정성·일관성 이견이 나기 쉽다.",
  },
  {
    item: "다중 실행",
    summary: "5회 실행",
    detail:
      "동일 제안서를 다중 실행하고 평균·표준편차로 신뢰 구간을 정량화한다.",
  },
  {
    item: "분산·회부",
    summary: "σ↑ 검토",
    detail:
      "표준편차가 임계값을 넘으면 심사위원 검토로 자동 회부한다.",
  },
] as const;

/** 3절 절차 — 수치는 2절 붙임 표와 중복하지 않고 참조만 */
const FLOW_STEPS = [
  {
    top: "주최 측이 평가표 입력",
    bot: "항목명·가중치·채점 설명 · 6축 템플릿·공고문 이관",
  },
  {
    top: "지원자가 제안서 제출",
    bot: "접수 규모·작성 기준은 붙임 「주요 수치 요약」 표와 같다.",
  },
  {
    top: "AI 1차 평가·분산 플래그",
    bot: "다중 실행·분산·회부는 붙임 표 기준으로 산출하며, σ가 임계를 넘으면 심사위원 검토를 권고한다.",
  },
] as const;

const TEASER_STEPS = [
  { Icon: ClipboardList, label: "평가표 입력" },
  { Icon: FileText, label: "제안서 접수" },
  { Icon: Cpu, label: "AI 1차·분산" },
] as const;

export default function HomePage() {
  const scrolled = useScrolled();

  return (
    <div className={g.page}>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 ${g.nav} ${
          scrolled ? "shadow-[0_1px_0_#ccc]" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-[52px]">
          <Brand size="md" color="#000" />
          <LandingTopNav scrolled={scrolled} />
        </div>
      </nav>

      <main className="pt-[60px] pb-16 px-3 sm:px-5">
        <article
          className={`${g.sheet} px-5 py-8 sm:px-8 sm:py-10 md:px-11 md:py-11`}
        >
          <div className={g.docHeader}>
            <header className={g.titleRule}>
              <h1 className={g.titleSerif}>
                창업경진대회 등 대규모 지원서
                <br />
                AI 1차 평가 도입 계획(안)
              </h1>
            </header>
          </div>

          <div className={`${g.meta} ${g.body}`}>
            {todayGongmun()}
            <br />
            기획 Fastlane · 담당 시스템
          </div>

          <div className={g.body}>
            <div
              className={g.nestedScreen}
              aria-label="화면 안 요약: 바깥은 디스플레이, 안쪽은 요약 창"
            >
              <p className={g.nestedScreenHint} aria-hidden="true">
                화면 속 요약
              </p>
              <div className={g.nestedScreenPanel}>
                <section className={g.winTeaser} aria-label="시범 운영 요약">
                  <div className={g.winTitlebar}>
                    <span className={g.winTraffic} aria-hidden="true">
                      <span className={g.winDot} />
                      <span className={g.winDot} />
                      <span className={g.winDot} />
                    </span>
                    <span className={g.winTitleLabel}>시범_운영_개요.txt</span>
                  </div>
                  <p className={g.teaserLead}>
                    대규모 지원서 1차 구간에{" "}
                    <span className={g.emphBlue}>다회 실행·분산 지표</span>를
                    두어 공정성 논의를 줄이고, 부담이 큰 항목만 심사위원 검토로
                    넘긴다.
                  </p>
                  <div className={g.teaserGrid}>
                    {TEASER_STEPS.map(({ Icon, label }) => (
                      <div key={label} className={g.teaserItem}>
                        <span className={g.teaserIconWrap}>
                          <Icon aria-hidden strokeWidth={1.75} />
                        </span>
                        <span className={g.teaserItemLabel}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className={g.teaserCaution}>
                    <span className={g.cautionLead}>※ 유의</span>
                    {": AI는 "}
                    <span className={g.emphRed}>1차 스코어링까지만</span>
                    {" 담당한다. 최종 심사 권한은 심사위원에게 있다."}
                  </p>
                </section>
              </div>
            </div>

            <p className={`${folder.stackIntro} ${g.body}`}>
              아래는 번호 폴더 순서다. 스크롤로 각 폴더가 화면에 들어오면 안쪽
              설명이 펼쳐진다.
            </p>

            <ScrollFolder number={1} title="목적">
              <ul className={`${g.listPlain} ${g.listSquare} ${g.listScan}`}>
                <li>
                  적용 대상:{" "}
                  <span className={g.emphBlue}>
                    대량 서류가 유입되는 1차 검토 구간
                  </span>
                </li>
                <li>핵심 문제: 업무 과중, 평가 편차, 공정성 이견.</li>
                <li>
                  해결 방식:{" "}
                  <span className={g.emphBlue}>다회 실행·평균·표준편차</span>{" "}
                  기반 정량화.
                </li>
                <li>운영 원칙: 분산 큰 항목만 심사위원 검토로 회부.</li>
              </ul>
            </ScrollFolder>

            <ScrollFolder number={2} title="현황 및 과제">
              <p className={g.docIntroLine}>
                붙임 표는 시범 기준 수치·과제 요약이며, 운영 판단용 기준선으로
                쓴다.
              </p>
              <p className={g.statTableLead}>○ 붙임 · 주요 수치 요약</p>
              <table className={`${g.table} ${g.statTable}`}>
                <caption className={g.srOnly}>
                  시범 기준 주요 수치 요약. 항목, 요약 지표, 설명 열로 구성.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">항목</th>
                    <th scope="col">요약 지표</th>
                    <th scope="col">설명</th>
                  </tr>
                </thead>
                <tbody>
                  {STAT_TABLE_ROWS.map((row) => (
                    <tr key={row.item}>
                      <th scope="row">{row.item}</th>
                      <td className={g.statTableMetric}>{row.summary}</td>
                      <td>{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollFolder>

            <ScrollFolder number={3} title="처리 절차">
              <p className={g.flowIntro}>
                <span className={g.flowIntroMark}>○</span> 처리 절차{" "}
                <span className={g.flowIntroNote}>
                  ※ 화면·세부 일정은 시범 운영에 따라 조정될 수 있다.
                </span>
              </p>
              <div className={g.flowScrollOuter}>
                <p className={g.flowScrollHint} aria-hidden="true">
                  좌우로 밀어 전체 절차를 확인할 수 있습니다.
                </p>
                <ol className={g.flowList} aria-label="처리 절차 단계">
                  {FLOW_STEPS.map((step, i) => (
                    <li key={step.top} className={g.flowStepSegment}>
                      {i > 0 ? (
                        <span className={g.flowArrow} aria-hidden>
                          {"=>"}
                        </span>
                      ) : null}
                      <div className={g.flowCard}>
                        <div className={g.flowCardTop}>{step.top}</div>
                        <div className={g.flowCardBot}>{step.bot}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </ScrollFolder>

            <ScrollFolder number={4} title="심사 절차 표준(안)">
              <div className={g.greenBox}>
                <strong className={g.greenBoxMark}>[참고]</strong>{" "}
                LLM 호출의 비결정성은 아래 세 가지로 절차상 흡수한다.
              </div>
              <details className={g.inlineDetails}>
                <summary className={g.inlineDetailsSummary}>
                  세부 본문 (결정성·다중 실행·분산) 펼치기
                </summary>
                <ul className={`${g.listPlain} ${g.listCircle} ${g.listScan}`}>
                  <li>
                    <strong>결정성 고정</strong> — temperature 0, seed 고정
                    등으로 동일 입력에 대해 가능한 한 동일한 출력을 유도한다.
                  </li>
                  <li>
                    <strong>다중 실행 평균</strong> — 동일 제안서를 5회 병렬
                    실행하고, 평균·표준편차로 점수와 변동성을 산출한다.
                  </li>
                  <li>
                    <strong>분산 플래그</strong> — 표준편차가 임계값을 넘는
                    항목은 「검토 권고」로 표시하고, 해당 영역은 심사위원이
                    판단한다.
                  </li>
                </ul>
              </details>
            </ScrollFolder>

            <ScrollFolder number={5} title="첨부 · 유의 · 조치 요청">
              <p className={g.caution}>
                <span className={g.cautionLead}>※ 유의</span>
                {": AI는 "}
                <span className={g.emphRed}>1차 스코어링까지만</span>
                {" 담당한다. 최종 심사 권한은 항상 심사위원에게 있다."}
              </p>

              <table className={g.table}>
                <caption className={g.srOnly}>
                  첨부 및 비고. 첨부 행, 비고 행으로 구성.
                </caption>
                <tbody>
                  <tr>
                    <th scope="row">첨부</th>
                    <td>
                      시범 서비스(데모) 및 평가표 작성 화면 — 아래 링크로
                      확인한다.
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">비고</th>
                    <td>요금·이용 문의는 요금제 페이지를 참조한다.</td>
                  </tr>
                </tbody>
              </table>

              <div className={`${g.ctaRow} ${g.body}`}>
                <h3 className={g.ctaHeading} id="action-request">
                  【조치 요청】
                </h3>
                <p className={g.ctaLead} aria-labelledby="action-request">
                  시범 화면·평가표 작성·요금제는 아래 버튼으로 바로 연다.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/competitions"
                    className={`${g.linkBtn} ${g.linkBtnPrimary}`}
                  >
                    데모·시범 보기
                  </Link>
                  <Link href="/competitions/new" className={g.linkBtn}>
                    평가표 작성(신규)
                  </Link>
                  <Link href="/pricing" className={g.linkBtn}>
                    요금제 안내
                  </Link>
                </div>
              </div>
            </ScrollFolder>
          </div>
        </article>
      </main>

      <footer className="border-t border-[#999] bg-[#ececec] py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2 text-[12px] text-[#333]">
          <Brand size="sm" color="#000" />
          <span>© 2026 Fastlane</span>
        </div>
      </footer>
    </div>
  );
}
