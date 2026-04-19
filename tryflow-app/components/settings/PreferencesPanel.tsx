"use client";

import { useState, useEffect } from "react";
import { Bell, Globe, Shield, Palette } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const PREFS_KEY = "trywepp_prefs";
const DEFAULTS = { emailNotifications: true, publicProfile: true, twoFactor: false };
type Prefs = typeof DEFAULTS;

export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const { isDark, toggle } = useTheme();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) setPrefs({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  function togglePref(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const items: {
    key: keyof Prefs;
    icon: React.ReactNode;
    label: string;
    desc: string;
    active: boolean;
    onChange: () => void;
  }[] = [
    {
      key: "emailNotifications",
      icon: <Bell className="w-4 h-4" style={{ color: "var(--accent)" }} />,
      label: "Email notifications",
      desc: "Get notified when someone comments on your idea.",
      active: prefs.emailNotifications,
      onChange: () => togglePref("emailNotifications"),
    },
    {
      key: "publicProfile",
      icon: <Globe className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />,
      label: "Public profile",
      desc: "Let your submitted ideas appear in the public feed.",
      active: prefs.publicProfile,
      onChange: () => togglePref("publicProfile"),
    },
    {
      key: "twoFactor",
      icon: <Shield className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />,
      label: "Two-factor auth",
      desc: "Add an extra layer of security to your account.",
      active: prefs.twoFactor,
      onChange: () => togglePref("twoFactor"),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Theme toggle — treated as a preference row for consistency */}
      <PreferenceRow
        icon={<Palette className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />}
        label="Appearance"
        desc={isDark ? "Currently using dark mode" : "Currently using light mode"}
        active={!isDark}
        onChange={toggle}
      />

      {items.map((it) => (
        <PreferenceRow
          key={it.key}
          icon={it.icon}
          label={it.label}
          desc={it.desc}
          active={it.active}
          onChange={it.onChange}
        />
      ))}

      {saved && (
        <p className="text-xs font-medium pt-1" style={{ color: "var(--signal-success)" }}>
          Preferences saved.
        </p>
      )}
    </div>
  );
}

function PreferenceRow({
  icon,
  label,
  desc,
  active,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="mt-0.5 w-8 h-8 flex items-center justify-center shrink-0"
          style={{ background: "var(--input-bg)" }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </p>
          <p
            className="text-xs mt-0.5 leading-relaxed"
            style={{ color: "var(--text-tertiary)" }}
          >
            {desc}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={onChange}
        className="shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors relative focus:outline-none"
        style={{
          background: active ? "var(--accent)" : "var(--t-border-bright)",
        }}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
            active ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
