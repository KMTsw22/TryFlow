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
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap rounded-sm w-full",
        "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
      )}
    >
      {isDark
        ? <Sun className="w-4 h-4 shrink-0 text-amber-400" />
        : <Moon className="w-4 h-4 shrink-0 text-indigo-400" />
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
