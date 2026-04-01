"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save, Loader2 } from "lucide-react";

const CATEGORIES = ["SaaS", "Marketplace", "Consumer", "Dev Tools", "Health", "Education", "Social", "Other"];
const CATEGORY_EMOJI: Record<string, string> = {
  SaaS: "⚡", Marketplace: "🛒", Consumer: "📱", "Dev Tools": "🛠️",
  Health: "💚", Education: "📚", Social: "💬", Other: "🔬",
};

interface PricingSlider { paymentType?: string; min?: number; max?: number }

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
  pricing_slider?: PricingSlider;
}

interface Props {
  experiment: Experiment;
  onClose: () => void;
}

export function EditExperimentModal({ experiment, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const slider = experiment.pricing_slider ?? {};

  const [form, setForm] = useState({
    productName:      experiment.product_name,
    description:      experiment.description,
    category:         experiment.category || "Other",
    makerName:        experiment.maker_name || "",
    projectUrl:       experiment.project_url || "",
    heroTitle:        experiment.hero_title || "",
    heroSubtitle:     experiment.hero_subtitle || "",
    ctaText:          experiment.cta_text || "Join Waitlist",
    sliderPaymentType: (slider.paymentType as "one-time" | "monthly") ?? "one-time",
    sliderMin:        String(slider.min ?? ""),
    sliderMax:        String(slider.max ?? ""),
  });

  function setField(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.productName.trim()) { setError("Product name is required."); return; }
    setSaving(true);
    setError("");

    const pricingSlider = form.sliderMin && form.sliderMax
      ? { paymentType: form.sliderPaymentType, min: Number(form.sliderMin), max: Number(form.sliderMax) }
      : undefined;

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
        pricingSlider,
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
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name</label>
                <input value={form.makerName} onChange={e => setField("makerName", e.target.value)}
                  placeholder="e.g. Jane D. · CS Junior"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setField("description", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Project Link (optional)</label>
              <input value={form.projectUrl} onChange={e => setField("projectUrl", e.target.value)}
                placeholder="https://your-demo.vercel.app"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
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
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}>
                  <span>{CATEGORY_EMOJI[cat]}</span> {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Slider */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pricing</h3>
            <div className="space-y-3">
              {/* Payment type toggle */}
              <div className="flex gap-2">
                {(["one-time", "monthly"] as const).map(type => (
                  <button key={type} onClick={() => setField("sliderPaymentType", type)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      form.sliderPaymentType === type
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}>
                    {type === "one-time" ? "One-time" : "Monthly subscription"}
                  </button>
                ))}
              </div>
              {/* Min / Max */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min price ($)</label>
                  <input type="number" value={form.sliderMin} onChange={e => setField("sliderMin", e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max price ($)</label>
                  <input type="number" value={form.sliderMax} onChange={e => setField("sliderMax", e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
              <p className="text-xs text-gray-400">Leave blank to hide pricing from your landing page.</p>
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
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hero Subtitle</label>
                <input value={form.heroSubtitle} onChange={e => setField("heroSubtitle", e.target.value)}
                  placeholder="Leave blank to use description"
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CTA Button Text</label>
                <input value={form.ctaText} onChange={e => setField("ctaText", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
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
              className="inline-flex items-center gap-2 bg-teal-500 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}