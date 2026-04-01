"use client";

import { ExternalLink } from "lucide-react";

interface Props {
  href: string;
  productName: string;
  experimentId: string;
}

export function TryItButton({ href, productName, experimentId }: Props) {
  function handleClick() {
    const voterId = localStorage.getItem("trywepp_voter_id") ?? "anonymous";
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId,
        eventType: "try_it_click",
        metadata: { voter_id: voterId },
      }),
    }).catch(() => {});
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center gap-2 mt-5 bg-white text-gray-900 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
    >
      <ExternalLink className="w-4 h-4" />
      Try {productName}
    </a>
  );
}
