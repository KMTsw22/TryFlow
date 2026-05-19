"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/components/layout/Brand";
import { FastlaneRoadMark } from "@/components/landing/FastlaneRoadMark";
import { LandingHeroJourney } from "@/components/landing/LandingHeroJourney";
import { LandingTopNav } from "@/components/landing/LandingTopNav";
import s from "./landing.module.css";

function useScrolled(threshold = 48) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

/** 누적 절 — 레트로 데스크톱(지원자 폴더) 화면 */
const IMG_DESK = "/landing/story-desk.png";
/** 병목 절 — 파란 바탕, 지원자 폴더와 검토 알림 대화상자 */
const IMG_BOTTLENECK = "/landing/story-bottleneck-review.png";
/** 검증 절 — AI 검증기(LLM) 플로차트 일러스트 */
const IMG_AI_VERIFY_FLOW = "/landing/story-ai-validator-flow.png";

export default function HomePage() {
  const scrolled = useScrolled();

  return (
    <div className={s.landingRoot}>
      <header
        className={`${s.nav} ${scrolled ? s.navSolid : s.navTransparent}`}
      >
        <div className={s.navInner}>
          <Brand
            size="md"
            color={scrolled ? "#1c1b18" : "#ffffff"}
            className="drop-shadow-sm"
          />
          <LandingTopNav scrolled={scrolled} editorial />
        </div>
      </header>

      <LandingHeroJourney />

      <section className={s.introAfterJourney} aria-label="소개">
        <div className={s.introInner}>
          <blockquote className={s.introQuote}>
            <span className={s.introLineLoud}>
              접수가 늘수록 1차 평가에는
            </span>
            <span className={`${s.introLineLoud} ${s.introRun}`}>
              동일한 잣대가 필요합니다.
            </span>
            <span className={s.introLineQuiet}>
              Fastlane은 평가 항목을 고정된 조건으로 반복 실행합니다. 점수와
              그 근거를 함께 기록하고, 의견이 갈리는 항목만 위원에게 회부합니다.
            </span>
          </blockquote>
        </div>
      </section>

      <section
        className={`${s.section} ${s.sectionTint}`}
        aria-labelledby="archive-heading"
      >
        <div className={s.sectionInner}>
          <div className={s.split}>
            <div className={s.splitText}>
              <span className={s.kicker} id="archive-heading">
                누적
              </span>
              <p className={s.splitProse}>
                <span className={s.splitLead}>
                  쌓이는 서류는 보관이 아닙니다. 비교와 재확인이 필요한
                  검토 묶음입니다.
                </span>
                <span className={s.splitMid}>
                  인원이 늘수록 같은 항목도 읽히는 방식이 달라집니다. 그 차이를
                  증명할 기록은 어디에도 남지 않습니다.
                </span>
              </p>
            </div>
            <div className={s.splitFigure}>
              <Image
                src={IMG_DESK}
                alt="레트로 바탕화면에 지원자별 노란 폴더가 흩어져 있고, 중앙에 지원자 모음 2 폴더 더미 위로 마우스 커서가 올라가 있음"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                className={`${s.splitImg} ${s.splitImgAiFolder}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="field-heading">
        <div className={s.sectionInner}>
          <div className={`${s.split} ${s.splitReverse}`}>
            <div className={s.splitFigure}>
              <Image
                src={IMG_BOTTLENECK}
                alt="파란 레트로 바탕화면에 지원자 폴더가 가득하고, 중앙에 다른 검토자와 의견이 다르다는 검토 알림 창이 떠 있는 화면"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                className={`${s.splitImg} ${s.splitImgAiFolder}`}
              />
            </div>
            <div className={s.splitText}>
              <span className={s.kicker} id="field-heading">
                병목
              </span>
              <p className={s.splitProse}>
                <span className={s.splitLead}>
                  1차가 두꺼워질수록{" "}
                  <span className={s.proseStrong}>
                    같은 기준으로 읽었다는 근거
                  </span>
                  는 흔들립니다.
                </span>
                <span className={s.splitMid}>
                  남길 것은 감(感)이 아니라, 같은 조건으로 반복한 기록입니다.
                  AI가 스코어링과 형식 검증을 맡고, 위원은 판단할 지점만 다룹니다.
                </span>
              </p>
              <Link href="/competitions" className={s.linkMore}>
                데모 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={s.section} aria-labelledby="verify-heading">
        <div className={s.sectionInner}>
          <div className={s.split}>
            <div className={s.splitText}>
              <span className={s.kicker} id="verify-heading">
                검증
              </span>
              <p className={s.splitProse}>
                <span className={s.splitLead}>
                  AI는 인상이 아니라, 절차에 들어가는 검증기입니다.
                </span>
                <span className={s.splitMid}>
                  모델·프롬프트·실행 조건을 고정합니다.{" "}
                  <span className={s.proseStrong}>같은 출품을 같은 조건으로 5회 반복</span>
                  하고, 점수와 분산을 함께 기록합니다.
                </span>
              </p>
              <Link href="/competitions/new" className={s.linkMore}>
                평가표 작성 →
              </Link>
            </div>
            <div className={`${s.splitFigure} ${s.splitFigureFlow}`}>
              <Image
                src={IMG_AI_VERIFY_FLOW}
                alt="지원서·고정 프롬프트·실행 설정이 다회차로 AI 검증기(LLM)에 들어가 점수와 데이터 분산으로 이어지는 흐름도"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                className={`${s.splitImg} ${s.splitImgFlowchart}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${s.section} ${s.sectionTint}`}
        aria-labelledby="approach-heading"
      >
        <div className={s.sectionInner}>
          <div className={s.proseBlock}>
            <span className={s.kicker} id="approach-heading">
              절차
            </span>
            <p className={s.proseBlockLead}>
              평가표 업로드 → 1차 제출 → AI 스코어링. 분산이 임계를 넘는
              항목만 위원 검토로 회부합니다.
            </p>
            <p className={s.proseBlockFine}>
              최종 선정과 책임은 심사위원에게 있습니다. 화면·일정은
              시범 운영에 따라 달라질 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className={s.statBand} aria-label="시범 수치">
        <div className={s.statBandInner}>
          <div className={s.statGrid}>
            <div>
              <div className={s.statValue}>20,000+</div>
              <div className={s.statLabel}>단일 공모 1차 접수</div>
              <p className={s.statNote}>시범 운영을 가정한 규모입니다.</p>
            </div>
            <div>
              <div className={s.statValue}>5회</div>
              <div className={s.statLabel}>동일 조건 반복 실행</div>
              <p className={s.statNote}>같은 출품·같은 설정으로 병렬 실행합니다.</p>
            </div>
            <div>
              <div className={s.statValue}>자동</div>
              <div className={s.statLabel}>분산 임계 회부</div>
              <p className={s.statNote}>임계를 넘는 항목만 심사위원에게 회부합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={s.darkBand} aria-labelledby="fastlane-heading">
        <div className={s.darkInner}>
          <h2 className={s.darkHeading} id="fastlane-heading">
            <FastlaneRoadMark
              variant="onPhoto"
              size="compact"
              className={s.darkRoadMark}
              aria-label="Fastlane"
            />
          </h2>
          <p className={s.darkProse}>
            <span className={s.darkLead}>
              대량의 1차 서류는 책상이 아니라{" "}
              <strong className={s.darkStrong}>분리된 차선</strong>을 지나야 합니다.
            </span>
            <span className={s.darkRest}>
              LLM은 추진력이지만 스스로 멈추지 않습니다. 고정된 실행과 반복,
              분산 기록으로 묶을 때 비로소 절차가 됩니다.
            </span>
          </p>
        </div>
      </section>

      <section className={s.ctaSection} aria-labelledby="cta-heading">
        <span className={s.kicker} id="cta-heading">
          다음 단계
        </span>
        <p className={s.ctaProse}>
          <span className={s.ctaProseLoud}>절차를 직접 확인하시려면,</span>{" "}
          <span className={s.ctaProseSoft}>데모·평가표·요금제로 이동합니다.</span>
        </p>
        <div className={s.ctaRow}>
          <Link href="/competitions" className={s.ctaBtn}>
            데모 보기
          </Link>
          <Link href="/competitions/new" className={`${s.ctaBtn} ${s.ctaBtnGhost}`}>
            평가표 작성
          </Link>
          <Link href="/pricing" className={`${s.ctaBtn} ${s.ctaBtnGhost}`}>
            요금제 확인
          </Link>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.footerInner}>
          <Brand size="sm" color="#3d3a35" />
          <span>© 2026 Fastlane</span>
        </div>
      </footer>
    </div>
  );
}
