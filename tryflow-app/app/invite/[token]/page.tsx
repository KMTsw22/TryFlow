"use client";

// /invite/[token] — 초대 링크 수락 페이지
//
// 슬랙 워크스페이스 가입 화면 톤. 받은 사람이 link 클릭 → 이 페이지 도착 →
// 로그인 (필요하면) → 이름/소속 입력 (선택) → "수락" → 자동으로
// competition_judges 등록 → /judge 페이지로 이동.
//
// 흐름 자체는 server 가 더 깔끔하지만 client 로 만들어서 입력 폼 + 토스트 +
// 낙관적 UI 가 한 화면에 자연스럽게 들어가도록.

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gavel,
  Loader2,
  Check,
  AlertTriangle,
  ArrowRight,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "@/components/layout/Brand";

interface InvitationMeta {
  token: string;
  competitionId: string;
  competitionName: string;
  organizer: string;
  invitedByName: string;
  role: string;
  invalidReason: string | null;
}

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [meta, setMeta] = useState<InvitationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 로그인 상태 — mount 후 supabase client 로 확인.
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [judgeName, setJudgeName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [accepting, setAccepting] = useState(false);

  // 1) 초대 메타데이터 로드 (어느 대회인지, 유효한지)
  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "GET",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "초대 링크를 확인할 수 없습니다.");
        return;
      }
      setMeta(data.invitation as InvitationMeta);
    } catch (err) {
      console.error("load invitation meta", err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 2) 로그인 상태 확인.
  const checkAuth = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setUserEmail(user?.email ?? null);
      // 기본 이름을 email 로컬-파트로 미리 채움.
      if (user?.email && !judgeName) {
        setJudgeName(user.email.split("@")[0]);
      }
    } catch {
      setIsLoggedIn(false);
    } finally {
      setAuthChecked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadMeta();
    void checkAuth();
  }, [loadMeta, checkAuth]);

  async function handleAccept() {
    if (!meta || accepting) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeName: judgeName.trim(),
          affiliation: affiliation.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      // 성공 — 통합 대회 목록으로 (역할 칩으로 본인이 추가된 대회가 표시됨).
      // /judge 는 사이드바에서 빠졌고 통합 진입점이 /competitions.
      router.push("/competitions");
      router.refresh();
    } catch (err) {
      console.error("accept invitation", err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAccepting(false);
    }
  }

  const invalid = !!meta?.invalidReason;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "var(--page-bg)" }}
    >
      <div
        className="w-full max-w-md px-8 py-10"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--t-border-subtle)",
        }}
      >
        <div className="mb-8 flex items-center justify-between">
          <Brand size="sm" asStatic />
          <span
            className="text-[10.5px] font-bold uppercase"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
          >
            심사위원 초대
          </span>
        </div>

        {loading || !authChecked ? (
          <div className="py-10 text-center">
            <Loader2
              className="w-6 h-6 animate-spin mx-auto mb-3"
              style={{ color: "var(--accent)" }}
            />
            <p
              className="text-[12.5px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              초대 정보를 확인하는 중…
            </p>
          </div>
        ) : error ? (
          <ErrorBox message={error} />
        ) : invalid ? (
          <ErrorBox message={meta!.invalidReason!} />
        ) : !isLoggedIn ? (
          <NeedsLogin token={token} />
        ) : (
          <AcceptForm
            meta={meta!}
            judgeName={judgeName}
            setJudgeName={setJudgeName}
            affiliation={affiliation}
            setAffiliation={setAffiliation}
            accepting={accepting}
            userEmail={userEmail}
            onAccept={handleAccept}
          />
        )}
      </div>
    </div>
  );
}

// ── 하위 컴포넌트 ───────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="px-5 py-5 flex items-start gap-3"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--signal-danger)",
      }}
    >
      <AlertTriangle
        className="w-4 h-4 mt-0.5 shrink-0"
        style={{ color: "var(--signal-danger)" }}
        strokeWidth={2.2}
      />
      <div>
        <p
          className="text-[13px] font-semibold mb-1"
          style={{ color: "var(--signal-danger)" }}
        >
          초대를 수락할 수 없습니다.
        </p>
        <p
          className="text-[12px] leading-[1.6]"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          {message}
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-[12px] font-medium underline-offset-2 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function NeedsLogin({ token }: { token: string }) {
  // 로그인 후 다시 이 페이지로 돌아오게 next= 파라미터로 묶음.
  // /login 페이지가 router.push(next) 또는 callback redirectTo 로 처리.
  const next = `/invite/${token}`;
  return (
    <div className="text-center py-2">
      <Gavel
        className="w-9 h-9 mx-auto mb-4"
        style={{ color: "var(--accent)" }}
        strokeWidth={1.6}
      />
      <p
        className="mb-2"
        style={{
          fontWeight: 700,
          fontSize: "1.125rem",
          color: "var(--text-primary)",
          letterSpacing: "-0.005em",
        }}
      >
        심사위원으로 초대받았어요
      </p>
      <p
        className="text-[12.5px] leading-[1.7] mb-7 max-w-xs mx-auto"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        로그인하면 자동으로 이 대회의 심사위원으로 등록되고, 평가 흐름이 시작됩니다.
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="inline-flex items-center justify-center gap-2 w-full h-11 text-[13px] font-bold text-white transition-[filter] hover:brightness-110"
        style={{ background: "var(--accent)", letterSpacing: "0.04em" }}
      >
        <LogIn className="w-4 h-4" strokeWidth={2.4} />
        로그인하고 수락하기
      </Link>
    </div>
  );
}

function AcceptForm({
  meta,
  judgeName,
  setJudgeName,
  affiliation,
  setAffiliation,
  accepting,
  userEmail,
  onAccept,
}: {
  meta: InvitationMeta;
  judgeName: string;
  setJudgeName: (v: string) => void;
  affiliation: string;
  setAffiliation: (v: string) => void;
  accepting: boolean;
  userEmail: string | null;
  onAccept: () => void;
}) {
  return (
    <>
      <div className="text-center mb-6">
        <Gavel
          className="w-9 h-9 mx-auto mb-4"
          style={{ color: "var(--accent)" }}
          strokeWidth={1.6}
        />
        <p
          className="mb-2"
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "var(--text-primary)",
            letterSpacing: "-0.005em",
          }}
        >
          심사위원으로 가입하시겠어요?
        </p>
        <p
          className="text-[12.5px] leading-[1.7] max-w-xs mx-auto"
          style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
        >
          <strong style={{ color: "var(--text-primary)" }}>{meta.competitionName}</strong>
          {meta.organizer && (
            <>
              {" "}
              ({meta.organizer})
            </>
          )}
          의 심사위원으로 초대받았습니다. 수락하면 출품을 평가할 수 있는 권한이
          생깁니다.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {userEmail && (
          <div
            className="px-3 py-2 text-[11.5px]"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--t-border-subtle)",
              color: "var(--text-tertiary)",
            }}
          >
            로그인 계정 · <span style={{ color: "var(--text-primary)" }}>{userEmail}</span>
          </div>
        )}
        <Field label="표시 이름">
          <BareInput
            value={judgeName}
            onChange={(e) => setJudgeName(e.target.value)}
            maxLength={100}
            placeholder="예: 김민수"
          />
        </Field>
        <Field label="소속 / 직함" hint="선택">
          <BareInput
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            maxLength={200}
            placeholder="예: 스파크랩스 파트너 / OO대학교 교수"
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={onAccept}
        disabled={accepting || !judgeName.trim()}
        className="inline-flex items-center justify-center gap-2 w-full h-11 text-[13px] font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "var(--accent)", letterSpacing: "0.04em" }}
      >
        {accepting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            등록 중…
          </>
        ) : (
          <>
            <Check className="w-4 h-4" strokeWidth={2.4} />
            수락하고 심사 시작
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
          </>
        )}
      </button>

      <p
        className="mt-4 text-[10.5px] text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        발급: {meta.invitedByName}
      </p>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label
          className="block text-[10.5px] font-bold uppercase"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}
        >
          {label}
        </label>
        {hint && (
          <span
            className="text-[10px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function BareInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      {...props}
      className="w-full px-3 h-10 text-[13px] outline-none"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--t-border-subtle)",
        color: "var(--text-primary)",
      }}
    />
  );
}
