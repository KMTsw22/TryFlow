// DB row → Competition / Proposal 변환 + payload validation.
// Supabase 에서 jsonb 로 저장한 template, score 를 lib/fastlane/types.ts 의 형태로 복원한다.

import type {
  AxisReview,
  AxisScore,
  Competition,
  CompetitionType,
  CriteriaTemplate,
  Criterion,
  DisputeAction,
  DisputeResolution,
  Invitation,
  JudgeAssignment,
  JudgeReview,
  Proposal,
  ProposalScore,
  RubricStatus,
} from "./types";
import { STDDEV_REVIEW_THRESHOLD } from "./types";

// 정적 rubric 파일(fastlane/prompts/{type}/)이 존재하는 빌트인 대회 종류.
// 이 셋만 프리셋 패스트레인을 탄다. 그 외 주제는 competitionType 을 비워
// AI rubric_generator 가 theme 기반으로 전 축을 생성한다.
const BUILTIN_COMPETITION_TYPES: readonly CompetitionType[] = [
  "game",
  "finance",
  "literature",
];

function parseCompetitionType(raw: unknown): CompetitionType | undefined {
  return typeof raw === "string" &&
    (BUILTIN_COMPETITION_TYPES as readonly string[]).includes(raw)
    ? (raw as CompetitionType)
    : undefined;
}

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
  // 업로드된 파일의 원문 전체. AI 채점이 실제로 판단하는 텍스트.
  // 마이그레이션(add_proposal_content.sql) 전 DB 호환 위해 옵셔널.
  content?: string | null;
  score: unknown;
  evaluation_status: string;
  evaluation_error: string | null;
  evaluation_report_md?: string | null;
  axis_reports?: unknown;
  // add_judge_review_model.sql 로 추가된 컬럼들. 옵셔널 — 마이그레이션 전 DB
  // 호환성 위해 select * 에서 누락되어도 동작.
  review_closed_at?: string | null;
  review_closed_by?: string | null;
  created_at: string;
  updated_at: string;
}

// ── 심사위원 모델 row 타입들 (add_judge_review_model.sql) ──────────────

export interface JudgeAssignmentRow {
  id: string;
  competition_id: string;
  judge_id: string;
  judge_name: string;
  affiliation: string | null;
  scope: string;
  invited_at: string;
}

export interface ProposalReviewRow {
  id: string;
  proposal_id: string;
  judge_id: string;
  judge_name: string;
  affiliation: string | null;
  // AxisReview[] 의 jsonb 직렬화.
  axes: unknown;
  overall_comment: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeResolutionRow {
  id: string;
  proposal_id: string;
  criterion_id: string;
  action: string;
  final_score: number | null;
  decided_by: string | null;
  decided_by_name: string;
  decided_at: string;
  reason: string | null;
}

/** competition_invitations row — 슬랙 스타일 초대 링크. */
export interface InvitationRow {
  token: string;
  competition_id: string;
  invited_by: string | null;
  invited_by_name: string;
  role: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  revoked_at: string | null;
  created_at: string;
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

/**
 * Proposal row → Proposal 객체.
 *
 * extras 인자로 심사위원 평가 / 분쟁 결정을 함께 받으면 nested 로 채워 반환.
 * 옵셔널이라 기존 호출자(인자 없음)는 그대로 동작.
 */
export function rowToProposal(
  row: ProposalRow,
  extras?: {
    judgeReviews?: JudgeReview[];
    disputeResolutions?: DisputeResolution[];
  }
): Proposal {
  return {
    id: row.id,
    title: row.title,
    team: row.team,
    summary: row.summary,
    content: row.content ?? "",
    submittedAt: row.created_at,
    evaluationStatus: parseEvaluationStatus(row.evaluation_status),
    score: parseScore(row.score, row.id),
    judgeReviews: extras?.judgeReviews,
    disputeResolutions: extras?.disputeResolutions,
    reviewClosedAt: row.review_closed_at ?? undefined,
  };
}

// ── 심사위원 모델 변환 함수 ──────────────────────────────────

export function rowToJudgeAssignment(row: JudgeAssignmentRow): JudgeAssignment {
  return {
    judgeId: row.judge_id,
    judgeName: row.judge_name,
    affiliation: row.affiliation ?? undefined,
    invitedAt: row.invited_at,
    // 'subset' scope 는 MVP 에 없으므로 'all' 로 통일. 추후 확장 시 분기.
    scope: "all",
  };
}

export function rowToJudgeReview(row: ProposalReviewRow): JudgeReview {
  const axes = parseAxisReviews(row.axes);
  return {
    judgeId: row.judge_id,
    judgeName: row.judge_name,
    affiliation: row.affiliation ?? undefined,
    axes,
    overallComment: row.overall_comment ?? undefined,
    status: row.status === "draft" ? "draft" : "submitted",
    submittedAt: row.submitted_at ?? undefined,
  };
}

export function rowToDisputeResolution(row: DisputeResolutionRow): DisputeResolution {
  return {
    criterionId: row.criterion_id,
    action: parseDisputeAction(row.action),
    finalScore: row.final_score ?? undefined,
    decidedBy: {
      judgeId: row.decided_by ?? "",
      judgeName: row.decided_by_name,
    },
    decidedAt: row.decided_at,
    reason: row.reason ?? undefined,
  };
}

function parseDisputeAction(raw: string): DisputeAction {
  // DB 에 잘못된 값이 들어와도 앱이 깨지지 않게 fallback.
  switch (raw) {
    case "accept_ai":
    case "accept_human_avg":
    case "manual_override":
    case "request_rereview":
      return raw;
    default:
      return "accept_ai";
  }
}

export function rowToInvitation(row: InvitationRow): Invitation {
  return {
    token: row.token,
    competitionId: row.competition_id,
    invitedByName: row.invited_by_name,
    role: row.role === "judge" ? "judge" : "judge", // MVP 는 judge 만 — fallback 도 judge.
    expiresAt: row.expires_at ?? undefined,
    maxUses: row.max_uses ?? undefined,
    usedCount: row.used_count,
    revoked: row.revoked_at !== null,
    createdAt: row.created_at,
  };
}

function parseAxisReviews(raw: unknown): AxisReview[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a): AxisReview | null => {
      if (!a || typeof a !== "object") return null;
      const r = a as Record<string, unknown>;
      const criterionId = typeof r.criterionId === "string" ? r.criterionId : null;
      if (!criterionId) return null;
      const accepted = !!r.acceptedAiScore;
      const override = typeof r.overrideScore === "number" ? r.overrideScore : undefined;
      const comment = typeof r.comment === "string" ? r.comment : undefined;
      return {
        criterionId,
        acceptedAiScore: accepted,
        overrideScore: accepted ? undefined : override,
        comment,
      };
    })
    .filter((a): a is AxisReview => a !== null);
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
  const competitionType = parseCompetitionType(t.competitionType);
  return {
    id: typeof t.id === "string" ? t.id : "custom",
    name: typeof t.name === "string" ? t.name : "(이름 없음)",
    isBuiltin: !!t.isBuiltin,
    ...(competitionType ? { competitionType } : {}),
    criteria,
  };
}

function parseEvaluationStatus(
  raw: unknown
): "pending" | "running" | "done" | "failed" | undefined {
  return raw === "pending" || raw === "running" || raw === "done" || raw === "failed"
    ? raw
    : undefined;
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

  const competitionType = parseCompetitionType(t.competitionType);
  const template: CriteriaTemplate = {
    id: typeof t.id === "string" && t.id ? t.id : `custom-${Date.now()}`,
    name: typeof t.name === "string" && t.name ? t.name : name,
    isBuiltin: false,
    ...(competitionType ? { competitionType } : {}),
    criteria,
  };

  return { ok: true, payload: { name, organizer, theme, deadline, template } };
}

export interface ProposalCreatePayload {
  title: string;
  team: string;
  summary: string;
  /** 파일 원문 전체. 채점이 판단하는 텍스트. 직접 입력 시엔 빈 문자열(채점은 summary 사용). */
  content: string;
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
  // content 는 파일 원문 전체 — 길 수 있어 cap 을 크게(채점 입력은 evaluate 에서 다시 제한).
  // 직접 입력 출품은 content 없이 들어오므로 빈 문자열 허용.
  const content = typeof b.content === "string" ? b.content.trim() : "";
  if (content.length > 100_000) return { ok: false, error: "본문이 너무 깁니다." };
  return { ok: true, payload: { title, team, summary, content } };
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
