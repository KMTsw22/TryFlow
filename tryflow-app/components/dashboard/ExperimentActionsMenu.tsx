"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal, Trash2, ExternalLink, BarChart3,
  Link2, AlertTriangle, X, Check, Pencil,
  Pause, Play, Download, Copy,
} from "lucide-react";
import { EditExperimentModal } from "./EditExperimentModal";

interface Experiment {
  id: string;
  slug: string;
  product_name: string;
  description: string;
  category: string;
  maker_name: string;
  project_url: string;
  hero_title?: string;
  hero_subtitle?: string;
  cta_text?: string;
  pricing_slider?: { paymentType?: string; min?: number; max?: number };
  status: string;
}

interface Props {
  experiment: Experiment;
}

function ConfirmModal({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
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
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-5">
          <span className="font-semibold text-gray-900">{name}</span> and all its data will be permanently deleted.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 text-sm font-semibold text-white bg-red-600 rounded-lg py-2 hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 my-1" />;
}

export function ExperimentActionsMenu({ experiment }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/experiments/${experiment.id}`, { method: "DELETE" });
    setDeleting(false);
    setShowConfirm(false);
    router.refresh();
  }

  async function handleStatusChange(newStatus: string) {
    setOpen(false);
    setStatusLoading(true);
    await fetch(`/api/experiments/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatusLoading(false);
    router.refresh();
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${experiment.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  }

  function handleExportWaitlist() {
    window.location.href = `/api/experiments/${experiment.id}/waitlist`;
    setOpen(false);
  }

  async function handleDuplicate() {
    setOpen(false);
    await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName:  `${experiment.product_name} (Copy)`,
        description:  experiment.description,
        category:     experiment.category,
        makerName:    experiment.maker_name,
        projectUrl:   experiment.project_url,
        pricingSlider: experiment.pricing_slider,
        heroTitle:    experiment.hero_title,
        heroSubtitle: experiment.hero_subtitle,
        ctaText:      experiment.cta_text,
      }),
    });
    router.refresh();
  }

  const isRunning = experiment.status === "RUNNING";

  return (
    <>
      {showEdit && <EditExperimentModal experiment={experiment} onClose={() => setShowEdit(false)} />}
      {showConfirm && (
        <ConfirmModal
          name={experiment.product_name}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(v => !v)}
          disabled={statusLoading}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 overflow-hidden">

            {/* Edit */}
            <button onClick={() => { setShowEdit(true); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
              <Pencil className="w-3.5 h-3.5 text-gray-400" /> Edit
            </button>

            {/* Duplicate */}
            <button onClick={handleDuplicate}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
              <Copy className="w-3.5 h-3.5 text-gray-400" /> Duplicate
            </button>

            <Divider />

            {/* Status toggle: Running ↔ Paused */}
            <button
              onClick={() => handleStatusChange(isRunning ? "PAUSED" : "RUNNING")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              {isRunning
                ? <><Pause className="w-3.5 h-3.5 text-amber-500" /> Pause</>
                : <><Play className="w-3.5 h-3.5 text-green-500" /> Resume</>
              }
            </button>

            <Divider />

            {/* Links */}
            <button onClick={() => { router.push(`/${experiment.slug}`); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" /> View Community Page
            </button>

            <button onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
              {copied
                ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                : <><Link2 className="w-3.5 h-3.5 text-gray-400" /> Copy Link</>
              }
            </button>

            <button onClick={() => { router.push(`/analytics?project=${experiment.id}`); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
              <BarChart3 className="w-3.5 h-3.5 text-gray-400" /> Analytics
            </button>

            <button onClick={handleExportWaitlist}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
              <Download className="w-3.5 h-3.5 text-gray-400" /> Export Waitlist (.csv)
            </button>

            <Divider />

            {/* Delete */}
            <button onClick={() => { setShowConfirm(true); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </>
  );
}
