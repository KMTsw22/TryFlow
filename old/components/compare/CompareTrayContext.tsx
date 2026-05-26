"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * CompareTrayContext — global selection state for the Compare flow.
 *
 * 2026-04 교수님 피드백 대응:
 *   "Compare 에서 뭘 비교할지 찾기 어려움" — 카드를 보면서 바로 트레이에
 *   담고, 다른 페이지를 둘러보는 동안에도 선택 상태가 유지되어야 한다.
 *
 * Behavior:
 *   - Stores up to MAX_SLOTS (3) idea IDs.
 *   - Persists to localStorage so the selection survives reloads / page navs.
 *   - When full, adding a new ID FIFO-evicts the oldest selection (matches the
 *     existing Compare page's toggle UX).
 *   - Hydration-safe: starts empty server-side, populates from localStorage on
 *     mount to avoid SSR/CSR mismatch.
 */

export const COMPARE_MAX_SLOTS = 3;
const STORAGE_KEY = "tryflow_compare_tray_v1";

interface CompareTrayValue {
  ids: string[];
  isHydrated: boolean;
  isFull: boolean;
  has: (id: string) => boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

const CompareTrayCtx = createContext<CompareTrayValue | null>(null);

export function CompareTrayProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount. Server-side renders with empty array; once
  // hydrated, we restore the persisted selection.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          setIds(parsed.slice(0, COMPARE_MAX_SLOTS));
        }
      }
    } catch {
      /* corrupt storage — start fresh */
    }
    setIsHydrated(true);
  }, []);

  // Persist on every change (only after hydration to avoid clobbering with
  // an empty array during the server-render → first-paint transition).
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* quota / private mode — fail silently */
    }
  }, [ids, isHydrated]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const add = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length >= COMPARE_MAX_SLOTS) {
        // FIFO eviction — drop oldest, append new. Preserves "click always works".
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= COMPARE_MAX_SLOTS) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<CompareTrayValue>(
    () => ({
      ids,
      isHydrated,
      isFull: ids.length >= COMPARE_MAX_SLOTS,
      has,
      add,
      remove,
      toggle,
      clear,
    }),
    [ids, isHydrated, has, add, remove, toggle, clear]
  );

  return <CompareTrayCtx.Provider value={value}>{children}</CompareTrayCtx.Provider>;
}

/**
 * Read the shared compare tray state. Falls back to safe defaults when no
 * provider is mounted (so components can be used outside the layout safely).
 */
export function useCompareTray(): CompareTrayValue {
  return (
    useContext(CompareTrayCtx) ?? {
      ids: [],
      isHydrated: false,
      isFull: false,
      has: () => false,
      add: () => {},
      remove: () => {},
      toggle: () => {},
      clear: () => {},
    }
  );
}
