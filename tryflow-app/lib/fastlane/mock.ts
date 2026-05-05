// Fastlane 데모용 mock 데이터.
// 백엔드 API 가 붙기 전 프론트 시연을 위해 사용. 발표 후 실제 API 연결.
// 의도적으로 stddev 가 다양한 값이 되도록 만들어서 검토 필요 플래그가
// 시각적으로 잘 드러나게 함.

import type {
  Competition,
  CriteriaTemplate,
  Proposal,
  ProposalScore,
} from "./types";
import { STDDEV_REVIEW_THRESHOLD } from "./types";

/** 6축 기본 템플릿. 주최 측이 평가표를 안 적었을 때 fallback. */
export const BUILTIN_TEMPLATE: CriteriaTemplate = {
  id: "builtin-6axis",
  name: "Fastlane 기본 6축",
  isBuiltin: true,
  criteria: [
    { id: "market", name: "시장성", weight: 0.22, description: "타겟 시장의 규모와 성장 가능성." },
    { id: "problem", name: "문제 절박성", weight: 0.18, description: "사용자가 실제로 겪는 고통의 정도와 빈도." },
    { id: "product", name: "제품 우수성", weight: 0.18, description: "기존 대안 대비 10배 이상 나은 점이 있는가." },
    { id: "moat", name: "차별화/방어선", weight: 0.17, description: "경쟁자가 따라잡기 어려운 구조적 우위." },
    { id: "model", name: "수익 모델", weight: 0.15, description: "단위 경제성과 수익화 경로의 명확성." },
    { id: "timing", name: "시장 타이밍", weight: 0.10, description: "왜 지금이어야 하는가 — 기술·규제·행동 변화." },
  ],
};

/** 모두의 창업경진대회 스타일 평가표 (예시). */
const KOSME_TEMPLATE: CriteriaTemplate = {
  id: "kosme-2026",
  name: "모두의 창업경진대회 2026",
  isBuiltin: false,
  criteria: [
    { id: "innovation", name: "혁신성", weight: 0.30, description: "기술·사업모델의 새로움. 기존 시장에 없는 차별점." },
    { id: "feasibility", name: "사업화 가능성", weight: 0.25, description: "현실적으로 구현 가능한가, 자원 대비 실현 난이도." },
    { id: "marketability", name: "시장성", weight: 0.20, description: "수요 규모와 성장성. 진입 장벽 대비 기회 크기." },
    { id: "team", name: "팀 역량", weight: 0.15, description: "수행팀의 전문성, 추진 의지, 보유 역량의 정합성." },
    { id: "social", name: "사회적 가치", weight: 0.10, description: "공익적 임팩트, ESG, 지역경제 기여도." },
  ],
};

function makeScore(
  templateId: string,
  axes: { criterionId: string; mean: number; stddev: number; reasoning?: string }[]
): ProposalScore {
  const template = templateId === "builtin-6axis" ? BUILTIN_TEMPLATE : KOSME_TEMPLATE;
  const weighted = axes.reduce((sum, a) => {
    const w = template.criteria.find((c) => c.id === a.criterionId)?.weight ?? 0;
    return sum + w * a.mean;
  }, 0);
  return {
    proposalId: "",
    composite: Math.round(weighted),
    runs: 5,
    axes: axes.map((a) => ({
      ...a,
      needsReview: a.stddev > STDDEV_REVIEW_THRESHOLD,
    })),
  };
}

function buildProposal(
  id: string,
  title: string,
  team: string,
  summary: string,
  daysAgo: number,
  templateId: string,
  axes: { criterionId: string; mean: number; stddev: number; reasoning?: string }[]
): Proposal {
  const score = makeScore(templateId, axes);
  score.proposalId = id;
  return {
    id,
    title,
    team,
    summary,
    submittedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    score,
  };
}

/** 데모 대회 — KOSME 평가표 사용, 8개 제안서. 분산 큰 항목 의도적 배치. */
export const DEMO_COMPETITION: Competition = {
  id: "demo-2026-spring",
  name: "2026 모두의 창업경진대회 (봄)",
  organizer: "중소벤처기업부 · 창업진흥원",
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  template: KOSME_TEMPLATE,
  proposals: [
    buildProposal(
      "p1",
      "농촌 고령자용 AI 건강 모니터링",
      "케어브릿지",
      "고령 1인 가구의 건강을 비접촉 센서와 AI 로 모니터링하고 보호자에게 알림을 보내는 서비스.",
      1,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 84, stddev: 3.2, reasoning: "비접촉 + 보호자 알림 결합이 기존 솔루션과 차별됨." },
        { criterionId: "feasibility", mean: 71, stddev: 5.1 },
        { criterionId: "marketability", mean: 78, stddev: 4.4 },
        { criterionId: "team", mean: 68, stddev: 11.3, reasoning: "팀 백그라운드 정보가 부족해 실행 평가가 흔들림." },
        { criterionId: "social", mean: 92, stddev: 2.1 },
      ]
    ),
    buildProposal(
      "p2",
      "1인 자영업자용 통합 회계 SaaS",
      "북비",
      "POS·세무·재고를 자동 연동해 영수증 한 장도 안 적게 만드는 1인 사업자 전용 회계 도구.",
      2,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 62, stddev: 4.7 },
        { criterionId: "feasibility", mean: 88, stddev: 2.9 },
        { criterionId: "marketability", mean: 81, stddev: 3.4 },
        { criterionId: "team", mean: 75, stddev: 6.2 },
        { criterionId: "social", mean: 58, stddev: 5.8 },
      ]
    ),
    buildProposal(
      "p3",
      "탄소배출권 자동 정산 플랫폼",
      "그린레저",
      "중소 제조사가 탄소배출권을 사고 팔 때 발생하는 정산·회계 처리를 자동화.",
      3,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 73, stddev: 8.6, reasoning: "신선도 있으나 구현 모호성이 점수를 흔듦." },
        { criterionId: "feasibility", mean: 54, stddev: 12.4, reasoning: "규제 변수가 많아 분산이 매우 큼." },
        { criterionId: "marketability", mean: 67, stddev: 9.2 },
        { criterionId: "team", mean: 71, stddev: 4.8 },
        { criterionId: "social", mean: 86, stddev: 3.1 },
      ]
    ),
    buildProposal(
      "p4",
      "외국인 유학생 배달 매칭",
      "딜리버리브릿지",
      "대학 인근 배달 음식을 외국인 유학생 언어로 주문할 수 있게 해주는 매칭 플랫폼.",
      4,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 51, stddev: 5.2 },
        { criterionId: "feasibility", mean: 78, stddev: 3.4 },
        { criterionId: "marketability", mean: 64, stddev: 4.1 },
        { criterionId: "team", mean: 58, stddev: 9.7, reasoning: "팀 구성에 대한 정보 누락." },
        { criterionId: "social", mean: 71, stddev: 3.8 },
      ]
    ),
    buildProposal(
      "p5",
      "초등교사용 AI 수업안 코파일럿",
      "수업메이트",
      "교과 단원을 입력하면 차시별 수업안과 활동 자료를 자동 생성, 교사 검토 후 보강.",
      5,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 79, stddev: 4.0 },
        { criterionId: "feasibility", mean: 84, stddev: 2.7 },
        { criterionId: "marketability", mean: 76, stddev: 3.2 },
        { criterionId: "team", mean: 81, stddev: 2.8 },
        { criterionId: "social", mean: 88, stddev: 2.0 },
      ]
    ),
    buildProposal(
      "p6",
      "소상공인 리뷰 답변 자동화",
      "리플리",
      "네이버·구글·배민 리뷰를 한 번에 모아 톤·정책에 맞춰 자동으로 답변을 생성.",
      6,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 48, stddev: 3.8 },
        { criterionId: "feasibility", mean: 86, stddev: 2.4 },
        { criterionId: "marketability", mean: 72, stddev: 3.6 },
        { criterionId: "team", mean: 66, stddev: 5.1 },
        { criterionId: "social", mean: 44, stddev: 4.2 },
      ]
    ),
    buildProposal(
      "p7",
      "장애인 활동지원사 매칭 앱",
      "케어매치",
      "활동지원사 수요·공급을 시간 단위로 매칭하고, 시·도 보조금 신청까지 한 번에.",
      7,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 66, stddev: 4.2 },
        { criterionId: "feasibility", mean: 72, stddev: 6.8 },
        { criterionId: "marketability", mean: 58, stddev: 7.4 },
        { criterionId: "team", mean: 74, stddev: 4.0 },
        { criterionId: "social", mean: 94, stddev: 1.6 },
      ]
    ),
    buildProposal(
      "p8",
      "지역 농산물 B2B 새벽배송",
      "팜다이렉트",
      "지역 농가와 카페·식당을 직접 연결해 새벽에 식자재를 공급. 중간 유통 마진 제거.",
      8,
      "kosme-2026",
      [
        { criterionId: "innovation", mean: 42, stddev: 4.4 },
        { criterionId: "feasibility", mean: 64, stddev: 9.1, reasoning: "물류 가정에 대한 평가 변동성." },
        { criterionId: "marketability", mean: 70, stddev: 3.9 },
        { criterionId: "team", mean: 60, stddev: 5.4 },
        { criterionId: "social", mean: 78, stddev: 3.0 },
      ]
    ),
  ],
};

/** 데모용 대회 목록. */
export const MOCK_COMPETITIONS: Competition[] = [
  DEMO_COMPETITION,
  {
    id: "demo-edu-2026",
    name: "에듀테크 챌린지 2026",
    organizer: "한국교육개발원",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    template: BUILTIN_TEMPLATE,
    proposals: [],
  },
];

export function findCompetition(id: string): Competition | null {
  return MOCK_COMPETITIONS.find((c) => c.id === id) ?? null;
}

export function findProposal(competitionId: string, proposalId: string) {
  const comp = findCompetition(competitionId);
  if (!comp) return null;
  const proposal = comp.proposals.find((p) => p.id === proposalId);
  if (!proposal) return null;
  return { competition: comp, proposal };
}
