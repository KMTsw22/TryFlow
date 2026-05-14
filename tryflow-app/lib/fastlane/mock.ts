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

/**
 * 게임 대회 9축 preset.
 * 근거 문서: decisions/game-evaluation-axes-rationale.md
 * 출처: Ludum Dare, IGF (Independent Games Festival), 대한민국 게임대상.
 * 그래픽·오디오·Polish 는 텍스트 기반 AI 평가 한계로 본심 인간 심사에 위임.
 */
export const GAME_TEMPLATE: CriteriaTemplate = {
  id: "builtin-game-9axis",
  name: "게임 대회 9축",
  isBuiltin: true,
  competitionType: "game",
  criteria: [
    { id: "fun", name: "재미", weight: 0.16, description: "핵심 루프의 만족도, 피드백 품질, 'one more turn' pull. LD Fun + 게임대상 작품성 근거." },
    { id: "game_design", name: "게임 디자인", weight: 0.14, description: "메커닉·레벨·난이도 밸런스의 craft. IGF Excellence in Design 근거." },
    { id: "innovation", name: "혁신성", weight: 0.13, description: "새 조합·primitive·perspective. LD Innovation + 게임대상 창작성." },
    { id: "narrative", name: "스토리텔링", weight: 0.10, description: "시나리오·플롯·캐릭터·대사·ludonarrative 통합. IGF Narrative." },
    { id: "mood", name: "분위기·몰입감", weight: 0.10, description: "정서적 일관성과 세계관 몰입도. LD Mood." },
    { id: "theme", name: "테마 적합성", weight: 0.10, description: "대회 주제와의 통합 깊이 (L1 직역 ~ L4 전복). LD Theme." },
    { id: "scope", name: "범위·실현 가능성", weight: 0.10, description: "팀 규모·기간 대비 컨셉 적정성. GDC Postmortems." },
    { id: "dev_process", name: "개발 프로세스·QA 계획", weight: 0.09, description: "테스트 계획·플랫폼 호환·리스크 관리. SWEBOK QA Planning + 게임대상 운영 안정성." },
    { id: "marketability", name: "시장성", weight: 0.08, description: "타겟 audience·BM·플랫폼 적합성·retention. 게임대상 대중성." },
  ],
};

/**
 * 문학 (단편소설) 대회 7항목 preset.
 * 출처: fastlane/prompts/literature/ 의 단편소설 채점 7항목 (각 10점 만점).
 *
 * 각 criterion id 는 prompts/literature/ 파일명 (확장자 제외) 과 일치 —
 * 정적 rubric 로딩 시 직접 매핑.
 */
export const LITERATURE_TEMPLATE: CriteriaTemplate = {
  id: "builtin-literature-7axis",
  name: "단편소설 채점 7항목",
  isBuiltin: true,
  competitionType: "literature",
  criteria: [
    { id: "01_structural_integrity", name: "1. 구조 완결성", weight: 0.16, description: "발단–전개–절정–결말(또는 이에 준하는 서사 호)이 독자가 따라갈 수 있게 연결되어 있고, '여기서 끊겼다'는 느낌 없이 작품 안에서 이야기가 성립하는가." },
    { id: "07_ending_quality", name: "7. 결말 완성도", weight: 0.15, description: "이야기가 열린 결말이든 닫힌 결말이든, 작품이 약속한 읽기에 대해 의도적으로 마무리되는가(휘발·도주·난제가 아닌)." },
    { id: "05_character_specificity", name: "5. 캐릭터 구체성", weight: 0.15, description: "인물의 행동·말·선택이 심리·동기·상황과 맞물려, 독자가 '이 사람은 이런 사람'이라고 구체적 윤곽을 잡을 수 있는가." },
    { id: "06_narrative_density", name: "6. 서사 밀도", weight: 0.14, description: "불필요한 반복·설명·장면 없이, 등장하는 사건·묘사·대사가 서사의 긴장·주제·캐릭터에 기여하는가." },
    { id: "03_theme_clarity", name: "3. 주제 명료성", weight: 0.14, description: "작품이 무엇에 대해 이야기하는지(정서·윤리·인식의 변화·사회적 질문 등)를 독자가 텍스트만으로 추출·재구성할 수 있는가." },
    { id: "04_style_consistency", name: "4. 문체 일관성", weight: 0.13, description: "서술 시점(1인칭/3인칭/전지 등), 어조(격식·구어·냉소 등), 문장 리듬이 작품 전체에서 의도적으로 유지되거나, 바뀔 때 규칙이 있는가." },
    { id: "02_genre_fit", name: "2. 장르 적합성", weight: 0.13, description: "공모 요강에 적힌 장르 정의(예: SF, 판타지, 미스터리, 리얼리즘 등)와 작품이 약속한 읽기 경험이 맞는가." },
  ],
};

/**
 * 금융 대회 9기준 preset.
 * 출처: fastlane/prompts/finance/ 의 산출물 유형(A/B/C) × 기준(1/2/3) 시스템.
 *
 *  - 그룹 A (기획안/제안서): A1·A2·A3 — 금감원·DB IFC·FSI 공모 트랙
 *  - 그룹 B (분석보고서/논문): B1·B2·B3 — 한국은행·DB IFC·FSI 결과보고서
 *  - 그룹 C (발표자료/PT): C1·C2·C3 — 전 대회 본선 PT + 금감원 PPT
 *  - 공유 엔진: core_financial_knowledge_engine.md (6레이어 × 5메커니즘)
 *
 * 기본 가중치는 9기준 균등 분포에 가깝게 설정.
 * 산출물 유형이 정해지면 (예: 한국은행 통화정책 = B 보고서 + C PT 만),
 * 미사용 기준 가중치를 0 으로 조정하고 가중치 재분배 (integration_logic §4.2).
 *
 * 각 criterion id 는 prompts/finance/ 파일명 (확장자 제외) 과 일치 — 향후
 * 정적 rubric 로딩 시 직접 매핑.
 */
export const FINANCE_TEMPLATE: CriteriaTemplate = {
  id: "builtin-finance-9axis",
  name: "금융 대회 9기준 (A·B·C 산출물)",
  isBuiltin: true,
  competitionType: "finance",
  criteria: [
    { id: "A1_problem_validity", name: "A1 — 금융 문제의 실재성", weight: 0.12, description: "산출물 그룹 A (기획안/제안서). 제안서가 짚은 금융 문제가 시장 데이터·규제 현실로 뒷받침되는 실재 사각지대인지 검증. 가공의 문제 위에 세운 제안은 솔루션이 화려해도 통과 불가." },
    { id: "A2_mechanism_soundness", name: "A2 — 솔루션의 금융 메커니즘 정합성", weight: 0.15, description: "산출물 그룹 A. 솔루션이 가정한 자금흐름·인센티브·리스크 메커니즘이 금융 지식그래프와 정합하는가. 규제 RAG 로 적법성 동시 검증." },
    { id: "A3_impact_quantification", name: "A3 — 기대효과의 정량적 타당성", weight: 0.10, description: "산출물 그룹 A. 기대효과 수치 추정의 가정·근거·계산 체인이 검증 가능한가. M5 추정 체인 정합성으로 비약·과대추정 탐지." },
    { id: "B1_framework_fit", name: "B1 — 분석 프레임워크 적절성", weight: 0.10, description: "산출물 그룹 B (분석보고서/논문). 적용한 경제·금융 프레임워크가 다루는 문제의 깊이 계층과 부합하는가. 깊이 계층 판정 + 프레임-문제 적합 검증." },
    { id: "B2_data_interpretation", name: "B2 — 데이터 신뢰성·해석력", weight: 0.13, description: "산출물 그룹 B. 인용 데이터의 출처·시점·범위가 정확하고 해석이 데이터의 한계를 인지하는가. M4 RAG 로 원본 시계열·통계 대조." },
    { id: "B3_causal_reasoning", name: "B3 — 추론의 논리·인과 엄밀성", weight: 0.15, description: "산출물 그룹 B. 인과/상관 구분, 반례 처리, 변수 통제, 결론 비약 여부 등 추론의 엄밀성. M5 추론 정합성 엔진." },
    { id: "C1_message_logic", name: "C1 — 핵심 메시지의 금융 논리성", weight: 0.10, description: "산출물 그룹 C (발표자료/PT). 1장 요약·결론 슬라이드의 금융 논리가 본문 슬라이드와 정합하고 오개념이 없는가. M2 오개념 룰셋 50종 검증." },
    { id: "C2_visualization_honesty", name: "C2 — 데이터 시각화 정직성", weight: 0.07, description: "산출물 그룹 C. 차트·표가 원본 시계열을 왜곡 없이 표현하는가. 축 절단·기준선 조작·확대해석 탐지. 차트 없는 덱은 SKIP." },
    { id: "C3_claim_evidence_structure", name: "C3 — 근거-주장 구조 완결성", weight: 0.08, description: "산출물 그룹 C. 슬라이드별 역할(주장/근거/예시) 분류 및 매칭. 주장에 대응 근거 부재 또는 근거 없는 일반화 탐지." },
  ],
};

/** 대회 종류별 preset lookup. */
export const TEMPLATES_BY_TYPE = {
  game: GAME_TEMPLATE,
  literature: LITERATURE_TEMPLATE,
  finance: FINANCE_TEMPLATE,
} as const;

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
  theme: "일반 창업 — 다양한 분야 통합",
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  template: KOSME_TEMPLATE,
  rubricStatus: "ready",
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
    theme: "에듀테크 - 초중등 교육",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    template: BUILTIN_TEMPLATE,
    rubricStatus: "ready",
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
