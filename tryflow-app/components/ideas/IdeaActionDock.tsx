"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitCompare,
  RefreshCw,
  LayoutDashboard,
  Share2,
  Mail,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Props {
  ideaId: string;
  category: string;
  isOwner: boolean;
  /** Show "Contact submitter" for Pro viewers on other people's ideas */
  canContact: boolean;
  /** Anchor id — used so IdeaHero's "View next actions" link lands here */
  id?: string;
}

/**
 * The primary decision layer of the report page. Renders 3-4 concrete actions
 * a user can take after reading the verdict. No generic "Explore market" — only
 * actions that move this specific idea forward.
 */
export function IdeaActionDock({
  ideaId,
  category,
  isOwner,
  canContact,
  id = "next-actions",
}: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section
      id={id}
      aria-label="Next actions for this idea"
      className="mb-6"
    >
      <div className="flex items-baseline justify-between mb-3">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Next actions
        </h2>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Decide what to do with this idea
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {isOwner ? (
          <>
            <ActionButton
              href={`/submit?from=${ideaId}`}
              icon={<RefreshCw className="w-4 h-4" />}
              label="Iterate"
              desc="Submit a new version"
              primary
            />
            <ActionButton
              href={`/compare?pick=${ideaId}`}
              icon={<GitCompare className="w-4 h-4" />}
              label="Compare"
              desc="Against another idea"
            />
            <ActionButton
              href={`/explore/${encodeURIComponent(category)}`}
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="See market"
              desc={`In ${category}`}
            />
            <ArchiveButton onClick={() => setConfirming(true)} />
          </>
        ) : (
          <>
            {canContact && (
              <ActionButton
                href="#contact"
                icon={<Mail className="w-4 h-4" />}
                label="Contact submitter"
                desc="Reach out directly"
                primary
              />
            )}
            <ActionButton
              href={`/compare?pick=${ideaId}`}
              icon={<GitCompare className="w-4 h-4" />}
              label="Compare"
              desc="With your own ideas"
            />
            <ActionButton
              href={`/explore/${encodeURIComponent(category)}`}
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="See market"
              desc={`In ${category}`}
            />
            <ActionButton
              href={`/ideas/${ideaId}`}
              icon={<Share2 className="w-4 h-4" />}
              label="Share report"
              desc="Copy link"
              shareLink
            />
          </>
        )}
      </div>

      {confirming && (
        <DeleteConfirmModal
          ideaId={ideaId}
          onClose={() => setConfirming(false)}
        />
      )}
    </section>
  );
}

function ArchiveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start text-left p-3.5 border transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      <span style={{ color: "var(--text-tertiary)" }}>
        <Trash2 className="w-4 h-4" />
      </span>
      <span
        className="mt-2 text-sm font-semibold transition-colors group-hover:text-[color:var(--signal-danger,#ef4444)]"
        style={{ color: "var(--text-primary)" }}
      >
        Archive
      </span>
      <span
        className="text-[11px] mt-0.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        Delete permanently
      </span>
    </button>
  );
}

function DeleteConfirmModal({
  ideaId,
  onClose,
}: {
  ideaId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete. Please try again.");
        setDeleting(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border p-6"
        style={{
          background: "var(--surface-1, var(--card-bg))",
          borderColor: "rgba(239, 68, 68, 0.3)",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 flex items-center justify-center shrink-0"
            style={{ background: "rgba(239, 68, 68, 0.1)" }}
          >
            <AlertTriangle
              className="w-4 h-4"
              style={{ color: "var(--signal-danger, #ef4444)" }}
            />
          </div>
          <div className="min-w-0">
            <h3
              id="archive-dialog-title"
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Archive this idea?
            </h3>
            <p
              className="text-sm mt-1 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              This will permanently delete the submission and its insight report. This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <p
            className="text-xs mb-4 font-medium"
            style={{ color: "var(--signal-danger, #ef4444)" }}
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-9 px-4 text-sm font-medium border transition-colors disabled:opacity-50 hover:bg-[color:var(--t-border-subtle)]"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--t-border-card)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:brightness-110"
            style={{ background: "var(--signal-danger, #ef4444)" }}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  icon,
  label,
  desc,
  primary = false,
  shareLink = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  primary?: boolean;
  shareLink?: boolean;
}) {
  const baseClass =
    "group flex flex-col items-start text-left p-3.5 border transition-all hover:-translate-y-0.5";

  const style: React.CSSProperties = primary
    ? {
        background: "var(--accent-soft)",
        borderColor: "var(--accent-ring)",
      }
    : {
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      };

  if (shareLink) {
    return (
      <ShareLinkButton
        baseClass={baseClass}
        style={style}
        icon={icon}
        label={label}
        desc={desc}
      />
    );
  }

  return (
    <Link href={href} className={baseClass} style={style}>
      <span
        style={{
          color: primary ? "var(--accent)" : "var(--text-tertiary)",
        }}
      >
        {icon}
      </span>
      <span
        className="mt-2 text-sm font-semibold"
        style={{
          color: primary ? "var(--accent)" : "var(--text-primary)",
        }}
      >
        {label}
      </span>
      <span
        className="text-[11px] mt-0.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        {desc}
      </span>
    </Link>
  );
}

function ShareLinkButton({
  baseClass,
  style,
  icon,
  label,
  desc,
}: {
  baseClass: string;
  style: React.CSSProperties;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <button type="button" className={baseClass} style={style} onClick={handleCopy}>
      <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>
      <span
        className="mt-2 text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {copied ? "Link copied!" : label}
      </span>
      <span
        className="text-[11px] mt-0.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        {desc}
      </span>
    </button>
  );
}
