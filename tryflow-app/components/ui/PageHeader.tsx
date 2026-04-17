import { cn } from "@/lib/utils";

interface Props {
  title: string;
  /** Short inline context like "5 total" or "Pro" */
  meta?: string;
  /** Longer supporting copy; 1-2 lines max */
  description?: string;
  /** Primary CTA or tab bar */
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, meta, description, action, className }: Props) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-4 mb-8",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1
            className="text-2xl font-bold tracking-tight truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
          {meta && (
            <span
              className="text-sm font-medium shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            >
              {meta}
            </span>
          )}
        </div>
        {description && (
          <p
            className="mt-1.5 text-sm max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
