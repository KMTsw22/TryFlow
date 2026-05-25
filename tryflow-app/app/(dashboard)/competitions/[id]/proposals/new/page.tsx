"use client";

// 출품 일괄 업로드 — 여러 파일을 한 번에 드롭하면 각 파일이 별개 출품 row 로
// 들어가고, 각자 LLM 으로 제목·팀·요약이 자동 채워진다. 사용자는 행 단위로
// 검토·수정한 다음 "일괄 제출" 한 번에 N건의 proposal 을 병렬 생성한다.
//
// 발표 핵심 명제 ("2만 건도 1차로 통과시킨다") 와 시각적으로 매칭되는 흐름.
// N=1 케이스도 자연스럽게 흡수 — 따로 단일 모드를 두지 않는다.
//
// 흐름 요약:
//   1) 드롭/선택 → 각 파일마다 row 생성 (status: extracting)
//   2) extract API 병렬 호출 → 응답 도착 시 row.status = ready (또는 error)
//   3) 행마다 inline edit (제목/팀/요약) 가능
//   4) 모든 row 가 ready + 필수값 통과 시 "일괄 제출" 활성화
//   5) 제출 시 POST /proposals 를 병렬로 호출, 진행률 표시
//   6) 끝나면 /competitions/[id] 로 이동 (각 proposal 의 AI 평가는 background)

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Pencil,
  Upload,
  Loader2,
  Check,
  AlertTriangle,
  X,
  RotateCcw,
  Plus,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const SERIF = "'Pretendard Variable', 'Pretendard', system-ui, sans-serif";

const SUMMARY_MAX = 5000;
const SUMMARY_MIN = 30;
const TITLE_MAX = 200;
const TEAM_MAX = 100;

// 한 행의 상태머신 — 추출중 / 추출완료(편집 가능) / 추출실패 / 제출중 / 제출완료 / 제출실패
type RowStatus =
  | "extracting"
  | "ready"
  | "extract_error"
  | "submitting"
  | "submitted"
  | "submit_error";

interface Row {
  id: string;
  fileName: string;
  /** 파일 출처 row 만 file 보관 — manual row 는 undefined.
   *  재시도 가능하게 보관. N=수십 수준이면 메모리 부담 무시 가능. */
  file?: File;
  /** "file" = 드롭/선택, "manual" = 직접 입력. UI/retry 분기 + 상태 표시용. */
  source: "file" | "manual";
  status: RowStatus;
  title: string;
  team: string;
  summary: string;
  error?: string;
}

export default function BatchUploadProposalsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const competitionId = params.id;
  const { show: toast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 사용자가 새 파일들을 드롭/선택했을 때 — 즉시 extracting 상태로 push 하고
  // 각 row 의 extract API 호출을 병렬로 시작.
  function handleFiles(files: File[]) {
    if (files.length === 0) return;
    const newRows: Row[] = files.map((f) => ({
      id: crypto.randomUUID(),
      fileName: f.name,
      file: f,
      source: "file",
      status: "extracting",
      title: "",
      team: "",
      summary: "",
    }));
    setRows((prev) => [...prev, ...newRows]);
    // 각 row 의 extract 호출 — 부모 setState 가 비동기라 stale closure 회피 위해
    // row.id 기반으로 setRows 콜백 안에서만 갱신.
    for (const r of newRows) {
      void extractForRow(r);
    }
  }

  // 직접 입력 row 추가 — 파일 없이 빈 ready 상태로 시작.
  // 사용자가 제목·팀·요약을 직접 채워서 일괄 제출에 포함시킴.
  function addManualRow() {
    const newRow: Row = {
      id: crypto.randomUUID(),
      fileName: "직접 입력",
      file: undefined,
      source: "manual",
      status: "ready",
      title: "",
      team: "",
      summary: "",
    };
    setRows((prev) => [...prev, newRow]);
  }

  async function extractForRow(row: Row) {
    if (!row.file) return; // manual row 는 추출 대상 아님 (방어).
    try {
      const fd = new FormData();
      fd.append("file", row.file);
      const res = await fetch(
        `/api/competitions/${competitionId}/proposals/extract`,
        { method: "POST", body: fd }
      );
      const data = (await res.json().catch(() => ({}))) as {
        title?: string;
        team?: string;
        summary?: string;
        error?: string;
      };
      if (!res.ok) {
        updateRow(row.id, {
          status: "extract_error",
          error: data?.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      updateRow(row.id, {
        status: "ready",
        title: typeof data.title === "string" ? data.title : "",
        team: typeof data.team === "string" ? data.team : "",
        summary: typeof data.summary === "string" ? data.summary : "",
        error: undefined,
      });
    } catch (err) {
      console.error("extract row failed", err);
      updateRow(row.id, {
        status: "extract_error",
        error: "네트워크 오류가 발생했습니다.",
      });
    }
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function retryRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    // manual row 는 추출 대상이 아니므로 retry 호출 안 됨.
    if (!row.file) return;
    updateRow(id, { status: "extracting", error: undefined });
    void extractForRow(row);
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    handleFiles(files);
    e.target.value = ""; // 같은 파일 다시 선택 가능하게.
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    handleFiles(files);
  }

  // 제출 가능 여부 — 모든 row 가 ready + 제목/요약 최소길이 통과.
  const submittableRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.status === "ready" &&
          r.title.trim().length > 0 &&
          r.summary.trim().length >= SUMMARY_MIN
      ),
    [rows]
  );
  const hasInvalid = useMemo(
    () =>
      rows.some(
        (r) =>
          r.status === "ready" &&
          (r.title.trim().length === 0 ||
            r.summary.trim().length < SUMMARY_MIN)
      ),
    [rows]
  );
  const anyExtracting = rows.some((r) => r.status === "extracting");
  const canSubmit =
    submittableRows.length > 0 &&
    !batchSubmitting &&
    !anyExtracting &&
    !hasInvalid;

  // 제출 진행률 — 완료된 row 수 / 제출 시작한 row 수.
  const submittedCount = rows.filter((r) => r.status === "submitted").length;
  const totalToSubmit = submittableRows.length;

  async function submitAll() {
    if (!canSubmit) return;
    setBatchSubmitting(true);

    // 제출 대상 row 들만 추려서 병렬로 POST.
    const targets = rows.filter(
      (r) =>
        r.status === "ready" &&
        r.title.trim().length > 0 &&
        r.summary.trim().length >= SUMMARY_MIN
    );
    // 표시상 즉시 submitting 으로 전환.
    setRows((prev) =>
      prev.map((r) =>
        targets.some((t) => t.id === r.id) ? { ...r, status: "submitting" } : r
      )
    );

    // Promise.all 의 결과로 성공 여부를 직접 추적.
    // setRows 가 비동기라 외부 rows 변수는 stale — 그걸 보고 판정하면
    // 모두 성공해도 "실패" 토스트가 잘못 떴음. 결과 배열로 평가.
    const results = await Promise.all(
      targets.map(async (r): Promise<{ ok: boolean }> => {
        try {
          const res = await fetch(`/api/competitions/${competitionId}/proposals`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: r.title.trim(),
              team: r.team.trim(),
              summary: r.summary.trim(),
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            proposal?: { id?: string };
          };
          if (!res.ok) {
            updateRow(r.id, {
              status: "submit_error",
              error: data?.error ?? `HTTP ${res.status}`,
            });
            return { ok: false };
          }
          updateRow(r.id, { status: "submitted", error: undefined });
          return { ok: true };
        } catch (err) {
          console.error("submit row failed", err);
          updateRow(r.id, {
            status: "submit_error",
            error: "네트워크 오류가 발생했습니다.",
          });
          return { ok: false };
        }
      })
    );

    setBatchSubmitting(false);

    // 결과 확인 — Promise.all 결과 기반. stale state 위험 없음.
    const allOk = results.every((r) => r.ok);
    if (allOk) {
      toast({
        message: `${targets.length}건 제출 완료. AI 평가가 시작됩니다.`,
        tone: "success",
      });
      // 잠깐 보여주고 이동 — 사용자가 결과를 인식할 시간.
      setTimeout(() => {
        router.push(`/competitions/${competitionId}`);
        router.refresh();
      }, 700);
    } else {
      toast({
        message: "일부 출품이 제출에 실패했습니다. 행을 확인해주세요.",
        tone: "danger",
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-24">
      <Link
        href={`/competitions/${competitionId}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium mb-10 transition-colors hover:text-[color:var(--text-primary)]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        대회로 돌아가기
      </Link>

      <h1
        style={{
          fontWeight: 700,
          fontSize: "1.625rem",
          lineHeight: 1.3,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        출품 일괄 업로드
      </h1>
      <p
        className="mt-1 text-[12px]"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.02em" }}
      >
        한 번에 여러 파일을 던지면 각자 별개 출품으로 들어갑니다
      </p>
      <p
        className="text-[13px] leading-[1.8] mt-4 mb-10 max-w-2xl"
        style={{ color: "var(--text-secondary)", wordBreak: "keep-all" }}
      >
        파일마다 AI 가 제목·팀·요약을 자동으로 채웁니다. 행을 검토·수정한 다음
        하단의 <strong>일괄 제출</strong>을 누르면 모든 출품에 대한 AI 1차 평가가
        동시에 시작됩니다.
      </p>

      {/* 드롭 영역 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center text-center px-6 py-10 cursor-pointer transition-all mb-8"
        style={{
          background: isDragOver ? "var(--accent-soft)" : "var(--surface-1)",
          border: `1px dashed ${
            isDragOver ? "var(--accent)" : "var(--accent-ring)"
          }`,
        }}
      >
        <Upload
          className="w-7 h-7 mb-3"
          style={{ color: "var(--accent)" }}
          strokeWidth={1.8}
        />
        <p
          className="text-[14px] font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          파일을 끌어다 놓거나 클릭해서 선택
        </p>
        <p
          className="text-[11px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          PDF · Markdown(.md) · Text(.txt) · 한 번에 여러 파일 동시 가능 · 파일당
          최대 10MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.md,.markdown,.txt,application/pdf,text/plain,text/markdown"
          onChange={onFileInputChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      {/* 또는 직접 입력 — 파일이 없을 때 빈 행 추가 */}
      <div
        className="flex items-center gap-3 mb-8"
        style={{ color: "var(--text-tertiary)" }}
      >
        <span
          aria-hidden
          className="flex-1 h-px"
          style={{ background: "var(--t-border-subtle)" }}
        />
        <span className="text-[11px]">또는</span>
        <button
          type="button"
          onClick={addManualRow}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
          style={{
            border: "1px solid var(--t-input-border)",
            color: "var(--text-primary)",
            background: "var(--surface-1)",
            borderRadius: 2,
          }}
        >
          <Plus className="w-3 h-3" strokeWidth={2.4} />
          직접 입력으로 추가
        </button>
        <span
          aria-hidden
          className="flex-1 h-px"
          style={{ background: "var(--t-border-subtle)" }}
        />
      </div>

      {/* 행 리스트 */}
      {rows.length > 0 && (
        <div className="mb-8">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2
              className="text-[14px] font-bold uppercase"
              style={{
                color: "var(--text-tertiary)",
                letterSpacing: "0.14em",
              }}
            >
              출품 목록 · {rows.length}건
            </h2>
            {anyExtracting && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-medium"
                style={{ color: "var(--accent)" }}
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                자동 채움 진행 중…
              </span>
            )}
          </div>
          <div className="space-y-3">
            {rows.map((r) => (
              <RowCard
                key={r.id}
                row={r}
                onChange={(patch) => updateRow(r.id, patch)}
                onRemove={() => removeRow(r.id)}
                onRetry={() => retryRow(r.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 일괄 제출 바 — 행이 있을 때만 노출 */}
      {rows.length > 0 && (
        <div
          className="sticky bottom-4 px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--accent-ring)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div className="min-w-0">
            <p
              className="text-[13px] font-semibold mb-0.5"
              style={{ color: "var(--text-primary)" }}
            >
              {batchSubmitting
                ? `제출 중… ${submittedCount} / ${totalToSubmit}`
                : `제출 준비 완료: ${submittableRows.length}건 / 전체 ${rows.length}건`}
            </p>
            <p
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {hasInvalid
                ? "제목과 요약(30자 이상) 이 채워진 행만 제출됩니다."
                : anyExtracting
                ? "모든 자동 채움이 끝나면 제출할 수 있습니다."
                : "제출 후 AI 1차 평가가 각 출품마다 동시에 시작됩니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={submitAll}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-6 h-11 text-[13px] font-bold text-white transition-[filter] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--accent)",
              letterSpacing: "0.04em",
            }}
          >
            {batchSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                제출 중…
              </>
            ) : (
              <>
                일괄 제출 ({submittableRows.length}건)
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
              </>
            )}
          </button>
        </div>
      )}

      {/* 빈 상태 안내 — 행 0건일 때 */}
      {rows.length === 0 && (
        <p
          className="text-center text-[12px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          파일을 추가하면 여기에 출품 목록이 표시됩니다.
        </p>
      )}
    </div>
  );
}

// ── 행 카드 ─────────────────────────────────────────────────────────────
// 한 파일 = 한 출품. 상태에 따라 다른 모습:
//   - extracting: 스피너 + 파일명
//   - ready: 제목/팀/요약 inline 편집 + 제거
//   - extract_error: 에러 + 재시도/제거
//   - submitting/submitted/submit_error: 제출 단계 표시
function RowCard({
  row,
  onChange,
  onRemove,
  onRetry,
}: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const isExtracting = row.status === "extracting";
  const isError = row.status === "extract_error";
  const isReady = row.status === "ready";
  const isSubmitting = row.status === "submitting";
  const isSubmitted = row.status === "submitted";
  const isSubmitError = row.status === "submit_error";

  const titleInvalid = isReady && row.title.trim().length === 0;
  const summaryInvalid =
    isReady && row.summary.trim().length > 0 && row.summary.trim().length < SUMMARY_MIN;
  const summaryEmpty = isReady && row.summary.trim().length === 0;

  const borderColor = isError
    ? "var(--signal-danger)"
    : isSubmitted
    ? "var(--signal-success)"
    : isSubmitError
    ? "var(--signal-danger)"
    : titleInvalid || summaryInvalid || summaryEmpty
    ? "var(--signal-warning)"
    : "var(--t-border-subtle)";

  return (
    <div
      className="px-5 py-4"
      style={{
        background: "var(--surface-1)",
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* 헤더 — 파일명/직접 입력 라벨 + 상태 + 제거 */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {row.source === "manual" ? (
            <Pencil
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "var(--accent)" }}
              strokeWidth={2}
            />
          ) : (
            <FileText
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "var(--text-tertiary)" }}
              strokeWidth={2}
            />
          )}
          <span
            className="text-[12px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {row.fileName}
          </span>
          <StatusBadge status={row.status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isError && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-2 h-7 text-[11px] font-semibold transition-colors hover:bg-[color:var(--t-border-subtle)]"
              style={{
                border: "1px solid var(--t-border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <RotateCcw className="w-3 h-3" strokeWidth={2.2} />
              재시도
            </button>
          )}
          {!isSubmitting && !isSubmitted && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="이 행 제거"
              className="inline-flex items-center justify-center w-7 h-7 transition-colors hover:bg-[color:var(--t-border-subtle)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* 본문 */}
      {isExtracting && (
        <div
          className="flex items-center gap-2 px-3 py-3 text-[12px]"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-secondary)",
          }}
        >
          <Loader2
            className="w-3.5 h-3.5 animate-spin"
            style={{ color: "var(--accent)" }}
          />
          AI 가 제목·팀·요약을 추출하고 있습니다…
        </div>
      )}

      {isError && (
        <div
          className="flex items-start gap-2 px-3 py-3 text-[12px]"
          style={{
            background: "var(--surface-2)",
            color: "var(--signal-danger)",
            wordBreak: "keep-all",
          }}
        >
          <AlertTriangle
            className="w-3.5 h-3.5 mt-0.5 shrink-0"
            strokeWidth={2.2}
          />
          {row.error ?? "추출 실패"}
        </div>
      )}

      {(isReady || isSubmitting || isSubmitted || isSubmitError) && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 mb-3">
          <FieldInline
            label="제목"
            value={row.title}
            onChange={(v) => onChange({ title: v })}
            maxLength={TITLE_MAX}
            disabled={isSubmitting || isSubmitted}
            placeholder="작품 / 프로젝트 / 제안 제목"
            invalid={titleInvalid}
          />
          <FieldInline
            label="팀명 (선택)"
            value={row.team}
            onChange={(v) => onChange({ team: v })}
            maxLength={TEAM_MAX}
            disabled={isSubmitting || isSubmitted}
            placeholder="팀명 또는 개인 출품자명"
          />
        </div>
      )}

      {(isReady || isSubmitting || isSubmitted || isSubmitError) && (
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label
              className="text-[11px] font-bold uppercase"
              style={{
                color: "var(--text-tertiary)",
                letterSpacing: "0.14em",
              }}
            >
              요약 · 본문
            </label>
            <span
              className="text-[11px] tabular-nums"
              style={{
                color:
                  summaryEmpty || summaryInvalid
                    ? "var(--signal-warning)"
                    : "var(--text-tertiary)",
              }}
            >
              {row.summary.trim().length} / {SUMMARY_MAX}자 · 최소 {SUMMARY_MIN}자
            </span>
          </div>
          <textarea
            value={row.summary}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length > SUMMARY_MAX) return;
              onChange({ summary: v });
            }}
            disabled={isSubmitting || isSubmitted}
            rows={3}
            placeholder="출품작의 핵심 내용을 채점이 가능하도록 작성하세요."
            className="w-full px-3 py-2.5 text-[12px] leading-[1.6] outline-none resize-none disabled:opacity-60"
            style={{
              background: "var(--surface-2)",
              border: `1px solid ${
                summaryInvalid || summaryEmpty
                  ? "var(--signal-warning)"
                  : "var(--t-border-subtle)"
              }`,
              color: "var(--text-primary)",
              wordBreak: "keep-all",
            }}
          />
          {summaryInvalid && (
            <p
              className="mt-1.5 text-[11px]"
              style={{ color: "var(--signal-warning)" }}
            >
              요약은 최소 {SUMMARY_MIN}자 이상이어야 평가가 가능합니다.
            </p>
          )}
        </div>
      )}

      {isSubmitError && row.error && (
        <p
          className="mt-2 text-[11px]"
          style={{ color: "var(--signal-danger)" }}
        >
          제출 실패: {row.error}
        </p>
      )}
    </div>
  );
}

// 상태 chip — 헤더 옆에 작게.
function StatusBadge({ status }: { status: RowStatus }) {
  const map: Record<
    RowStatus,
    { label: string; color: string; icon?: React.ReactNode }
  > = {
    extracting: {
      label: "추출 중",
      color: "var(--accent)",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />,
    },
    ready: { label: "확인 후 제출", color: "var(--text-tertiary)" },
    extract_error: {
      label: "추출 실패",
      color: "var(--signal-danger)",
      icon: <AlertTriangle className="w-2.5 h-2.5" />,
    },
    submitting: {
      label: "제출 중",
      color: "var(--accent)",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />,
    },
    submitted: {
      label: "제출됨",
      color: "var(--signal-success)",
      icon: <Check className="w-2.5 h-2.5" strokeWidth={2.4} />,
    },
    submit_error: {
      label: "제출 실패",
      color: "var(--signal-danger)",
      icon: <AlertTriangle className="w-2.5 h-2.5" />,
    },
  };
  const cfg = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shrink-0"
      style={{ color: cfg.color, letterSpacing: "0.1em" }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// 인라인 필드 — 라벨 + 작은 input (한 행 안에 두 필드 나란히 둘 용도).
function FieldInline({
  label,
  value,
  onChange,
  maxLength,
  disabled,
  placeholder,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-[11px] font-bold uppercase mb-1"
        style={{
          color: invalid ? "var(--signal-warning)" : "var(--text-tertiary)",
          letterSpacing: "0.14em",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 h-9 text-[13px] font-semibold outline-none disabled:opacity-60"
        style={{
          background: "var(--surface-2)",
          border: `1px solid ${
            invalid ? "var(--signal-warning)" : "var(--t-border-subtle)"
          }`,
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}
