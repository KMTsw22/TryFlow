"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  submittedDate: string;
}

const POLL_INTERVAL_MS = 5000;
const GIVE_UP_AFTER_MS = 60_000;

export function PendingReportView({ submittedDate }: Props) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();

    const pollId = setInterval(() => {
      const now = Date.now() - startedAt;
      setElapsed(now);
      if (now >= GIVE_UP_AFTER_MS) {
        clearInterval(pollId);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollId);
  }, [router]);

  const gaveUp = elapsed >= GIVE_UP_AFTER_MS;
  const seconds = Math.floor(elapsed / 1000);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div
        className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
        style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-ring)" }}
      >
        <span className="text-2xl animate-spin inline-block" style={{ color: "var(--accent)" }}>⟳</span>
      </div>
      <h1 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>
        {gaveUp ? "Still working on it…" : "Report is being generated"}
      </h1>
      <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
        Your idea was submitted on {submittedDate}.
      </p>
      <p className="text-xs mb-8" style={{ color: "var(--text-tertiary)" }}>
        {gaveUp
          ? "This is taking longer than usual. You can come back later — the report will be waiting on your dashboard."
          : `Auto-refreshing every ${POLL_INTERVAL_MS / 1000}s · ${seconds}s elapsed`}
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 border font-bold px-6 py-3 text-sm transition-colors"
          style={{
            borderColor: "var(--t-border-bright)",
            color: "var(--text-secondary)",
          }}
        >
          Back to dashboard
        </Link>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 text-white font-bold px-6 py-3 text-sm transition-[filter] hover:brightness-110"
          style={{ background: "var(--accent)" }}
        >
          Submit another idea →
        </Link>
      </div>
    </div>
  );
}
