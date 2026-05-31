// Fastlane (2026-05 pivot) — 평가 도메인 타입.
// 기존 6축 하드코딩 (lib/dimensions.ts, lib/viability.ts) 은 유지하되,
// 주최 측이 평가표를 입력하는 동적 구조를 새로 정의. 백엔드와 합의 후
// API 스키마 맞춤 — 일단 프론트 데모용으로 mock 으로 채운다.

/** 평가 기준 한 항목. */
export interface Criterion {
  /** 항목 식별자 (slug). */
  id: string;
  /** 항목명. ex) "시장성", "혁신성". */
  name: string;
  /** 0~1 사이 가중치. 모든 항목 합 = 1. */
  weight: number;
  /** 주최 측이 적은 채점 기준 설명. */
  description: string;
  /**
   * 대회 생성 시점에 AI 가 자동 생성한 평가 rubric markdown.
   * (테마 + criterion 정의를 받아 도메인 지식, scoring guide,
   *  calibration anchors 가 들어간 한국어 가이드 문서를 만든 결과.)
   *
   * 채점 시 이 텍스트가 그대로 system prompt 로 사용된다.
   * 수동 생성 전이거나 실패한 경우 undefined.
   */
  rubricMd?: string;
}

/**
 * 대회 종류 — 2026-05 피벗으로 도입.
 * 각 종류마다 도메인 특화 axis 프롬프트와 preset 평가표를 가진다.
 *   - game: 게임 대회 (9축 — fastlane/prompts/game/agents/*.md)
 *   - literature: 문학·글쓰기 공모전 (TBD)
 *   - finance: 금융·핀테크 대회 (TBD)
 */
export type CompetitionType = "game" | "literature" | "finance";

export const COMPETITION_TYPE_LABELS: Record<CompetitionType, string> = {
  game: "게임",
  literature: "문학",
  finance: "금융",
};

/** 평가 기준 템플릿 (한 대회의 평가표 한 벌). */
export interface CriteriaTemplate {
  id: string;
  name: string;
  /** 6축 기본 템플릿인지 표시 — 데모 때 "기본 템플릿" 라벨 보여주기 위함. */
  isBuiltin: boolean;
  /**
   * 대회 종류 — 이 종류에 맞는 axis 프롬프트가 fastlane/prompts/{type}/ 에서
   * 로드된다. 없으면 일반(generic) rubric_generator fallback.
   */
  competitionType?: CompetitionType;
  criteria: Criterion[];
}

/** 한 평가 항목에 대한 AI 3-Pass 검증 결과 (Draft → Skeptic → Judge). */
export interface AxisScore {
  criterionId: string;
  /** Judge 최종 점수 (0~100). */
  mean: number;
  /** Draft·Skeptic·Judge 세 점수의 표준편차. 임계값 초과 시 검토 필요 플래그. */
  stddev: number;
  /** 검토 필요 여부 — stddev > threshold 일 때 true. */
  needsReview: boolean;
  /** Judge 의 한 줄 assessment 요약. */
  reasoning?: string;
}

/** 한 제안서의 AI 평가 결과. */
export interface ProposalScore {
  proposalId: string;
  /** 가중 평균 종합 점수 (0~100). */
  composite: number;
  /** 항목별 점수. */
  axes: AxisScore[];
  /** 축당 거친 pass 수 (3-Pass 파이프라인에서 3). */
  runs: number;
}

/**
 * 분쟁(needsReview / 사람 분산 큰 axis) 을 어떻게 해소했는지 기록.
 *
 * AI 가 떨어뜨리는 부분과 사람이 결정하는 부분을 명확히 분리하기 위한 모델.
 * "검토만 보고 끝" 이 아니라 "어떤 결정을 내렸는지" 가 코드에 박혀야 책임 추적
 * 이 가능. 행정 심사 절차의 기본 요건.
 */
export type DisputeAction =
  /** AI 평균을 그대로 final 로 채택. ("AI 가 맞았다" — 사람이 보증.) */
  | "accept_ai"
  /** 심사위원 평균을 final 로 채택. ("사람 합의를 따른다.") */
  | "accept_human_avg"
  /** 분산이 너무 커 추가 심사위원에게 회부. final 미정. */
  | "request_rereview"
  /** 심사위원장이 직접 점수 입력. ("내가 결정한다.") */
  | "manual_override";

export interface DisputeResolution {
  criterionId: string;
  action: DisputeAction;
  /**
   * 최종 점수. action 에 따라 결정:
   *   - accept_ai → AI mean
   *   - accept_human_avg → 사람 점수 평균
   *   - manual_override → 입력한 점수
   *   - request_rereview → undefined (재평가 후 결정)
   */
  finalScore?: number;
  /** 결정한 사람 (감사용). 데모에서는 첫 judge 를 사용. */
  decidedBy: { judgeId: string; judgeName: string };
  decidedAt: string;
  /** 결정 사유. request_rereview 와 manual_override 는 권장, 그 외는 옵셔널. */
  reason?: string;
}

/** 제안서. */
export interface Proposal {
  id: string;
  /** 제안서 제목. */
  title: string;
  /** 제안 팀명. */
  team: string;
  /** 한 줄 요약 — 업로드 시 AI 가 생성한 human-facing 요약. 목록/상세 표시용. */
  summary: string;
  /**
   * 출품 원문 전체. 업로드된 파일의 본문 그대로 — AI 채점이 실제로 판단하는 텍스트.
   * 비어있으면(직접 입력 / 레거시) 채점은 summary 로 fallback 한다.
   */
  content: string;
  /** 제출 시각 (ISO). */
  submittedAt: string;
  /** AI 평가 결과 (없으면 평가 전). */
  score?: ProposalScore;
  /**
   * 심사위원들의 평가. 옵셔널 — 데모 mock 에서만 채워짐.
   * 진짜 백엔드 구현 시엔 별도 테이블(`proposal_reviews`)로 분리해야
   * RLS·동시성 처리가 깔끔해진다. 지금은 시연 흐름 보여주기 위해 nested.
   */
  judgeReviews?: JudgeReview[];
  /**
   * 분쟁 axis 의 해소 기록. 한 axis 당 0건(미결정) 또는 1건(결정).
   * 모든 needsReview axis 가 결정되어야 reviewClosedAt 을 채울 수 있다.
   */
  disputeResolutions?: DisputeResolution[];
  /**
   * 이 출품의 검토를 종료한 시각. 채워지면 /competitions/pending 리스트에서
   * 자동으로 빠짐. 데모 단계에서는 client state 로만 동작.
   */
  reviewClosedAt?: string;
}

/** Rubric 자동 생성 진행 상태. */
export type RubricStatus = "pending" | "generating" | "ready" | "failed";

// ── 심사위원 모델 (2026-05 시연용 추가) ─────────────────────────────────────
// AI 1차 평가 위에 사람(심사위원) 평가 레이어를 얹기 위한 타입들.
// 핵심 명제: "AI 가 떨어뜨리고 사람이 결정한다" — 이게 데이터 모델에 반영되도록.
// 데모 단계에서는 mock 으로만 채우고, 실제 백엔드 RLS·초대 흐름은 다음 페이즈.

/** 한 대회에 배정된 심사위원. */
export interface JudgeAssignment {
  judgeId: string;
  /** 표시용 이름 (denormalized — 카드/리스트에서 join 안 하고 바로 렌더). */
  judgeName: string;
  /** 소속·직함. ex) "OO벤처스 대표", "OO대학교 교수" — 신뢰도 시그널. */
  affiliation?: string;
  invitedAt: string;
  /**
   * 평가 범위. 데모 단계에서는 "all" 만 사용.
   * 실제 운영에서는 일부 proposal 만 배정하는 케이스(분과별 심사)를 위해 확장.
   */
  scope: "all" | { proposalIds: string[] };
}

/** 한 심사위원이 한 axis 에 대해 단 평가. */
export interface AxisReview {
  criterionId: string;
  /** AI 점수를 그대로 수용했는지 — false 면 overrideScore 가 있어야 의미 있음. */
  acceptedAiScore: boolean;
  /** 사람이 다시 매긴 점수 (0~100). acceptedAiScore=true 면 undefined. */
  overrideScore?: number;
  /** 항목별 코멘트 — 왜 동의/수정했는지. */
  comment?: string;
}

/** 한 심사위원이 한 출품에 단 평가 전체. */
export interface JudgeReview {
  judgeId: string;
  /** 카드에서 바로 표시하기 위해 denormalized. */
  judgeName: string;
  affiliation?: string;
  /** 항목별 평가. AI 의 axes 와 1:1 매칭되도록 같은 criterionId 사용. */
  axes: AxisReview[];
  /** 출품 전체에 대한 종합 코멘트. */
  overallComment?: string;
  /** 임시 저장(draft) vs 제출(submitted). draft 는 본인만 보임 (정책 결정 필요). */
  status: "draft" | "submitted";
  submittedAt?: string;
}

/** 대회 (평가 관리자가 운영하는 단위). */
export interface Competition {
  id: string;
  name: string;
  /** 주최 기관. */
  organizer: string;
  /**
   * 대회의 도메인/주제 — rubric 자동 생성에 컨텍스트로 사용.
   * ex) "농업·스마트팜", "에듀테크 - 초중등 교육", "헬스케어 - 정신건강".
   * 비어 있으면 일반 startup 평가 기준으로 fallback.
   */
  theme: string;
  /** 모집 마감 (ISO). */
  deadline: string;
  /** 사용하는 평가 기준. */
  template: CriteriaTemplate;
  /** Rubric 자동 생성 상태. */
  rubricStatus: RubricStatus;
  /** 제출된 제안서들. */
  proposals: Proposal[];
  /**
   * 대회에 배정된 심사위원들. 옵셔널 — 기존 mock/DB 가 깨지지 않도록.
   * 백엔드 마이그레이션 전이라 데모 단계에서만 채워짐.
   */
  judges?: JudgeAssignment[];
}

/** 분산 플래그 임계값. 이 값을 넘으면 심사위원 검토가 필요하다. */
export const STDDEV_REVIEW_THRESHOLD = 8;

/**
 * 초대 링크 — 슬랙 스타일 invite link.
 * 주최자가 만들고 공유하면, 받은 사람이 로그인 + accept 로 judge 가 된다.
 */
export interface Invitation {
  token: string;
  competitionId: string;
  invitedByName: string;
  role: "judge";
  /** ISO. undefined 면 영구. */
  expiresAt?: string;
  /** undefined 면 무제한. */
  maxUses?: number;
  usedCount: number;
  /** true 면 비활성화됨 (revoked_at !== null). */
  revoked: boolean;
  createdAt: string;
}
