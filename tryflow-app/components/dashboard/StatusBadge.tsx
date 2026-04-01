"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, ChevronDown } from "lucide-react";

const STATUS_STYLE: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  RUNNING: { label: "Running", dot: "bg-green-500", bg: "bg-green-50",  text: "text-green-700" },
  PAUSED:  { label: "Paused",  dot: "bg-amber-500", bg: "bg-amber-50",  text: "text-amber-700" },
  DRAFT:   { label: "Draft",   dot: "bg-blue-400",  bg: "bg-blue-50",   text: "text-blue-600" },
};

const ACTIONS: Record<string, { label: string; icon: React.ReactNode; next: string }[]> = {
  RUNNING: [
    { label: "Pause",  icon: <Pause className="w-3 h-3 text-amber-500" />, next: "PAUSED"  },
  ],
  PAUSED: [
    { label: "Resume", icon: <Play  className="w-3 h-3 text-green-500" />, next: "RUNNING" },
  ],
};

interface Props {
  experimentId: string;
  status: string;
}

export function StatusBadge({ experimentId, status }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleChange(next: string) {
    setOpen(false);
    setLoading(true);
    await fetch(`/api/experiments/${experimentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setCurrentStatus(next);
    setLoading(false);
    router.refresh();
  }

  const s = STATUS_STYLE[currentStatus] ?? STATUS_STYLE.DRAFT;
  const actions = ACTIONS[currentStatus] ?? [];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => actions.length > 0 && setOpen(v => !v)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${s.bg} ${s.text} ${actions.length > 0 ? "cursor-pointer hover:opacity-80" : "cursor-default"} disabled:opacity-50`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {loading ? "..." : s.label}
        {actions.length > 0 && <ChevronDown className="w-2.5 h-2.5 opacity-60" />}
      </button>

      {open && (
        <div className="absolute left-0 top-8 z-30 w-36 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 overflow-hidden">
          {actions.map(a => (
            <button
              key={a.next}
              onClick={() => handleChange(a.next)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
