"use client";

import { useEffect } from "react";

export function PageViewTracker({ experimentId }: { experimentId: string }) {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experimentId, eventType: "page_view", metadata: {} }),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
