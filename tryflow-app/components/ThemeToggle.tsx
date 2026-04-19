"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

interface Props {
  expanded?: boolean;
}

export function ThemeToggle({ expanded }: Props) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-3 px-3 h-9 text-sm font-medium transition-colors whitespace-nowrap rounded-sm w-full hover:bg-[color:var(--t-border-subtle)]"
      style={{ color: "var(--text-tertiary)" }}
    >
      {isDark
        ? <Sun className="w-4 h-4 shrink-0" />
        : <Moon className="w-4 h-4 shrink-0" />
      }
      <span className={cn(
        "transition-all duration-150",
        expanded ? "opacity-100 delay-75" : "opacity-0 w-0"
      )}>
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
