"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeCtxValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  theme: "light",
  isDark: false,
  toggle: () => {},
});

// FOUC 스크립트(layout.tsx)와 같은 키를 사용해야 토글 결과가 새로고침 후에도 유지됨.
const STORAGE_KEY = "fastlane_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) || "light";
    setTheme(stored);
    if (stored === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      if (next === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return next;
    });
  };

  return (
    <ThemeCtx.Provider value={{ theme, isDark: theme === "dark", toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
