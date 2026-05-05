import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SERIF = "'Fraunces', serif";
const DISPLAY = "'Inter', sans-serif";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--page-bg)" }}
    >
      <div className="max-w-md text-center">
        <p
          className="text-[12px] font-bold tracking-[0.18em] uppercase mb-4"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          404
        </p>
        <h1
          className="mb-4"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          페이지를 찾을 수 없습니다.
        </h1>
        <p
          className="text-[15px] leading-[1.7] mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          주소가 바뀌었거나 삭제된 페이지일 수 있습니다.
        </p>
        <Link
          href="/competitions"
          className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold tracking-wider transition-all hover:brightness-110"
          style={{
            fontFamily: DISPLAY,
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          내 대회로 돌아가기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
