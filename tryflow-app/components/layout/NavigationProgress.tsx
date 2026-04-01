"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const isFirst = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // skip on initial page load
    if (isFirst.current) { isFirst.current = false; return; }

    // start progress
    setWidth(0);
    setVisible(true);

    // animate to ~85% quickly, then finish after a short delay
    const t1 = setTimeout(() => setWidth(85), 50);
    const t2 = setTimeout(() => { setWidth(100); }, 400);
    const t3 = setTimeout(() => { setVisible(false); setWidth(0); }, 650);

    timer.current = t3;
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-teal-100">
      <div
        className="h-full bg-teal-500 rounded-r-full transition-all ease-out"
        style={{ width: `${width}%`, transitionDuration: width === 85 ? "350ms" : "200ms" }}
      />
    </div>
  );
}
