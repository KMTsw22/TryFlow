"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, X, GitCompare } from "lucide-react";
import { useCompareTray, COMPARE_MAX_SLOTS } from "./CompareTrayContext";
import { createClient } from "@/lib/supabase/client";

/**
 * CompareTray — fixed top bar that surfaces the compare tray across all pages.
 *
 * 2026-04 교수님 피드백 대응:
 *   "Compare 에서 뭘 비교할지 찾기 어려움" — 카드 둘러보면서 트레이가 항상
 *   화면 상단에 떠 있어 "지금 몇 개 골랐고 비교 가능한가" 가 한눈에 보인다.
 *
 * Render rules:
 *   - Hidden until at least 1 idea is selected (no chrome noise when empty).
 *   - Hidden on the /compare page itself (the page renders its own selection UI).
 *   - Sticky at top, below any page nav (top: 64px to clear the navbar).
 *   - "Compare Now" only enabled at ≥2 selections (MIN_SLOTS).
 */

const DISPLAY = "'Inter', sans-serif";
const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";
const MIN_SLOTS = 2;

interface IdeaPreview {
  id: string;
  category: string;
  target_user: string;
}

const SLOT_ACCENTS = ["#818cf8", "#34d399", "#f59e0b"] as const;
const SLOT_LETTERS = ["A", "B", "C"] as const;

export function CompareTray() {
  const { ids, isHydrated, remove, clear } = useCompareTray();
  const router = useRouter();
  const pathname = usePathname();
  const [previews, setPreviews] = useState<Record<string, IdeaPreview>>({});
  /** 최신 previews — effect 의존성에 넣지 않고 missing 계산만 할 때 사용 (무한 루프 방지). */
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  // Fetch lightweight previews for selected ideas. Only fields we need to
  // render the chip (category + target_user). One round-trip per id change.
  //
  // 주의: `previews`를 effect deps에 넣으면, DB가 빈 배열을 주거나(RLS/삭제된 ID)
  // 일부 id만 반환될 때 missing이 영원히 비지 않아 setState가 무한 반복될 수 있음.
  useEffect(() => {
    if (!isHydrated || ids.length === 0) return;
    const missing = ids.filter((id) => !previewsRef.current[id]);
    if (missing.length === 0) return;

    let cancelled = false;

    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("idea_submissions")
          .select("id, category, target_user")
          .in("id", missing);
        if (cancelled) return;
        setPreviews((prev) => {
          const next = { ...prev };
          for (const row of data ?? []) {
            if (typeof row.id === "string") {
              next[row.id] = {
                id: row.id,
                category: (row.category as string) ?? "",
                target_user: (row.target_user as string) ?? "",
              };
            }
          }
          // 요청한 id 중 응답에 없는 것: 더 이상 refetch 하지 않도록 스텁으로 채움
          for (const id of missing) {
            if (!next[id]) {
              next[id] = {
                id,
                category: "",
                target_user: "정보를 불러올 수 없음",
              };
            }
          }
          return next;
        });
      } catch {
        if (cancelled) return;
        setPreviews((prev) => {
          const next = { ...prev };
          for (const id of missing) {
            if (!next[id]) {
              next[id] = {
                id,
                category: "",
                target_user: "정보를 불러올 수 없음",
              };
            }
          }
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ids, isHydrated]);

  // Don't render server-side or pre-hydration to avoid hydration mismatch
  // (the empty default differs from the real localStorage state).
  if (!isHydrated) return null;
  if (ids.length === 0) return null;
  // The compare page renders its own picker UI — tray would be redundant noise.
  if (pathname?.startsWith("/compare")) return null;

  const canCompare = ids.length >= MIN_SLOTS;

  function handleCompareNow() {
    // Pass the current selection via query params so the compare page picks it
    // up immediately. localStorage is the source of truth, but URL params let
    // us share a comparison link with someone else.
    const params = new URLSearchParams();
    ids.forEach((id, i) => params.append("pick", id));
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div
      role="region"
      aria-label="Compare tray"
      className="sticky top-[64px] z-40 border-b backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--accent-soft) 88%, transparent)",
        borderColor: "var(--accent-ring)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <GitCompare
            className="w-4 h-4"
            style={{ color: "var(--accent)" }}
            strokeWidth={2}
          />
          <span
            className="text-[12px] font-semibold tracking-[0.08em] uppercase"
            style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
          >
            Compare tray
          </span>
          <span
            className="text-[11px] tabular-nums"
            style={{ color: "var(--text-tertiary)" }}
          >
            {ids.length} / {COMPARE_MAX_SLOTS}
          </span>
        </div>

        {/* Selected chips — scrollable on overflow */}
        <ul className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
          {ids.map((id, i) => {
            const preview = previews[id];
            const accent = SLOT_ACCENTS[i] ?? SLOT_ACCENTS[0];
            const letter = SLOT_LETTERS[i] ?? "?";
            return (
              <li
                key={id}
                className="inline-flex items-center gap-2 px-2.5 py-1 border shrink-0 max-w-[260px]"
                style={{
                  background: "var(--card-bg)",
                  borderColor: "var(--t-border-card)",
                }}
              >
                <span
                  className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: accent }}
                  aria-hidden
                >
                  {letter}
                </span>
                <span
                  className="text-[12.5px] leading-tight truncate"
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                  title={preview?.target_user}
                >
                  {preview ? `For ${preview.target_user}` : "Loading…"}
                </span>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${preview?.target_user ?? "this idea"} from compare tray`}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 transition-opacity hover:opacity-70 shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X className="w-3 h-3" strokeWidth={2.25} />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clear}
            className="text-[11px] font-medium tracking-[0.04em] uppercase transition-opacity hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Clear
          </button>
          {canCompare ? (
            <button
              type="button"
              onClick={handleCompareNow}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-bold tracking-[0.08em] uppercase text-white transition-[filter] hover:brightness-110"
              style={{ fontFamily: DISPLAY, background: "var(--accent)" }}
            >
              Compare now
              <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
            </button>
          ) : (
            <span
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Add 1 more to compare
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
