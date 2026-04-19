"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";

interface Props {
  ideaId: string;
  category: string;
  isOwner: boolean;
  /** Show "Contact submitter" for Pro viewers on other people's ideas */
  canContact: boolean;
  /** Anchor id — used so IdeaHero's "View next actions" link lands here */
  id?: string;
}

const SERIF = "'Playfair Display', serif";
const DISPLAY = "'Oswald', sans-serif";

type SecondaryAction = {
  href?: string;
  label: string;
  onClick?: () => void;
  copyLink?: boolean;
  destructive?: boolean;
};

/**
 * Editorial "What now" panel — centered pull-quote primary action + inline
 * secondary text links. Breaks the vertical rhythm of the stacked sections
 * above.
 */
export function IdeaActionDock({
  ideaId,
  category,
  isOwner,
  canContact,
  id = "next-actions",
}: Props) {
  const [confirming, setConfirming] = useState(false);

  const primary = isOwner
    ? {
        href: `/submit?from=${ideaId}`,
        headline: "Iterate on this idea.",
        desc: "Submit a new version with what you've learned. Markets reward the second-time builder.",
        cta: "Start a new draft",
      }
    : canContact
    ? {
        href: "#contact",
        headline: "Reach out to the builder.",
        desc: "You have a direct line. Use it before someone else does.",
        cta: "Contact submitter",
      }
    : {
        href: `/compare?pick=${ideaId}`,
        headline: "See how it stacks up.",
        desc: "Place this against another idea to find the sharpest angle.",
        cta: "Compare ideas",
      };

  const secondary: SecondaryAction[] = isOwner
    ? [
        { href: `/compare?pick=${ideaId}`, label: "Compare with another" },
        { href: `/explore/${encodeURIComponent(category)}`, label: `See ${category} market` },
        { label: "Archive", onClick: () => setConfirming(true), destructive: true },
      ]
    : [
        ...(canContact
          ? [{
              href: `/compare?pick=${ideaId}`,
              label: "Compare with yours",
            }]
          : []),
        { href: `/explore/${encodeURIComponent(category)}`, label: `See ${category} market` },
        { label: "Share report", copyLink: true },
      ];

  return (
    <section id={id} aria-label="Next actions for this idea" className="mb-14">
      {/* Centered pull-quote primary action */}
      <div
        className="py-16 text-center border-t border-b"
        style={{ borderColor: "var(--t-border-subtle)" }}
      >
        <p
          className="text-[15px] font-medium tracking-[0.45em] uppercase mb-6"
          style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
        >
          What now
        </p>

        <h2
          className="mb-5 max-w-2xl mx-auto leading-[1.1]"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
          }}
        >
          {primary.headline}
        </h2>

        <p
          className="mb-8 max-w-xl mx-auto text-[15px] leading-[1.7]"
          style={{ color: "var(--text-secondary)" }}
        >
          {primary.desc}
        </p>

        <Link
          href={primary.href}
          className="group inline-flex items-center gap-3 text-[14px] font-medium tracking-[0.35em] uppercase transition-opacity hover:opacity-70"
          style={{ fontFamily: DISPLAY, color: "var(--accent)" }}
        >
          {primary.cta}
          <ArrowRight
            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
            strokeWidth={1.75}
          />
        </Link>
      </div>

      {/* Secondary actions — navigation left, destructive right */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {secondary
            .filter((a) => !a.destructive)
            .map((action, i) => (
              <SecondaryLink key={i} action={action} />
            ))}
        </div>
        <div className="flex items-center gap-x-6">
          {secondary
            .filter((a) => a.destructive)
            .map((action, i) => (
              <SecondaryLink key={i} action={action} />
            ))}
        </div>
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

function SecondaryLink({ action }: { action: SecondaryAction }) {
  const [copied, setCopied] = useState(false);

  const label = copied ? "Link copied" : action.label;
  const style: React.CSSProperties = {
    fontFamily: DISPLAY,
    color: action.destructive ? "var(--signal-danger)" : "var(--text-secondary)",
  };
  const cls =
    "group inline-flex items-center gap-2 text-[14px] font-medium tracking-[0.3em] uppercase transition-opacity hover:opacity-70";

  const suffix = action.destructive ? null : (
    <ArrowRight
      className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
      strokeWidth={2}
    />
  );

  if (action.copyLink) {
    return (
      <button
        type="button"
        onClick={async () => {
          if (typeof window === "undefined") return;
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
        className={cls}
        style={style}
      >
        {label}
        {suffix}
      </button>
    );
  }
  if (action.onClick) {
    return (
      <button type="button" onClick={action.onClick} className={cls} style={style}>
        {label}
        {suffix}
      </button>
    );
  }
  return (
    <Link href={action.href ?? "#"} className={cls} style={style}>
      {label}
      {suffix}
    </Link>
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
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-8 border"
        style={{
          background: "var(--surface-1, var(--card-bg))",
          borderColor: "var(--t-border-subtle)",
        }}
      >
        <p
          className="text-[15px] font-medium tracking-[0.35em] uppercase mb-4"
          style={{ fontFamily: DISPLAY, color: "var(--signal-danger)" }}
        >
          Destructive
        </p>

        <h3
          id="archive-dialog-title"
          className="mb-3"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
          }}
        >
          Archive this idea?
        </h3>

        <p
          className="text-[14.5px] leading-[1.7] mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          This will permanently delete the submission and its insight report. This action cannot be undone.
        </p>

        {error && (
          <p
            className="text-[14px] font-medium tracking-[0.15em] uppercase mb-5"
            style={{ fontFamily: DISPLAY, color: "var(--signal-danger)" }}
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity disabled:opacity-50 hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--text-tertiary)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[0.3em] uppercase transition-opacity disabled:opacity-50 hover:opacity-70"
            style={{ fontFamily: DISPLAY, color: "var(--signal-danger)" }}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            {deleting ? "Deleting" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
