"use client";

// 운영 가이드 drawer.
//
// 2026-05-21 신설: 운영자 컨텍스트(/competitions 등)에서 "초대 방법" / "출품 접수"
// 같은 운영 매뉴얼을 페이지 이동 없이 우측 drawer 로 보여준다.
//
// 이유: 이전엔 /about 페이지로 점프했었는데, 이미 가입·운영 시작한 사용자에게
//   마케팅 톤의 소개 페이지가 다시 뜨면 컨텍스트가 단절된다. 운영 도구 안에서
//   필요한 정보만 잠깐 띄우고 닫는 패턴이 정석 (Linear / Notion / Stripe Dashboard).
//
// API:
//   <OperationGuide topic="invite" | "submission" trigger={<Button>...</Button>} />
//   topic 에 따라 drawer 내용이 다름. 두 topic 한 컴포넌트에서 처리 — 사용처
//   여러 곳에서 같은 패턴 재사용.

import { useEffect, useState, type ReactNode } from "react";
import {
  X,
  Link as LinkIcon,
  Copy,
  Users,
  Inbox,
  FileText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export type GuideTopic = "invite" | "submission";

interface Props {
  topic: GuideTopic;
  /** Drawer 를 여는 trigger 요소. 보통 <button> 또는 <a>. */
  trigger: ReactNode;
}

export function OperationGuide({ topic, trigger }: Props) {
  const [open, setOpen] = useState(false);

  // Esc 키로 닫기 + body scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={topic === "invite" ? "심사위원 초대 가이드" : "출품 접수 가이드"}
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          {/* drawer */}
          <aside
            className="relative h-full w-full sm:w-[480px] flex flex-col"
            style={{
              background: "var(--surface-1)",
              borderLeft: "1px solid var(--t-border)",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.06)",
            }}
          >
            {/* header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--t-border)" }}
            >
              <div>
                <p
                  className="text-[11px] mb-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  운영 가이드
                </p>
                <h2
                  className="text-[15px] font-semibold"
                  style={{
                    color: "var(--text-primary)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {topic === "invite" ? "심사위원 초대" : "출품 접수"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="inline-flex items-center justify-center w-8 h-8 transition-colors hover:bg-[color:var(--surface-2)]"
                style={{ color: "var(--text-tertiary)", borderRadius: 2 }}
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {topic === "invite" ? <InviteGuide /> : <SubmissionGuide />}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

// ── 심사위원 초대 가이드 ──────────────────────────────────────

function InviteGuide() {
  return (
    <div className="space-y-6">
      {/* 한 줄 요약 */}
      <p
        className="text-[13px] leading-[1.7]"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        슬랙 워크스페이스 초대와 동일. 링크를 만들고 공유하면, 받은 사람이
        로그인 후 자동으로 이 대회의 심사위원으로 등록됩니다.
      </p>

      {/* 3단계 */}
      <Steps
        items={[
          {
            n: 1,
            icon: LinkIcon,
            title: "초대 링크 생성",
            body: "대회 상세 → 심사위원 관리 → 새 링크.",
          },
          {
            n: 2,
            icon: Copy,
            title: "링크 공유",
            body: "이메일·메신저·문자 어디든 OK. 클릭 1회로 가입.",
          },
          {
            n: 3,
            icon: Users,
            title: "자동 등록 + 진척 추적",
            body: "수락한 사람이 자동으로 심사위원 목록에 추가. 매트릭스로 누가 어디까지 했는지 실시간 표시.",
          },
        ]}
      />

      {/* 받는 사람 화면 미리보기 */}
      <SubSection title="받는 사람 화면">
        <Preview>
          <div
            className="px-5 py-5 text-center"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--t-border)",
              borderRadius: 2,
            }}
          >
            <Sparkles
              className="w-6 h-6 mx-auto mb-2.5"
              style={{ color: "var(--accent)" }}
              strokeWidth={1.8}
            />
            <p
              className="text-[14px] font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              심사위원으로 초대받았어요
            </p>
            <p
              className="text-[12px] leading-[1.6] mb-3"
              style={{
                color: "var(--text-secondary)",
                wordBreak: "keep-all",
              }}
            >
              한국디자인진흥원 청년창업 공모전의 심사위원으로 가입하시겠어요?
            </p>
            <span
              className="inline-block px-3 h-8 text-[12px] font-medium leading-8"
              style={{
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 2,
              }}
            >
              로그인하고 수락
            </span>
          </div>
        </Preview>
      </SubSection>

      {/* 실무 팁 */}
      <SubSection title="실무 팁">
        <ul className="space-y-2 text-[12px]">
          <Tip>
            링크는 <strong>여러 번 재사용 가능</strong>. 다수 위원에게 같은 링크 공유 OK.
          </Tip>
          <Tip>
            만료일·사용 횟수 제한 설정 가능. 외부 유출 우려 시 활용.
          </Tip>
          <Tip>
            잘못 공유했으면 <strong>비활성화</strong> 버튼으로 즉시 차단 — 받은 사람도 더는 가입 불가.
          </Tip>
        </ul>
      </SubSection>
    </div>
  );
}

// ── 출품 접수 가이드 ──────────────────────────────────────────

function SubmissionGuide() {
  return (
    <div className="space-y-6">
      <p
        className="text-[13px] leading-[1.7]"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        참가자가 출품하는 흐름과 운영자가 출품을 받는 흐름 두 가지.
      </p>

      {/* 참가자 흐름 */}
      <SubSection title="참가자 흐름 (5단계)">
        <Steps
          items={[
            {
              n: 1,
              icon: LinkIcon,
              title: "공개 출품 링크 접속",
              body: "운영자가 공유한 출품 URL 클릭.",
            },
            {
              n: 2,
              icon: FileText,
              title: "기본 정보 입력",
              body: "팀명 · 출품 제목 · 한 줄 요약.",
            },
            {
              n: 3,
              icon: Inbox,
              title: "파일 업로드",
              body: "PDF · DOCX 등 첨부. AI 가 텍스트를 자동 추출.",
            },
            {
              n: 4,
              icon: Sparkles,
              title: "AI 1차 평가 자동 실행",
              body: "제출 즉시 3-Pass 평가가 백그라운드에서 시작. 1-2분 소요.",
            },
            {
              n: 5,
              icon: CheckCircle2,
              title: "제출 완료",
              body: "운영자 측 리더보드에 자동 등록.",
            },
          ]}
        />
      </SubSection>

      {/* 운영자 직접 접수 */}
      <SubSection title="운영자가 직접 추가하는 경우">
        <p
          className="text-[12px] leading-[1.7]"
          style={{
            color: "var(--text-secondary)",
            wordBreak: "keep-all",
          }}
        >
          대회 상세 → <strong>출품 제출</strong> 버튼으로 운영자가 직접 PDF를 업로드
          할 수도 있습니다. 다수 파일을 한 번에 올리면 배치로 평가됩니다.
        </p>
      </SubSection>

      {/* 수정 가능 여부 */}
      <SubSection title="제출 후 수정">
        <ul className="space-y-2 text-[12px]">
          <Tip>
            <strong>AI 평가 시작 전</strong>: 참가자 본인이 수정·재업로드 가능.
          </Tip>
          <Tip>
            <strong>AI 평가 완료 후</strong>: 운영자만 수정 가능 (감사 로그 보존).
          </Tip>
          <Tip>
            <strong>검토 종료 후</strong>: 수정 불가. 결과 공개 단계로 이동.
          </Tip>
        </ul>
      </SubSection>

      {/* UI preview */}
      <SubSection title="참가자가 보는 화면">
        <Preview>
          <div
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--t-border)",
              borderRadius: 2,
            }}
          >
            <div
              className="px-4 py-2 text-[11px]"
              style={{
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--t-border)",
                color: "var(--text-tertiary)",
              }}
            >
              /submit/abc-design-2026
            </div>
            <div className="px-4 py-4 space-y-3">
              <FieldRow label="팀명" value="팀 그린루프" />
              <FieldRow label="출품 제목" value="친환경 패키징 시스템" />
              <FieldRow label="첨부 파일" value="proposal.pdf · 2.3MB" />
              <div
                className="inline-block px-3 h-8 text-[12px] font-medium leading-8 mt-1"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: 2,
                }}
              >
                제출하기
              </div>
            </div>
          </div>
        </Preview>
      </SubSection>
    </div>
  );
}

// ── shared building blocks ────────────────────────────────────

function Steps({
  items,
}: {
  items: Array<{
    n: number;
    icon: typeof LinkIcon;
    title: string;
    body: string;
  }>;
}) {
  return (
    <ol
      style={{
        border: "1px solid var(--t-border)",
        borderRadius: 2,
        background: "var(--surface-1)",
      }}
    >
      {items.map((s, i) => (
        <li
          key={s.n}
          className="grid grid-cols-[36px_1fr] gap-3 px-4 py-3"
          style={{
            borderBottom:
              i === items.length - 1
                ? "none"
                : "1px solid var(--t-border-subtle)",
          }}
        >
          <span
            className="inline-flex items-center justify-center w-6 h-6 text-[11px] font-semibold tabular-nums mt-0.5"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border: "1px solid var(--accent-ring)",
              borderRadius: 2,
            }}
          >
            {s.n}
          </span>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <s.icon
                className="w-3 h-3"
                style={{ color: "var(--text-tertiary)" }}
                strokeWidth={2}
              />
              <h4
                className="text-[13px] font-semibold"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.005em",
                }}
              >
                {s.title}
              </h4>
            </div>
            <p
              className="text-[12px] leading-[1.65]"
              style={{
                color: "var(--text-secondary)",
                wordBreak: "keep-all",
              }}
            >
              {s.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p
        className="text-[11px] mb-2"
        style={{ color: "var(--text-tertiary)" }}
      >
        {title}
      </p>
      {children}
    </section>
  );
}

function Preview({ children }: { children: ReactNode }) {
  return (
    <div
      className="p-3"
      style={{
        background: "var(--surface-2)",
        border: "1px dashed var(--t-border-bright)",
        borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <li
      className="flex items-start gap-2"
      style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}
    >
      <CheckCircle2
        className="w-3.5 h-3.5 mt-0.5 shrink-0"
        style={{ color: "var(--signal-success)" }}
        strokeWidth={2.2}
      />
      <span style={{ wordBreak: "keep-all" }}>{children}</span>
    </li>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-3 text-[12px]">
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span
        className="px-2.5 py-1.5"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--t-border-subtle)",
          color: "var(--text-primary)",
          borderRadius: 2,
        }}
      >
        {value}
      </span>
    </div>
  );
}
