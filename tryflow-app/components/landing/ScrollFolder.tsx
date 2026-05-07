"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import s from "./scrollFolder.module.css";

type ScrollFolderProps = {
  number: number;
  title: string;
  children: ReactNode;
};

export function ScrollFolder({ number, title, children }: ScrollFolderProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const headingId = useId();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const maybeRevealFromLayout = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top < vh * 0.9 && r.bottom > 48) setRevealed(true);
    };
    maybeRevealFromLayout();

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.08, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    window.addEventListener("resize", maybeRevealFromLayout, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("resize", maybeRevealFromLayout);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={s.folder}
      aria-labelledby={headingId}
    >
      <div className={s.tabRow}>
        <h2 className={s.tab} id={headingId}>
          <span className={s.badge} aria-hidden="true">
            {number}
          </span>
          <span>{title}</span>
        </h2>
      </div>
      <div className={`${s.panel} ${revealed ? s.panelRevealed : ""}`}>
        {children}
      </div>
    </section>
  );
}
