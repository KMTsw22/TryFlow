"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ExternalLink, TrendingUp, Users, AlertTriangle, X } from "lucide-react";

interface Experiment {
  id: string;
  slug: string;
  product_name: string;
  status: string;
  total_visitors: number;
  created_at: string;
}

interface Props {
  experiments: Experiment[];
}

function ConfirmModal({
  name,
  onConfirm,
  onCancel,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Delete project?</p>
              <p className="text-xs text-gray-500 mt-0.5">This cannot be undone.</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-5">
          <span className="font-semibold text-gray-900">{name}</span> and all its visitors,
          waitlist signups, and comments will be permanently deleted.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 text-sm font-semibold text-white bg-red-600 rounded-lg py-2 hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MyProjectsList({ experiments }: Props) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmTarget = experiments.find((e) => e.id === confirmId);

  async function handleDelete() {
    if (!confirmId) return;
    setDeleting(true);
    await fetch(`/api/experiments/${confirmId}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmId(null);
    router.refresh();
  }

  return (
    <>
      {confirmTarget && (
        <ConfirmModal
          name={confirmTarget.product_name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}

      <div className="space-y-2">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition-colors"
          >
            {/* Status dot */}
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                exp.status === "RUNNING" ? "bg-green-400 animate-pulse" : "bg-amber-400"
              }`}
            />

            {/* Name */}
            <span className="flex-1 text-sm font-semibold text-white truncate">
              {exp.product_name}
            </span>

            {/* Visitors */}
            <span className="flex items-center gap-1 text-xs text-purple-300 shrink-0">
              <Users className="w-3 h-3" />
              {exp.total_visitors.toLocaleString()}
            </span>

            {/* Community link */}
            <Link
              href={`/${exp.slug}`}
              className="shrink-0 inline-flex items-center gap-1 text-xs text-purple-200 hover:text-white transition-colors"
              title="View community page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Analytics link */}
            <Link
              href="/dashboard/analytics"
              className="shrink-0 inline-flex items-center gap-1 text-xs text-purple-200 hover:text-white transition-colors"
              title="Analytics"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </Link>

            {/* Delete button */}
            <button
              onClick={() => setConfirmId(exp.id)}
              className="shrink-0 inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200 transition-colors"
              title="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
