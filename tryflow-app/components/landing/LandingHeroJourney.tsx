"use client";

import { useEffect, useRef, useState } from "react";
import { FastlaneRoadMark } from "./FastlaneRoadMark";
import j from "./landingHeroJourney.module.css";

export function LandingHeroJourney() {
  const rootRef = useRef<HTMLElement>(null);
  const [laneShift, setLaneShift] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const onScroll = () => {
      const el = rootRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const scrolled = Math.min(Math.max(-top, 0), scrollable);
      const p = scrolled / scrollable;
      setLaneShift(p * 160);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduceMotion]);

  return (
    <section ref={rootRef} className={j.root} aria-label="Fastlane 소개">
      <div className={j.sticky}>
        <div className={j.stickyStage}>
        <div className={j.center}>
          <FastlaneRoadMark
            variant="onPhoto"
            size="hero"
            laneShift={reduceMotion ? 0 : laneShift}
            aria-label="Fastlane FAST LANE"
          />
        </div>
        <div className={j.bottomCopy}>
          <p className={j.tagline}>
            <span className={j.taglineMain}>1차 평가를 표준화합니다.</span>
            <span className={j.taglineSub}>같은 조건·같은 기준·같은 기록.</span>
          </p>
          <p className={j.hint}>왜 필요한지, 아래에서 짧게 짚습니다.</p>
        </div>
        </div>
      </div>
    </section>
  );
}
