"use client";

import { type MouseEvent } from "react";
import { Plus, Check } from "lucide-react";
import { useCompareTray, COMPARE_MAX_SLOTS } from "./CompareTrayContext";
import { useToast } from "@/components/ui/Toast";

/**
 * CompareButton — toggles an idea's presence in the global compare tray.
 *
 * Lives next to HeartButton on cards. Like HeartButton, it stops propagation
 * so it can sit safely inside <Link> cards without triggering navigation.
 *
 * Visual states:
 *   - Not in tray → outlined "+" icon, label "Compare"
 *   - In tray → filled checkmark, label "Added", accent color
 *
 * The tray itself (top fixed bar) is mounted once at the layout level — this
 * button just mutates the shared context.
 */

interface Props {
  ideaId: string;
  variant?: "icon" | "ghost";
  size?: "sm" | "md";
}

export function CompareButton({ ideaId, variant = "icon", size = "sm" }: Props) {
  const { has, toggle, isHydrated, ids } = useCompareTray();
  const toast = useToast();
  const inTray = has(ideaId);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const wasInTray = inTray;
    const wasFull = !wasInTray && ids.length >= COMPARE_MAX_SLOTS;
    toggle(ideaId);
    // Toast feedback — distinguishes simple add/remove from FIFO eviction.
    if (wasInTray) {
      toast.show({ message: "Removed from compare tray.", tone: "info" });
    } else if (wasFull) {
      toast.show({
        message: `Compare tray was full — replaced the oldest pick.`,
        tone: "info",
      });
    } else {
      const newCount = ids.length + 1;
      toast.show({
        message:
          newCount >= 2
            ? `Added — tap "Compare now" in the tray to start.`
            : `Added to compare tray. Pick ${2 - newCount} more to compare.`,
        tone: "success",
      });
    }
  }

  const iconSize = size === "md" ? "w-5 h-5" : "w-4 h-4";

  // Pre-hydration: render the same neutral state on server + client to avoid
  // SSR mismatch. Once hydrated, the button reflects the actual tray state.
  const showActive = isHydrated && inTray;

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={showActive}
        aria-label={
          showActive
            ? "Remove from compare tray"
            : ids.length >= COMPARE_MAX_SLOTS
            ? `Add to compare tray (will replace oldest of ${COMPARE_MAX_SLOTS})`
            : "Add to compare tray"
        }
        className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[0.04em] uppercase transition-opacity hover:opacity-70"
        style={{ color: showActive ? "var(--accent)" : "var(--text-tertiary)" }}
      >
        {showActive ? (
          <Check className={iconSize} strokeWidth={2.25} />
        ) : (
          <Plus className={iconSize} strokeWidth={2} />
        )}
        {showActive ? "Added" : "Compare"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={showActive}
      aria-label={
        showActive
          ? "Remove from compare tray"
          : "Add to compare tray"
      }
      className="inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-[var(--input-bg)]"
      style={{
        color: showActive ? "var(--accent)" : "var(--text-tertiary)",
        background: showActive ? "var(--accent-soft)" : "transparent",
      }}
      title={showActive ? "Added to compare" : "Add to compare"}
    >
      {showActive ? (
        <Check className={iconSize} strokeWidth={2.25} />
      ) : (
        <Plus className={iconSize} strokeWidth={2} />
      )}
    </button>
  );
}
