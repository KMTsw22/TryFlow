"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, AlertCircle, X, Info } from "lucide-react";

/**
 * Lightweight toast system — no external lib.
 *
 * 2026-04 A4 폴리시:
 *   사용자 액션(하트, Compare 추가, 등) 후 "진짜 됐나?" 의심 없애기 위한
 *   짧은 피드백. 화면 우하단에 2-3초 떴다가 사라짐.
 *
 * Usage:
 *   const { show } = useToast();
 *   show({ message: "Saved to your list", tone: "success" });
 *
 * Tones map to project signal colors (success/danger/info).
 */

type Tone = "success" | "danger" | "info";

interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastCtxValue {
  show: (input: { message: string; tone?: Tone; durationMs?: number }) => void;
}

const ToastCtx = createContext<ToastCtxValue | null>(null);

const DEFAULT_DURATION_MS = 2400;
const DISPLAY = "'Inter', sans-serif";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({
      message,
      tone = "info",
      durationMs = DEFAULT_DURATION_MS,
    }: {
      message: string;
      tone?: Tone;
      durationMs?: number;
    }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, tone }]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  // Cleanup timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastCtxValue>(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* Toast viewport — fixed bottom-right, stacks bottom-up */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 max-w-sm"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const config = TONE_CONFIG[toast.tone];
  const Icon = config.icon;

  return (
    <div
      role="status"
      className="pointer-events-auto inline-flex items-start gap-2.5 px-3.5 py-2.5 border shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200"
      style={{
        background: "var(--card-bg)",
        borderColor: config.border,
        minWidth: 240,
      }}
    >
      <Icon
        className="w-4 h-4 mt-0.5 shrink-0"
        style={{ color: config.fg }}
        strokeWidth={2.25}
      />
      <span
        className="flex-1 text-[13.5px] leading-[1.4]"
        style={{ fontFamily: DISPLAY, color: "var(--text-primary)" }}
      >
        {toast.message}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 inline-flex items-center justify-center w-4 h-4 transition-opacity hover:opacity-70 mt-0.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        <X className="w-3 h-3" strokeWidth={2.25} />
      </button>
    </div>
  );
}

const TONE_CONFIG: Record<Tone, { icon: typeof Check; fg: string; border: string }> = {
  success: {
    icon: Check,
    fg: "var(--signal-success)",
    border: "color-mix(in srgb, var(--signal-success) 35%, transparent)",
  },
  danger: {
    icon: AlertCircle,
    fg: "var(--signal-danger)",
    border: "color-mix(in srgb, var(--signal-danger) 35%, transparent)",
  },
  info: {
    icon: Info,
    fg: "var(--accent)",
    border: "var(--accent-ring)",
  },
};

/**
 * Read the toast API. Falls back to a no-op when no provider is mounted —
 * components calling `show()` outside the provider just silently do nothing
 * instead of crashing.
 */
export function useToast(): ToastCtxValue {
  return useContext(ToastCtx) ?? { show: () => {} };
}
