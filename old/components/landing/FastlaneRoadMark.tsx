"use client";

import { Chakra_Petch } from "next/font/google";
import s from "./fastlaneRoadMark.module.css";

const markFont = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

type Variant = "onPhoto" | "onPaper";

type FastlaneRoadMarkProps = {
  variant?: Variant;
  /** default · compact(다크 밴드) · hero(첫 화면) */
  size?: "default" | "compact" | "hero";
  laneShift?: number;
  className?: string;
  "aria-label"?: string;
};

export function FastlaneRoadMark({
  variant = "onPhoto",
  size = "default",
  laneShift = 0,
  className,
  "aria-label": ariaLabel = "FAST LANE",
}: FastlaneRoadMarkProps) {
  const vCls = variant === "onPhoto" ? s.onPhoto : s.onPaper;
  const sizeCls =
    size === "compact" ? s.compact : size === "hero" ? s.hero : "";

  const dy = Math.round(laneShift * 0.05);

  return (
    <div
      className={`${s.wrap} ${vCls} ${sizeCls} ${className ?? ""}`}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className={`${s.mark} ${markFont.className}`}
        style={{ transform: `translateY(${dy}px)` }}
      >
        <div className={s.col}>
          <div className={s.colPair}>
            <span className={s.pairTop} aria-hidden>
              F
            </span>
            <span className={s.pairBot} aria-hidden>
              L
            </span>
          </div>
        </div>
        <div className={`${s.col} ${s.colA}`}>
          <span className={s.letterA} aria-hidden>
            A
          </span>
        </div>
        <div className={s.col}>
          <div className={s.colPair}>
            <span className={s.pairTop} aria-hidden>
              S
            </span>
            <span className={s.pairBot} aria-hidden>
              N
            </span>
          </div>
        </div>
        <div className={s.col}>
          <div className={s.colPair}>
            <span className={s.pairTop} aria-hidden>
              T
            </span>
            <span className={s.pairBot} aria-hidden>
              E
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
