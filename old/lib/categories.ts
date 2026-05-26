export interface CategoryTheme {
  emoji: string;
  accent: string;       // base hex
  accentRgb: string;    // "r, g, b" for rgba()
  gradient: string;     // CSS gradient for banners
  softBg: string;       // low-opacity tint for card backgrounds
  borderTint: string;   // border tint
}

export const CATEGORY_THEME: Record<string, CategoryTheme> = {
  "SaaS / B2B": {
    emoji: "🧩",
    accent: "#818cf8",
    accentRgb: "129, 140, 248",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    softBg: "rgba(129, 140, 248, 0.08)",
    borderTint: "rgba(129, 140, 248, 0.25)",
  },
  "Consumer App": {
    emoji: "📱",
    accent: "#f472b6",
    accentRgb: "244, 114, 182",
    gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
    softBg: "rgba(244, 114, 182, 0.08)",
    borderTint: "rgba(244, 114, 182, 0.25)",
  },
  "Marketplace": {
    emoji: "🛒",
    accent: "#fbbf24",
    accentRgb: "251, 191, 36",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    softBg: "rgba(251, 191, 36, 0.08)",
    borderTint: "rgba(251, 191, 36, 0.25)",
  },
  "Dev Tools": {
    emoji: "⚙️",
    accent: "#22d3ee",
    accentRgb: "34, 211, 238",
    gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    softBg: "rgba(34, 211, 238, 0.08)",
    borderTint: "rgba(34, 211, 238, 0.25)",
  },
  "Health & Wellness": {
    emoji: "💊",
    accent: "#34d399",
    accentRgb: "52, 211, 153",
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
    softBg: "rgba(52, 211, 153, 0.08)",
    borderTint: "rgba(52, 211, 153, 0.25)",
  },
  "Education": {
    emoji: "📚",
    accent: "#a78bfa",
    accentRgb: "167, 139, 250",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
    softBg: "rgba(167, 139, 250, 0.08)",
    borderTint: "rgba(167, 139, 250, 0.25)",
  },
  "Fintech": {
    emoji: "💸",
    accent: "#a3e635",
    accentRgb: "163, 230, 53",
    gradient: "linear-gradient(135deg, #65a30d 0%, #a3e635 100%)",
    softBg: "rgba(163, 230, 53, 0.08)",
    borderTint: "rgba(163, 230, 53, 0.25)",
  },
  "E-commerce": {
    emoji: "🛍️",
    accent: "#fb7185",
    accentRgb: "251, 113, 133",
    gradient: "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
    softBg: "rgba(251, 113, 133, 0.08)",
    borderTint: "rgba(251, 113, 133, 0.25)",
  },
  "Hardware": {
    emoji: "🔧",
    accent: "#fb923c",
    accentRgb: "251, 146, 60",
    gradient: "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
    softBg: "rgba(251, 146, 60, 0.08)",
    borderTint: "rgba(251, 146, 60, 0.25)",
  },
};

export const DEFAULT_THEME: CategoryTheme = {
  emoji: "✦",
  accent: "#94a3b8",
  accentRgb: "148, 163, 184",
  gradient: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
  softBg: "rgba(148, 163, 184, 0.08)",
  borderTint: "rgba(148, 163, 184, 0.25)",
};

export function getCategoryTheme(category: string | null | undefined): CategoryTheme {
  if (!category) return DEFAULT_THEME;
  return CATEGORY_THEME[category] ?? DEFAULT_THEME;
}

export const CATEGORIES = [
  "SaaS / B2B",
  "Consumer App",
  "Marketplace",
  "Dev Tools",
  "Health & Wellness",
  "Education",
  "Fintech",
  "E-commerce",
  "Hardware",
];

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function scoreAccent(score: number | null | undefined): { hex: string; text: string; } {
  if (score === null || score === undefined) return { hex: "#6b7280", text: "text-gray-500" };
  if (score >= 70) return { hex: "#10b981", text: "text-emerald-400" };
  if (score >= 50) return { hex: "#f59e0b", text: "text-amber-400" };
  return { hex: "#ef4444", text: "text-red-400" };
}
