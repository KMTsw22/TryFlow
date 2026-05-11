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

/** 평가 기준 템플릿 (한 대회의 평가표 한 벌). */
export interface CriteriaTemplate {
  id: string;
  name: string;
  /** 6축 기본 템플릿인지 표시 — 데모 때 "기본 템플릿" 라벨 보여주기 위함. */
  isBuiltin: boolean;
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

/** 제안서. */
export interface Proposal {
  id: string;
  /** 제안서 제목. */
  title: string;
  /** 제안 팀명. */
  team: string;
  /** 한 줄 요약. */
  summary: string;
  /** 제출 시각 (ISO). */
  submittedAt: string;
  /** AI 평가 결과 (없으면 평가 전). */
  score?: ProposalScore;
}

/** Rubric 자동 생성 진행 상태. */
export type RubricStatus = "pending" | "generating" | "ready" | "failed";

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
}

/** 분산 플래그 임계값. 이 값을 넘으면 심사위원 검토가 필요하다. */
export const STDDEV_REVIEW_THRESHOLD = 8;
