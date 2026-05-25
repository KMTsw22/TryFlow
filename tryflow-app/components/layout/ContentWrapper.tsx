"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  // 결과 공개 페이지(/results) 도 사이드바 없는 페이지.
  const noSidebar = isLanding || pathname.startsWith("/results");
  const { pinned } = useSidebar();
  // pinned 면 컨텐츠를 사이드바(200px) 만큼 밀어 겹침 없음. 아니면 좁은 64px
  // (hover 시 펼쳐지면 컨텐츠 위로 overlay).
  const padLeft = noSidebar ? "" : pinned ? "pl-[200px]" : "pl-[64px]";
  return (
    <div className={`${padLeft} transition-[padding] duration-200 ease-in-out`}>
      {children}
    </div>
  );
}
