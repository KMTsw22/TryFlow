"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";

interface Props {
  label: string;
  /** Whether this column is currently the active sort key */
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
  /** Optional hover tooltip (native title attr) */
  title?: string;
  className?: string;
}

/**
 * Reusable column header that toggles sort direction on click.
 * Shared across CategoryTable, IdeaTable, and any other analytical tables.
 */
export function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
  title,
  className,
}: Props) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 transition-colors select-none",
        align === "right" ? "justify-end" : "justify-start",
        active
          ? "text-[color:var(--text-primary)]"
          : "text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]",
        className,
      )}
    >
      {label}
      <Icon className="w-3 h-3 opacity-70" />
    </button>
  );
}
