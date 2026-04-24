"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

/**
 * HeartButton — toggles save state for an idea via /api/ideas/[id]/save.
 *
 * Behavior:
 *   - Optimistic UI: filled heart appears instantly, reverted on API error.
 *   - Wraps `e.preventDefault()` + `e.stopPropagation()` so it can be safely
 *     placed inside `<Link>` cards without triggering navigation.
 *   - Anonymous (logged-out) clicks redirect to /login?next=<current>.
 *   - On success, calls router.refresh() so server-rendered "Saved" sections update.
 *
 * Visual:
 *   - "icon" variant — bare heart, transparent background. Default for cards.
 *   - "ghost" variant — heart + small "Save" / "Saved" label. For action docks.
 *
 * Sizes mirror the existing icon sizing convention (w-4 h-4 for cards, w-5 h-5 for hero).
 */

interface Props {
  ideaId: string;
  initialSaved?: boolean;
  /** True when no logged-in user — clicking redirects to /login. */
  isAnonymous?: boolean;
  variant?: "icon" | "ghost";
  size?: "sm" | "md";
  /** Optional aria label override for screen readers. */
  ariaLabel?: string;
}

export function HeartButton({
  ideaId,
  initialSaved = false,
  isAnonymous = false,
  variant = "icon",
  size = "sm",
  ariaLabel,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (isAnonymous) {
      toast.show({ message: "Sign in to save ideas.", tone: "info" });
      const next = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (pending) return;

    // Optimistic toggle
    const nextState = !saved;
    setSaved(nextState);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/ideas/${ideaId}/save`, {
          method: nextState ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          // Pull the actual Supabase error out of the response so we can debug.
          const body = await res.json().catch(() => ({}));
          console.error(
            `HeartButton ${nextState ? "save" : "unsave"} failed (${res.status}):`,
            body
          );
          throw new Error(body?.details || `Save toggle failed: ${res.status}`);
        }
        // Refresh server components so "Saved" sections / counts update.
        router.refresh();
        toast.show({
          message: nextState ? "Saved to your list." : "Removed from saved.",
          tone: "success",
        });
      } catch (err) {
        console.error("HeartButton toggle failed:", err);
        // Revert optimistic state on failure
        setSaved(saved);
        toast.show({
          message: nextState
            ? "Couldn't save — please try again."
            : "Couldn't remove — please try again.",
          tone: "danger",
        });
      }
    });
  }

  const iconSize = size === "md" ? "w-5 h-5" : "w-4 h-4";

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={ariaLabel ?? (saved ? "Remove from saved" : "Save idea")}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] uppercase transition-opacity hover:opacity-70 disabled:opacity-50"
        style={{ color: saved ? "#ef4444" : "var(--text-tertiary)" }}
      >
        <Heart
          className={iconSize}
          strokeWidth={1.75}
          fill={saved ? "currentColor" : "none"}
        />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  // Default: icon-only — for cards
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={ariaLabel ?? (saved ? "Remove from saved" : "Save idea")}
      disabled={pending}
      className="inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors disabled:opacity-50 hover:bg-[var(--input-bg)]"
      style={{ color: saved ? "#ef4444" : "var(--text-tertiary)" }}
    >
      <Heart
        className={iconSize}
        strokeWidth={1.75}
        fill={saved ? "currentColor" : "none"}
      />
    </button>
  );
}
