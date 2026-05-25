// Fastlane AI 평가 리포트 전용 markdown 렌더러.
//
// AI 출력 스키마(prompt 가 통제):
//   ## 종합 평가          ← 한두 단락 — quote box 로 강조
//   ## 핵심 강점          ← "- **라벨** — 설명 (tag)" 형식 리스트 → success 톤 카드 그리드
//   ## 보완·리스크        ← 동일 형식 리스트 → warning 톤 카드 그리드
//
// 리스트 아이템이 "**라벨** — 본문 (tag)" 패턴이면 자동으로 label / body / tag 로
// 분해해 카드형으로 렌더. 아니면 일반 bullet 으로 fallback.
//
// 외부 라이브러리 없음 — 우리가 출력 스키마를 통제하므로 충분.
// HTML 이스케이프는 적용 (DB 의 AI 출력만 들어오지만 안전 마진).

import React from "react";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

export function MarkdownReport({
  source,
  verdictOnly = false,
}: {
  source: string;
  /**
   * true 면 verdict(종합 평가) 톤 섹션만 렌더.
   * 핵심 강점/보완 리스크/축 통찰 같은 디테일은 각 axis 의 axisMarkdown 에서
   * "심층 분석 보기" 로 접근하므로, 출품 상세 화면에서는 중복 표시 회피.
   */
  verdictOnly?: boolean;
}) {
  const blocks = parseBlocks(source.replace(/\r\n/g, "\n"));
  const allSections = groupIntoSections(blocks);
  const sections = verdictOnly
    ? allSections.filter((s) => s.tone === "verdict")
    : allSections;

  // 섹션 묶음 — 인접한 success+warning(또는 warning+success) 페어는 좌·우 row 로
  // 묶고, 그 외(verdict / neutral 등) 는 풀폭 단독 행으로. "긍정 vs 부정" 이 한
  // 화면에서 대비되도록 — 발표 임팩트의 핵심 시각화.
  type Row =
    | { kind: "single"; section: Section }
    | { kind: "pair"; left: Section; right: Section };
  const rows: Row[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const next = sections[i + 1];
    const isPair =
      next &&
      ((s.tone === "success" && next.tone === "warning") ||
        (s.tone === "warning" && next.tone === "success"));
    if (isPair) {
      // 항상 success 가 좌측, warning 이 우측으로 정렬 — 시각 일관성.
      const left = s.tone === "success" ? s : next;
      const right = s.tone === "success" ? next : s;
      rows.push({ kind: "pair", left, right });
      i++;
    } else {
      rows.push({ kind: "single", section: s });
    }
  }

  return (
    <div
      className="space-y-8"
      style={{
        fontFamily: SERIF,
        color: "var(--text-primary)",
        wordBreak: "keep-all",
      }}
    >
      {rows.map((row, i) =>
        row.kind === "single" ? (
          <SectionBlock key={i} section={row.section} layout="full" />
        ) : (
          <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionBlock section={row.left} layout="half" />
            <SectionBlock section={row.right} layout="half" />
          </div>
        )
      )}
    </div>
  );
}

// ── 데이터 모델 ─────────────────────────────────────────────

type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

interface Section {
  heading: { level: 2 | 3 | 4; text: string } | null;
  /** heading 텍스트로 추론한 톤 — 색 / 카드 변형에 사용. */
  tone: "success" | "warning" | "neutral" | "verdict";
  blocks: Block[]; // heading 제외한 본문들
}

function inferTone(text: string): Section["tone"] {
  const t = text.toLowerCase();
  if (/강점|장점|긍정|기회/.test(t)) return "success";
  if (/리스크|약점|보완|위험|취약/.test(t)) return "warning";
  if (/종합|평가|verdict|판단|요약/.test(t)) return "verdict";
  return "neutral";
}

// ── Block parsing ────────────────────────────────────────────

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

    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length as 2 | 3 | 4;
      blocks.push({ kind: "heading", level, text: h[2].trim() });
      i++;
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      // List item 멀티라인 처리:
      //   - **헤드**
      //     본문 1
      //     본문 2
      //   - 다음 헤드
      // 들여쓰기되거나 빈 줄 아닌 이어진 줄은 직전 item 의 연장으로 합침.
      // 다음 "- " 가 나오기 전까지의 모든 줄을 직전 item 본문에 흡수.
      const items: string[] = [];
      while (i < lines.length) {
        if (/^\s*-\s+/.test(lines[i])) {
          // 새 item 시작
          let item = lines[i].replace(/^\s*-\s+/, "");
          i++;
          // 다음 줄이 빈 줄이거나, 다음 "- " 시작이거나, 헤딩이 아니라면 본문 연장.
          while (
            i < lines.length &&
            lines[i].trim() &&
            !/^\s*-\s+/.test(lines[i]) &&
            !/^#{2,4}\s/.test(lines[i])
          ) {
            item += " " + lines[i].trim();
            i++;
          }
          items.push(item.trim());
          // 다음 list item 사이의 빈 줄들 skip
          while (i < lines.length && !lines[i].trim()) i++;
        } else {
          break;
        }
      }
      blocks.push({ kind: "list", items });
      continue;
    }

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

function groupIntoSections(blocks: Block[]): Section[] {
  // 가장 상위 헤딩 레벨(h2 또는 h3) 을 섹션 단위로 사용.
  // - proposal 전체 reportMd → "## 종합 평가 / 핵심 강점 / 보완·리스크" h2 사용
  // - axis 별 axisMarkdown → "### 평가 요약 / 강점 / 약점·리스크 / ..." h3 만 사용
  // 두 경우 다 같은 패턴 (강점/약점 인접 페어) 으로 다루기 위해 자동 결정.
  const headingLevels = blocks
    .filter((b): b is Extract<Block, { kind: "heading" }> => b.kind === "heading")
    .map((b) => b.level);
  const sectionLevel = headingLevels.includes(2) ? 2 : 3;

  const out: Section[] = [];
  let cur: Section | null = null;
  for (const b of blocks) {
    if (b.kind === "heading" && b.level === sectionLevel) {
      if (cur) out.push(cur);
      cur = {
        heading: { level: b.level, text: b.text },
        tone: inferTone(b.text),
        blocks: [],
      };
      continue;
    }
    if (!cur) cur = { heading: null, tone: "neutral", blocks: [] };
    cur.blocks.push(b);
  }
  if (cur) out.push(cur);
  return out;
}

// ── 인라인 마크업 ────────────────────────────────────────────

function renderInline(src: string): React.ReactNode[] {
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
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 리스트 아이템 "**라벨** — 설명 (tag)" 패턴 분해.
interface PointItem {
  label: string | null;
  body: string;
  tag: string | null;
}

function parsePoint(raw: string): PointItem {
  // 지원 패턴 (axis_analyzer / synthesizer 의 가능한 출력 모두 흡수):
  //   1) "**라벨** — 본문"   (em-dash, 가장 흔함)
  //   2) "**라벨** - 본문"   (하이픈)
  //   3) "**라벨**: 본문"    (콜론)
  //   4) "**라벨** 본문"     (공백 — 멀티라인 합치기 결과)
  // 끝에 "(tag)" 옵션 추출.
  // raw 는 parseBlocks 의 list 합치기 단계에서 이미 한 줄로 normalize 됨 — /s flag 불필요.
  const withSep = /^\*\*([^*]+)\*\*\s*[—\-:]\s*(.+)$/.exec(raw);
  const noSep = /^\*\*([^*]+)\*\*\s+(.+)$/.exec(raw);
  const match = withSep ?? noSep;
  if (!match) return { label: null, body: raw, tag: null };

  const label = match[1].trim();
  let rest = match[2].trim();

  const tagMatch = /\s*\(([^()]+)\)\s*$/.exec(rest);
  let tag: string | null = null;
  if (tagMatch) {
    tag = tagMatch[1].trim();
    rest = rest.slice(0, tagMatch.index).trim();
  }
  return { label, body: rest, tag };
}

// ── 섹션 렌더링 ─────────────────────────────────────────────

function SectionBlock({
  section,
  layout,
}: {
  section: Section;
  /** "full" 이면 풀폭 단독 row, "half" 면 좌·우 페어의 한 칸. */
  layout: "full" | "half";
}) {
  const { heading, tone, blocks } = section;

  const accentColor =
    tone === "success"
      ? "var(--signal-success)"
      : tone === "warning"
      ? "var(--signal-attention)"
      : tone === "verdict"
      ? "var(--accent)"
      : "var(--text-tertiary)";

  // 카드 컨테이너 — 모든 섹션이 자기 박스를 가짐. tone 별로:
  //   - verdict: accent-soft 배경 (인용 톤)
  //   - 그 외: surface-1 + 좌측 2px vertical accent
  const isVerdict = tone === "verdict";

  return (
    <section
      className="relative"
      style={{
        background: isVerdict ? "var(--accent-soft)" : "var(--surface-1)",
        border: `1px solid ${
          isVerdict ? "var(--accent-ring)" : "var(--t-border-subtle)"
        }`,
        padding: layout === "half" ? "1.25rem" : "1.5rem 1.75rem",
        // half 일 때 카드가 같은 row 의 다른 카드와 같은 높이여야 깔끔.
        height: layout === "half" ? "100%" : undefined,
      }}
    >
      {/* 좌측 vertical accent — verdict 가 아닌 톤만. verdict 는 배경이 자기 색. */}
      {!isVerdict && heading && (
        <span
          aria-hidden
          className="absolute left-0 top-4 bottom-4 w-[2px]"
          style={{ background: accentColor }}
        />
      )}

      <div className={isVerdict ? "" : "pl-3"}>
        {heading && (
          <h2
            className="flex items-center gap-2 mb-3"
            style={{
              fontWeight: 700,
              fontSize: layout === "half" ? "0.95rem" : "1.05rem",
              lineHeight: 1.4,
              letterSpacing: "-0.005em",
              color: "var(--text-primary)",
            }}
          >
            <span
              className="inline-flex items-center justify-center shrink-0 text-[11px] font-semibold"
              style={{
                color: accentColor,
                width: 20,
                height: 20,
                background: isVerdict ? "transparent" : "var(--surface-2)",
                border: isVerdict ? "none" : `1px solid ${accentColor}33`,
                borderRadius: 2,
              }}
              aria-hidden
            >
              {tone === "success" ? "▲" : tone === "warning" ? "▼" : tone === "verdict" ? "◆" : "•"}
            </span>
            {renderInline(heading.text)}
          </h2>
        )}

      {blocks.map((b, i) => {
        if (b.kind === "paragraph" && tone === "verdict") {
          return <VerdictParagraph key={i} text={b.text} />;
        }
        if (b.kind === "paragraph") {
          return (
            <p
              key={i}
              className="text-[13.5px] leading-[1.85] mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {renderInline(b.text)}
            </p>
          );
        }
        if (b.kind === "list") {
          const points = b.items.map(parsePoint);
          const allHaveLabel = points.every((p) => p.label !== null);
          if (allHaveLabel) {
            return (
              <PointGrid
                key={i}
                points={points}
                accentColor={accentColor}
                tone={tone}
                layout={layout}
              />
            );
          }
          return <PlainBullets key={i} items={b.items} accent={accentColor} />;
        }
        if (b.kind === "heading") {
          return (
            <h3
              key={i}
              className="mt-5 mb-2"
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--text-primary)",
              }}
            >
              {renderInline(b.text)}
            </h3>
          );
        }
        return null;
      })}
      </div>
    </section>
  );
}

// verdict 톤 paragraph — section 자체가 이미 accent box 이므로 추가 박스는 빼고
// 약간 굵은 본문 톤으로만. (이전 별도 박스 디자인은 SectionBlock wrapper 로 흡수.)
function VerdictParagraph({ text }: { text: string }) {
  return (
    <p
      className="text-[14px] leading-[1.85] mb-2"
      style={{ color: "var(--text-primary)", fontWeight: 500 }}
    >
      {renderInline(text)}
    </p>
  );
}

// 라벨 카드 그리드 — 핵심 강점 / 보완 리스크.
// layout="full" 이면 md 이상에서 2-column, "half"(좌·우 페어 안) 면 항상 1-column.
// 각 카드: 라벨(bold) + 본문 + tag chip.
function PointGrid({
  points,
  accentColor,
  tone,
  layout,
}: {
  points: PointItem[];
  accentColor: string;
  tone: Section["tone"];
  layout: "full" | "half";
}) {
  // half = 부모 칸이 이미 좁으므로 카드 세로 쌓기. full = 너른 row 에서 2열로 펼침.
  const gridClass =
    layout === "half" ? "grid grid-cols-1 gap-3 mt-1" : "grid grid-cols-1 md:grid-cols-2 gap-3 mt-1";
  return (
    <div className={gridClass}>
      {points.map((p, i) => (
        <div
          key={i}
          className="relative px-4 py-3.5"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--t-border-subtle)",
          }}
        >
          {/* 좌측 vertical accent — 카드 정체성 색 */}
          <span
            aria-hidden
            className="absolute left-0 top-3 bottom-3 w-[2px]"
            style={{ background: accentColor }}
          />
          <div className="pl-2.5">
            <p
              className="text-[13px] font-bold mb-1.5"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.005em",
              }}
            >
              {p.label}
            </p>
            <p
              className="text-[12.5px] leading-[1.7] mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {renderInline(p.body)}
            </p>
            {p.tag && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium"
                style={{
                  color: accentColor,
                }}
              >
                {tone === "success" ? "▲" : tone === "warning" ? "▼" : null}
                <span>{p.tag}</span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlainBullets({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-1.5 my-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-4 text-[13.5px] leading-[1.75]"
          style={{ color: "var(--text-secondary)" }}
        >
          <span
            aria-hidden
            className="absolute left-0 top-[0.7em] w-1.5 h-px"
            style={{ background: accent }}
          />
          {renderInline(item)}
        </li>
      ))}
    </ul>
  );
}
