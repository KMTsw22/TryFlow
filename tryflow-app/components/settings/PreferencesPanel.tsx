"use client";

import { useState, useEffect } from "react";
import { Bell, Globe, Shield, Sun } from "lucide-react";
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

  const items = [
    { key: "emailNotifications" as keyof Prefs, icon: <Bell className="w-4 h-4 text-indigo-400" />, label: "Email Notifications", desc: "Get notified when someone joins your waitlist or leaves a comment." },
    { key: "publicProfile" as keyof Prefs, icon: <Globe className="w-4 h-4 text-emerald-400" />, label: "Public Profile", desc: "Allow your projects to appear in the public explore page." },
    { key: "twoFactor" as keyof Prefs, icon: <Shield className="w-4 h-4 text-violet-400" />, label: "Two-Factor Auth", desc: "Add an extra layer of security to your account." },
  ];

  return (
    <div className="space-y-4">
      {/* Theme toggle row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-8 h-8 flex items-center justify-center shrink-0"
            style={{ background: "var(--input-bg)" }}>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Appearance</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              {isDark ? "Currently using dark mode" : "Currently using light mode"}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          className={`shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors relative ${!isDark ? "bg-indigo-500" : "bg-gray-600 dark:bg-gray-700"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${!isDark ? "left-5" : "left-0.5"}`} />
        </button>
      </div>

      {items.map((pref) => (
        <div key={pref.key} className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 flex items-center justify-center shrink-0"
              style={{ background: "var(--input-bg)" }}>
              {pref.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{pref.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{pref.desc}</p>
            </div>
          </div>
          <button onClick={() => togglePref(pref.key)}
            className={`shrink-0 mt-0.5 w-10 h-5 rounded-full transition-colors relative ${prefs[pref.key] ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-700"}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs[pref.key] ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      ))}
      {saved && <p className="text-xs text-emerald-400 font-medium">Preferences saved.</p>}
    </div>
  );
}
