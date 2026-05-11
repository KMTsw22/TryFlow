// DB row → Competition / Proposal 변환 + payload validation.
// Supabase 에서 jsonb 로 저장한 template, score 를 lib/fastlane/types.ts 의 형태로 복원한다.

import type {
  AxisScore,
  Competition,
  CriteriaTemplate,
  Criterion,
  Proposal,
  ProposalScore,
  RubricStatus,
} from "./types";
import { STDDEV_REVIEW_THRESHOLD } from "./types";

// ── DB row 형태 (snake_case) ───────────────────────────────

export interface CompetitionRow {
  id: string;
  user_id: string;
  name: string;
  organizer: string;
  theme?: string | null;
  deadline: string;
  template: unknown;
  status: string;
  rubric_status?: string | null;
  rubric_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalRow {
  id: string;
  competition_id: string;
  submitter_id: string | null;
  title: string;
  team: string;
  summary: string;
  score: unknown;
  evaluation_status: string;
  evaluation_error: string | null;
  evaluation_report_md?: string | null;
  axis_reports?: unknown;
  created_at: string;
  updated_at: string;
}

// ── 변환 함수 ─────────────────────────────────────────────

export function rowToCompetition(row: CompetitionRow, proposals: Proposal[] = []): Competition {
  const rubricStatus: RubricStatus =
    row.rubric_status === "generating" ||
    row.rubric_status === "ready" ||
    row.rubric_status === "failed"
      ? row.rubric_status
      : "pending";
  return {
    id: row.id,
    name: row.name,
    organizer: row.organizer,
    theme: row.theme ?? "",
    deadline: row.deadline,
    template: parseTemplate(row.template),
    rubricStatus,
    proposals,
  };
}

export function rowToProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    title: row.title,
    team: row.team,
    summary: row.summary,
    submittedAt: row.created_at,
    score: parseScore(row.score, row.id),
  };
}

// ── 안전 파싱 ─────────────────────────────────────────────
//
// jsonb 컬럼은 이론상 우리가 넣은 형태 그대로지만, 마이그레이션이나 수동 수정으로
// 형태가 어긋날 수 있으므로 형태 검증 후 알려진 필드만 통과시킨다.

function parseTemplate(raw: unknown): CriteriaTemplate {
  if (!raw || typeof raw !== "object") {
    return { id: "unknown", name: "(평가표 없음)", isBuiltin: false, criteria: [] };
  }
  const t = raw as Record<string, unknown>;
  const criteriaRaw = Array.isArray(t.criteria) ? t.criteria : [];
  const criteria: Criterion[] = criteriaRaw
    .map((c): Criterion | null => {
      if (!c || typeof c !== "object") return null;
      const r = c as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id : null;
      const name = typeof r.name === "string" ? r.name : null;
      const weight = typeof r.weight === "number" ? r.weight : null;
      if (!id || !name || weight === null) return null;
      // rubric_md (snake_case) 또는 rubricMd (camelCase) 둘 다 허용 — 저장은
      // camelCase 로 통일하되, 외부에서 들어오는 jsonb 의 형태가 흔들릴 수 있음.
      const rubric =
        typeof r.rubricMd === "string"
          ? r.rubricMd
          : typeof r.rubric_md === "string"
            ? (r.rubric_md as string)
            : undefined;
      return {
        id,
        name,
        weight,
        description: typeof r.description === "string" ? r.description : "",
        rubricMd: rubric,
      };
    })
    .filter((c): c is Criterion => c !== null);
  return {
    id: typeof t.id === "string" ? t.id : "custom",
    name: typeof t.name === "string" ? t.name : "(이름 없음)",
    isBuiltin: !!t.isBuiltin,
    criteria,
  };
}

function parseScore(raw: unknown, proposalId: string): ProposalScore | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  const composite = typeof s.composite === "number" ? s.composite : null;
  if (composite === null) return undefined;
  const axesRaw = Array.isArray(s.axes) ? s.axes : [];
  const axes: AxisScore[] = axesRaw
    .map((a): AxisScore | null => {
      if (!a || typeof a !== "object") return null;
      const r = a as Record<string, unknown>;
      const criterionId = typeof r.criterionId === "string" ? r.criterionId : null;
      const mean = typeof r.mean === "number" ? r.mean : null;
      const stddev = typeof r.stddev === "number" ? r.stddev : null;
      if (!criterionId || mean === null || stddev === null) return null;
      return {
        criterionId,
        mean,
        stddev,
        needsReview:
          typeof r.needsReview === "boolean"
            ? r.needsReview
            : stddev > STDDEV_REVIEW_THRESHOLD,
        reasoning: typeof r.reasoning === "string" ? r.reasoning : undefined,
      };
    })
    .filter((a): a is AxisScore => a !== null);
  return {
    proposalId,
    composite,
    runs: typeof s.runs === "number" ? s.runs : axes.length > 0 ? 5 : 0,
    axes,
  };
}

// ── Payload validation ─────────────────────────────────────

export interface CompetitionCreatePayload {
  name: string;
  organizer: string;
  theme: string;
  deadline: string;
  template: CriteriaTemplate;
}

/** 새 대회 생성 폼 검증. 통과 시 { ok: true, payload }, 실패 시 { ok: false, error }. */
export function validateCompetitionPayload(
  body: unknown
): { ok: true; payload: CompetitionCreatePayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "잘못된 요청 형식입니다." };
  }
  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { ok: false, error: "대회명을 입력해주세요." };
  if (name.length > 200) return { ok: false, error: "대회명이 너무 깁니다." };

  const organizer = typeof b.organizer === "string" ? b.organizer.trim() : "";
  if (organizer.length > 200) return { ok: false, error: "주최 기관명이 너무 깁니다." };

  const theme = typeof b.theme === "string" ? b.theme.trim() : "";
  if (theme.length > 200) return { ok: false, error: "주제가 너무 깁니다." };

  const deadline = typeof b.deadline === "string" ? b.deadline : "";
  if (!deadline || isNaN(Date.parse(deadline))) {
    return { ok: false, error: "마감일이 유효하지 않습니다." };
  }

  if (!b.template || typeof b.template !== "object") {
    return { ok: false, error: "평가표가 필요합니다." };
  }
  const t = b.template as Record<string, unknown>;
  const criteriaRaw = Array.isArray(t.criteria) ? t.criteria : [];
  if (criteriaRaw.length === 0) {
    return { ok: false, error: "평가 항목을 1개 이상 추가해주세요." };
  }
  if (criteriaRaw.length > 20) {
    return { ok: false, error: "평가 항목은 최대 20개까지 가능합니다." };
  }

  const criteria: Criterion[] = [];
  for (const c of criteriaRaw) {
    if (!c || typeof c !== "object") {
      return { ok: false, error: "평가 항목 형식이 잘못되었습니다." };
    }
    const r = c as Record<string, unknown>;
    const cName = typeof r.name === "string" ? r.name.trim() : "";
    if (!cName) return { ok: false, error: "모든 평가 항목 이름을 입력해주세요." };
    if (cName.length > 100) return { ok: false, error: "항목 이름이 너무 깁니다." };
    const weight = typeof r.weight === "number" ? r.weight : NaN;
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
      return { ok: false, error: "가중치 값이 유효하지 않습니다." };
    }
    criteria.push({
      id: typeof r.id === "string" && r.id ? r.id : slugify(cName),
      name: cName,
      weight,
      description:
        typeof r.description === "string" ? r.description.trim().slice(0, 1000) : "",
    });
  }

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.02) {
    return {
      ok: false,
      error: `가중치 합이 100% 가 되어야 합니다. (현재 ${Math.round(totalWeight * 100)}%)`,
    };
  }

  const template: CriteriaTemplate = {
    id: typeof t.id === "string" && t.id ? t.id : `custom-${Date.now()}`,
    name: typeof t.name === "string" && t.name ? t.name : name,
    isBuiltin: false,
    criteria,
  };

  return { ok: true, payload: { name, organizer, theme, deadline, template } };
}

export interface ProposalCreatePayload {
  title: string;
  team: string;
  summary: string;
}

export function validateProposalPayload(
  body: unknown
): { ok: true; payload: ProposalCreatePayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "잘못된 요청 형식입니다." };
  }
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) return { ok: false, error: "제안서 제목을 입력해주세요." };
  if (title.length > 200) return { ok: false, error: "제목이 너무 깁니다." };
  const team = typeof b.team === "string" ? b.team.trim() : "";
  if (team.length > 100) return { ok: false, error: "팀명이 너무 깁니다." };
  const summary = typeof b.summary === "string" ? b.summary.trim() : "";
  if (!summary) return { ok: false, error: "제안서 요약을 입력해주세요." };
  if (summary.length < 30) {
    return { ok: false, error: "요약은 최소 30자 이상이어야 합니다." };
  }
  if (summary.length > 5000) return { ok: false, error: "요약이 너무 깁니다." };
  return { ok: true, payload: { title, team, summary } };
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "")
      .slice(0, 40) || `c-${Date.now()}`
  );
}
