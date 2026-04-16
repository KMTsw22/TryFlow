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
        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <span className="text-2xl animate-spin inline-block text-indigo-400">⟳</span>
      </div>
      <h1 className="text-xl font-extrabold text-white mb-2">
        {gaveUp ? "Still working on it…" : "Report is being generated"}
      </h1>
      <p className="text-sm text-gray-400 mb-2">
        Your idea was submitted on {submittedDate}.
      </p>
      <p className="text-xs text-gray-500 mb-8">
        {gaveUp
          ? "This is taking longer than usual. You can come back later — the report will be waiting on your dashboard."
          : `Auto-refreshing every ${POLL_INTERVAL_MS / 1000}s · ${seconds}s elapsed`}
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 border border-gray-600 text-gray-300 font-bold px-6 py-3 text-sm hover:border-gray-400 hover:text-white transition-colors"
        >
          Back to dashboard
        </Link>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold px-6 py-3 text-sm hover:bg-indigo-400 transition-colors"
        >
          Submit another idea →
        </Link>
      </div>
    </div>
  );
}
