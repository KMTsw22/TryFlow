"use client";

// 자체 Confirm 모달 + Provider. window.confirm() 의 drop-in 대체.
//
// 사용:
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: "출품을 삭제하시겠습니까?",
//     body: "...",
//     tone: "danger",
//     confirmLabel: "삭제",
//   });
//   if (!ok) return;
//
// 브라우저 confirm() 의 OS 스타일 단절을 없애고 EditProposalModal 과 동일한
// 디자인 톤으로 통일 — 제품 완성도 점프.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  /** 본문 설명. 여러 줄 가능. */
  body?: React.ReactNode;
  /** 위험 액션이면 "danger" — 확인 버튼이 빨간 톤. */
  tone?: "default" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmCtx);
  if (!fn)
    throw new Error("useConfirm 은 <ConfirmProvider> 하위에서만 사용 가능.");
  return fn;
}

interface OpenState {
  opts: ConfirmOptions;
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<OpenState | null>(null);
  const openRef = useRef<OpenState | null>(null);
  openRef.current = open;

  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        setOpen({ opts, resolve });
      }),
    []
  );

  const finish = useCallback((value: boolean) => {
    const current = openRef.current;
    if (!current) return;
    current.resolve(value);
    setOpen(null);
  }, []);

  // ESC 닫기.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {open && <ConfirmDialog state={open} onFinish={finish} />}
    </ConfirmCtx.Provider>
  );
}

function ConfirmDialog({
  state,
  onFinish,
}: {
  state: OpenState;
  onFinish: (value: boolean) => void;
}) {
  const { opts } = state;
  const isDanger = opts.tone === "danger";
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={() => onFinish(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--t-border-bright)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 px-6 py-4"
          style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {isDanger && (
              <AlertTriangle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "var(--signal-danger)" }}
                strokeWidth={2.4}
              />
            )}
            <h2
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                lineHeight: 1.4,
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
                wordBreak: "keep-all",
              }}
            >
              {opts.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onFinish(false)}
            aria-label="닫기"
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 transition-colors hover:bg-[color:var(--t-border-subtle)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>

        {opts.body && (
          <div
            className="px-6 py-4 text-[13px] leading-[1.7]"
            style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
          >
            {opts.body}
          </div>
        )}

        <div
          className="flex items-center justify-end gap-2 px-6 py-3"
          style={{ borderTop: "1px solid var(--t-border-subtle)" }}
        >
          <button
            type="button"
            onClick={() => onFinish(false)}
            className="px-4 h-9 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
            style={{
              border: "1px solid var(--t-border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            {opts.cancelLabel ?? "취소"}
          </button>
          <button
            type="button"
            onClick={() => onFinish(true)}
            autoFocus
            className="px-4 h-9 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110"
            style={{
              background: isDanger
                ? "var(--signal-danger)"
                : "var(--accent)",
              letterSpacing: "0.01em",
            }}
          >
            {opts.confirmLabel ?? "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
