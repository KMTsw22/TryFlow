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
}

/** 평가 기준 템플릿 (한 대회의 평가표 한 벌). */
export interface CriteriaTemplate {
  id: string;
  name: string;
  /** 6축 기본 템플릿인지 표시 — 데모 때 "기본 템플릿" 라벨 보여주기 위함. */
  isBuiltin: boolean;
  criteria: Criterion[];
}

/** 한 평가 항목에 대한 AI 다중 실행 결과. */
export interface AxisScore {
  criterionId: string;
  /** N회 실행 평균 (0~100). */
  mean: number;
  /** 표준편차. 임계값 초과 시 검토 필요 플래그. */
  stddev: number;
  /** 검토 필요 여부 — stddev > threshold 일 때 true. */
  needsReview: boolean;
  /** AI 가 적은 한 줄 사유 (대표 실행 1회 기준). */
  reasoning?: string;
}

/** 한 제안서의 AI 평가 결과. */
export interface ProposalScore {
  proposalId: string;
  /** 가중 평균 종합 점수 (0~100). */
  composite: number;
  /** 항목별 점수. */
  axes: AxisScore[];
  /** 다중 실행 횟수 (N=5 기본). */
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

/** 대회 (평가 관리자가 운영하는 단위). */
export interface Competition {
  id: string;
  name: string;
  /** 주최 기관. */
  organizer: string;
  /** 모집 마감 (ISO). */
  deadline: string;
  /** 사용하는 평가 기준. */
  template: CriteriaTemplate;
  /** 제출된 제안서들. */
  proposals: Proposal[];
}

/** 분산 플래그 임계값. 이 값을 넘으면 인간 심사위원 검토가 필요하다. */
export const STDDEV_REVIEW_THRESHOLD = 8;
