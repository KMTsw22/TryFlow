"use client";

import { useState } from "react";
import { Link2, Check, Twitter } from "lucide-react";

interface Props {
  title: string;
  description: string;
}

export function ShareButtons({ title, description }: Props) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareTwitter() {
    const text = `Check out "${title}" on try.wepp — ${description.slice(0, 80)}${description.length > 80 ? "…" : ""}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`,
      "_blank"
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 mr-1">Share:</span>
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
      >
        {copied ? <><Check className="w-3 h-3 text-green-500" /> Copied!</> : <><Link2 className="w-3 h-3" /> Copy link</>}
      </button>
      <button
        onClick={shareTwitter}
        className="inline-flex items-center gap-1.5 text-xs font-medium bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        <Twitter className="w-3 h-3" /> Post on X
      </button>
    </div>
  );
}
