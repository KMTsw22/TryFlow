"use client";

import { useEffect } from "react";

function detectDevice(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function track(experimentId: string, eventType: string, metadata: Record<string, unknown>) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ experimentId, eventType, metadata }),
  }).catch(() => {});
}

export function FullPageTracker({ experimentId }: { experimentId: string }) {
  useEffect(() => {
    // --- Voter ID & return detection ---
    let voterId = localStorage.getItem("trywepp_voter_id");
    const isReturn = !!voterId;
    if (!voterId) {
      voterId = crypto.randomUUID();
      localStorage.setItem("trywepp_voter_id", voterId);
    }

    const device = detectDevice();
    const startTime = Date.now();

    // --- Page view ---
    track(experimentId, "page_view", { voter_id: voterId, is_return: isReturn, device });

    // --- Scroll depth (25 / 50 / 75 / 100) ---
    const reached = new Set<number>();
    function onScroll() {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((window.scrollY / scrollable) * 100);
      ([25, 50, 75, 100] as const).forEach((d) => {
        if (pct >= d && !reached.has(d)) {
          reached.add(d);
          track(experimentId, "scroll_depth", { voter_id: voterId, depth: d });
        }
      });
    }

    // --- Page exit (time on page) ---
    function onExit() {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const payload = JSON.stringify({
        experimentId,
        eventType: "page_exit",
        metadata: { voter_id: voterId, duration_seconds: duration },
      });
      // sendBeacon is fire-and-forget and survives page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", onExit);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onExit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
