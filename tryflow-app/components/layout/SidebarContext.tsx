"use client";

// 사이드바 핀 상태를 ContentWrapper 와 동기화하기 위한 컨텍스트.
// Sidebar 에서 핀 토글 → ContentWrapper 의 left padding 도 같이 변경되어야
// 컨텐츠가 사이드바와 안 겹친다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "fastlane_sidebar_pinned";

interface Ctx {
  pinned: boolean;
  togglePin: () => void;
}

const SidebarCtx = createContext<Ctx | null>(null);

export function useSidebar(): Ctx {
  const v = useContext(SidebarCtx);
  if (!v) throw new Error("useSidebar 는 <SidebarProvider> 하위에서만 가능.");
  return v;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // 첫 방문은 펼침(true) default. 사용자가 pin 해제하면 localStorage 에 기억.
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "0") setPinned(false);
      else if (raw === "1") setPinned(true);
    } catch {
      /* SSR / private mode */
    }
  }, []);

  const togglePin = useCallback(() => {
    setPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* 무시 */
      }
      return next;
    });
  }, []);

  return (
    <SidebarCtx.Provider value={{ pinned, togglePin }}>
      {children}
    </SidebarCtx.Provider>
  );
}
