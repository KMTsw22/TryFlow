"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Loader2, Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["SaaS", "Marketplace", "Consumer", "Dev Tools", "Health", "Education", "Social", "Other"];
const CATEGORY_EMOJI: Record<string, string> = {
  SaaS: "⚡", Marketplace: "🛒", Consumer: "📱", "Dev Tools": "🛠️",
  Health: "💚", Education: "📚", Social: "💬", Other: "🔬",
};

interface Tier { name: string; price: string }

interface Experiment {
  id: string;
  product_name: string;
  description: string;
  category: string;
  maker_name: string;
  project_url: string;
  hero_title?: string;
  hero_subtitle?: string;
  cta_text?: string;
  pricing_tiers: Tier[];
}

interface Props {
  experiment: Experiment;
  onClose: () => void;
}

export function EditExperimentModal({ experiment, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productName:  experiment.product_name,
    description:  experiment.description,
    category:     experiment.category || "Other",
    makerName:    experiment.maker_name || "",
    projectUrl:   experiment.project_url || "",
    heroTitle:    experiment.hero_title || "",
    heroSubtitle: experiment.hero_subtitle || "",
    ctaText:      experiment.cta_text || "Join Waitlist",
  });
  const [tiers, setTiers] = useState<Tier[]>(
    experiment.pricing_tiers?.length > 0
      ? experiment.pricing_tiers
      : [{ name: "Basic", price: "9" }, { name: "Pro", price: "19" }, { name: "Premium", price: "29" }]
  );

  function setField(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function updateTier(i: number, key: keyof Tier, value: string) {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [key]: value } : t));
  }

  async function handleSave() {
    if (!form.productName.trim()) { setError("Product name is required."); return; }
    setSaving(true);
    setError("");

    const res = await fetch(`/api/experiments/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName:  form.productName,
        description:  form.description,
        category:     form.category,
        makerName:    form.makerName,
        projectUrl:   form.projectUrl,
        heroTitle:    form.heroTitle || form.productName,
        heroSubtitle: form.heroSubtitle || form.description,
        ctaText:      form.ctaText,
        pricingTiers: tiers.filter(t => t.name.trim()),
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Edit Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                <input value={form.productName} onChange={e => setField("productName", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name</label>
                <input value={form.makerName} onChange={e => setField("makerName", e.target.value)}
                  placeholder="e.g. Jane D. · CS Junior"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setField("description", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Project Link (optional)</label>
              <input value={form.projectUrl} onChange={e => setField("projectUrl", e.target.value)}
                placeholder="https://your-demo.vercel.app"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>

          {/* Category */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Category</h3>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setField("category", cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    form.category === cat
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}>
                  <span>{CATEGORY_EMOJI[cat]}</span> {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing tiers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing Plans</h3>
              <button onClick={() => setTiers(p => [...p, { name: "", price: "" }])}
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700">
                <Plus className="w-3 h-3" /> Add plan
              </button>
            </div>
            <div className="space-y-2">
              {tiers.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={t.name} onChange={e => updateTier(i, "name", e.target.value)}
                    placeholder="Plan name"
                    className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input value={t.price} onChange={e => updateTier(i, "price", e.target.value)}
                      placeholder="0"
                      className="w-full h-9 pl-6 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  {tiers.length > 1 && (
                    <button onClick={() => setTiers(p => p.filter((_, idx) => idx !== i))}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Landing copy */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Landing Copy</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hero Title</label>
                <input value={form.heroTitle} onChange={e => setField("heroTitle", e.target.value)}
                  placeholder="Leave blank to use product name"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hero Subtitle</label>
                <input value={form.heroSubtitle} onChange={e => setField("heroSubtitle", e.target.value)}
                  placeholder="Leave blank to use description"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CTA Button Text</label>
                <input value={form.ctaText} onChange={e => setField("ctaText", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose}
              className="text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
