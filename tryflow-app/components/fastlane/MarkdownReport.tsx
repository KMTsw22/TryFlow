// 미니 markdown 렌더러 — Fastlane 평가 리포트 전용.
// AI 가 출력하는 제한된 sub-set 만 처리한다 (보안 + 단순함):
//   - ## H2, ### H3, #### H4 헤딩
//   - 단락
//   - "- " 불릿 리스트 (단일 레벨)
//   - **bold**, *italic*, `inline code`
//
// 외부 라이브러리 없이 구현 — 우리가 출력 스키마를 통제하므로 충분.
// 외부 입력은 받지 않음 (DB 의 AI 출력만 렌더). 그래도 HTML 이스케이프는 적용.

import React from "react";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

export function MarkdownReport({ source }: { source: string }) {
  const blocks = parseBlocks(source.replace(/\r\n/g, "\n"));
  return (
    <div
      className="space-y-4"
      style={{
        fontFamily: SERIF,
        color: "var(--text-primary)",
        wordBreak: "keep-all",
      }}
    >
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  );
}

// ── Block parsing ────────────────────────────────────────────

type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

function parseBlocks(src: string): Block[] {
  const lines = src.split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // 헤딩.
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length as 2 | 3 | 4;
      blocks.push({ kind: "heading", level, text: h[2].trim() });
      i++;
      continue;
    }

    // 리스트 — 연속된 "- " 라인 묶음.
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    // 단락 — 빈 줄 / 헤딩 / 리스트 만날 때까지.
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{2,4}\s/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", text: paraLines.join(" ").trim() });
  }

  return blocks;
}

// ── Inline parsing ────────────────────────────────────────────

function renderInline(src: string): React.ReactNode[] {
  // 단순 토크나이저 — 이스케이프 후 정규식으로 마커 추출.
  // 정확한 markdown 명세를 따르지 않음 — 우리 prompt 가 단순한 패턴만 만들도록 강제.
  const escaped = escapeHtml(src);
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = escaped.split(pattern);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      !part.startsWith("**")
    ) {
      return (
        <em key={i} style={{ fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1 py-px text-[0.92em]"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--t-border-subtle)",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Block rendering ──────────────────────────────────────────

function renderBlock(block: Block, key: number): React.ReactNode {
  if (block.kind === "heading") {
    if (block.level === 2) {
      return (
        <h2
          key={key}
          className="mt-8 first:mt-0 mb-3 pb-2 border-b"
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            lineHeight: 1.4,
            letterSpacing: "-0.005em",
            color: "var(--text-primary)",
            borderColor: "var(--t-border-subtle)",
          }}
        >
          {renderInline(block.text)}
        </h2>
      );
    }
    if (block.level === 3) {
      return (
        <h3
          key={key}
          className="mt-5 mb-1.5"
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            lineHeight: 1.45,
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
        >
          {renderInline(block.text)}
        </h3>
      );
    }
    return (
      <h4
        key={key}
        className="mt-4 mb-1.5 text-[10.5px] font-bold uppercase"
        style={{
          color: "var(--text-tertiary)",
          letterSpacing: "0.14em",
        }}
      >
        {renderInline(block.text)}
      </h4>
    );
  }

  if (block.kind === "list") {
    return (
      <ul key={key} className="space-y-1.5 my-2">
        {block.items.map((item, i) => (
          <li
            key={i}
            className="relative pl-4 text-[13.5px] leading-[1.75]"
            style={{ color: "var(--text-secondary)" }}
          >
            <span
              aria-hidden
              className="absolute left-0 top-[0.7em] w-1.5 h-px"
              style={{ background: "var(--accent)" }}
            />
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      key={key}
      className="text-[13.5px] leading-[1.85]"
      style={{ color: "var(--text-secondary)" }}
    >
      {renderInline(block.text)}
    </p>
  );
}
