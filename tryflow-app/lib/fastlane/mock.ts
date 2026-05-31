// Fastlane 데모용 mock 데이터.
// 백엔드 API 가 붙기 전 프론트 시연을 위해 사용. 발표 후 실제 API 연결.
// 의도적으로 stddev 가 다양한 값이 되도록 만들어서 검토 필요 플래그가
// 시각적으로 잘 드러나게 함.

import type {
  AxisReview,
  Competition,
  CriteriaTemplate,
  DisputeResolution,
  JudgeAssignment,
  JudgeReview,
  Proposal,
  ProposalScore,
} from "./types";
import { STDDEV_REVIEW_THRESHOLD } from "./types";

// ── 심사위원 mock pool (2026-05 시연용) ───────────────────────────────────
// 발표 때 "여러 심사위원이 평가하는" 흐름을 보여주기 위한 가짜 인물들.
// 소속은 실제 기관 흉내 — 시연 신뢰도용. 실제 연락처/계정 X.
const JUDGE_POOL: { id: string; name: string; affiliation: string }[] = [
  { id: "j1", name: "김민수", affiliation: "스파크랩스 파트너" },
  { id: "j2", name: "이지현", affiliation: "고려대학교 경영학과 교수" },
  { id: "j3", name: "박재훈", affiliation: "본엔젤스 심사역" },
  { id: "j4", name: "정수아", affiliation: "프라이머 심사역" },
  { id: "j5", name: "최도윤", affiliation: "KAIST 창업원 책임연구원" },
];

/** 데모용 — 한 대회의 심사위원 N명을 pool 에서 뽑아 배정 정보 만들기. */
function pickJudges(count: number): JudgeAssignment[] {
  return JUDGE_POOL.slice(0, count).map((j, i) => ({
    judgeId: j.id,
    judgeName: j.name,
    affiliation: j.affiliation,
    // 며칠 전에 초대됐다는 식으로 살짝 다른 시각.
    invitedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    scope: "all",
  }));
}

/**
 * 한 심사위원이 한 proposal 에 매기는 평가 mock 생성기.
 *
 * 동작:
 *   - AI 점수를 기준으로 small random delta (-8 ~ +6) 를 더해 사람 점수 시뮬레이션.
 *   - 일부 항목은 AI 점수를 "그대로 수용" (acceptedAiScore=true) 처리해서
 *     실제 심사 흐름에 가깝게 ("다 수정하진 않고 의심되는 부분만 수정") 표현.
 *   - 코멘트는 미리 정의된 톤별 풀에서 골라 끼움.
 *
 * 결과적으로 mock 데이터에서 자연스럽게:
 *   - AI ≈ Judge1 ≈ Judge2 인 axis (합의)
 *   - AI vs Judge 간 큰 차이 있는 axis (override)
 *   - judges 끼리도 갈리는 axis (다인 분산)
 * 가 모두 등장한다.
 */
function buildJudgeReview(
  judge: { id: string; name: string; affiliation: string },
  baseScore: ProposalScore,
  // 사람 1명의 평가 톤. seed 로 결정론적으로 다르게.
  seed: number,
  overallComment?: string
): JudgeReview {
  const axes: AxisReview[] = baseScore.axes.map((a, idx) => {
    // 의사 난수 — seed × idx 로 결정적인 변형. 매 빌드 같은 결과.
    const drift = ((seed * 7 + idx * 3) % 14) - 6; // -6 ~ +7
    const wantsOverride = ((seed + idx) % 3) !== 0; // 약 2/3 확률로 수정
    if (!wantsOverride) {
      return { criterionId: a.criterionId, acceptedAiScore: true };
    }
    const overrideScore = Math.max(0, Math.min(100, a.mean + drift));
    // 코멘트는 drift 부호에 따라 다른 톤.
    const comment =
      drift > 4
        ? "현장 사례와 비교하면 AI 추정보다 상향이 적절."
        : drift < -3
        ? "리스크 가정이 낙관적. 보수적으로 봤을 때 점수 하향."
        : undefined;
    return {
      criterionId: a.criterionId,
      acceptedAiScore: false,
      overrideScore,
      comment,
    };
  });
  return {
    judgeId: judge.id,
    judgeName: judge.name,
    affiliation: judge.affiliation,
    axes,
    overallComment,
    status: "submitted",
    submittedAt: new Date(Date.now() - (seed % 5) * 12 * 60 * 60 * 1000).toISOString(),
  };
}

// 종합 코멘트 풀 — 시연 시 자연스러워 보이게 짤막한 한국어.
const OVERALL_COMMENTS: string[] = [
  "전반적으로 시장 진입 논리는 탄탄하나, 팀 실행력 입증 자료가 부족합니다.",
  "사회적 가치 측면에서 강점이 분명. 본심 진출 권고.",
  "기술 차별성은 인정되나, 수익화 시나리오의 가정이 다소 낙관적입니다.",
  "AI 평가 결과에 대체로 동의. 다만 시장성 항목은 좀 더 보수적으로 봤습니다.",
  undefined as unknown as string, // 일부 심사위원은 종합 코멘트 미작성
].filter((c): c is string => typeof c === "string");

/** proposal 에 N명의 judge 가 평가를 단 mock 을 부착. */
function attachJudgeReviews(p: Proposal, judges: JudgeAssignment[], propIdx: number): Proposal {
  if (!p.score) return p;
  const reviews: JudgeReview[] = judges.map((j, i) =>
    buildJudgeReview(
      { id: j.judgeId, name: j.judgeName, affiliation: j.affiliation ?? "" },
      p.score!,
      propIdx * 11 + i * 5 + 1, // proposal × judge 조합마다 다른 seed
      OVERALL_COMMENTS[(propIdx + i) % OVERALL_COMMENTS.length]
    )
  );
  return { ...p, judgeReviews: reviews };
}

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
 * 문학 출품 7축 (범용) preset — 단편소설·시나리오 공통.
 * 출처: fastlane/prompts/literature/ (00_index.md 및 01–07 축 파일, 축당 10점·70점 만점 체계).
 *
 * 각 criterion id 는 prompts/literature/ 파일명 (확장자 제외) 과 일치 —
 * 정적 rubric 로딩 시 직접 매핑.
 */
export const LITERATURE_TEMPLATE: CriteriaTemplate = {
  id: "builtin-literature-7axis",
  name: "문학 출품 7축 (범용)",
  isBuiltin: true,
  competitionType: "literature",
  criteria: [
    {
      id: "01_structure_narrative",
      name: "1. 구조·서사 완결성",
      weight: 1 / 7,
      description:
        "내용과 형식이 긴밀히 연관된 하나의 서사 호로 읽히는가. 총체적 수용이 가능할 만큼 시간·인과·갈등이 배열되었는가. 창작 결과로서 완결감이 있는가.",
    },
    {
      id: "02_genre_context",
      name: "2. 장르·갈래·맥락",
      weight: 1 / 7,
      description:
        "요강이 정한 장르·갈래 약속과 맥락(작가·독자·사회·문화·문학사) 단서가 정렬되었는가.",
    },
    {
      id: "03_theme_value",
      name: "3. 주제·가치·문제의식",
      weight: 1 / 7,
      description:
        "가치·윤리·주제의식이 서사의 선택·결과로 추출·토의 가능한가. 자아 성찰·타자 이해로 이어질 여지가 있는가.",
    },
    {
      id: "04_form_consistency",
      name: "4. 형상화·형식의 일관성",
      weight: 1 / 7,
      description:
        "형식 선택(시점·어조·호흡 / 씬·지시)이 내용·정서선과 맞물리는지, 전반에서 일관되는가.",
    },
    {
      id: "05_character_dialogue",
      name: "5. 인물·대화(소통)",
      weight: 1 / 7,
      description:
        "공감·비판·창의적 감상과 문학 소통에 인물·말하기가 기여하는가. 타자 이해가 가능한가.",
    },
    {
      id: "06_scene_density",
      name: "6. 서사·장면 밀도",
      weight: 1 / 7,
      description:
        "불필요한 분절·나열 없이 사건·장면이 의미에 누적되는가. 해석·비평으로 넘길 디테일이 있는가.",
    },
    {
      id: "07_conflict_resolution",
      name: "7. 갈등·완결·마무리",
      weight: 1 / 7,
      description:
        "긴장이 구체적 장애로 설계되고, 결말이 앞선 질문·모티프에 응답하는가. 책임 있는 마무리인가.",
    },
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
    // mock 은 원문 별도 본문이 없으므로 summary 를 그대로 채점 대상으로 사용.
    content: summary,
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

// ── 심사위원 배정 + 평가 mock 부착 ─────────────────────────────────────────
// 위에서 정의한 DEMO_COMPETITION 은 judges/reviews 없는 base.
// 여기서 한 번에 3명 배정 + 각 proposal 에 그 3명의 평가를 attach 해 export.
// 이렇게 후처리하는 이유: buildProposal 시점에 judges 가 정해지지 않았기 때문.
const DEMO_JUDGES = pickJudges(3);

// 데모용 — 첫 번째 심사위원(=심사위원장 가정)이 일부 분쟁을 미리 결정해둔 상태.
// 발표 시연 시 "이미 일부는 결정됐고, 남은 분쟁만 결정하면 검토 종료" 흐름을
// 보여주기 위해 일부 proposal 에 부분 결정 데이터를 박는다.
const DECISION_AUTHOR = {
  judgeId: DEMO_JUDGES[0].judgeId,
  judgeName: DEMO_JUDGES[0].judgeName,
};
const DEMO_PRESEEDED_RESOLUTIONS: Record<string, DisputeResolution[]> = {
  // p1 (케어브릿지) — team axis (stddev 11.3) 가 분쟁. 이미 사람 평균 채택으로 결정.
  p1: [
    {
      criterionId: "team",
      action: "accept_human_avg",
      finalScore: 70,
      decidedBy: DECISION_AUTHOR,
      decidedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      reason: "보완 자료 검토 결과 사람 평균(70)이 합리적.",
    },
  ],
  // p3 (그린레저) — feasibility (12.4) 가 분쟁. AI 점수가 너무 비관적이라 결정한
  // 사례 — manual_override 로 65 직접 입력.
  p3: [
    {
      criterionId: "feasibility",
      action: "manual_override",
      finalScore: 65,
      decidedBy: DECISION_AUTHOR,
      decidedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      reason: "규제 이슈는 분명하나 정부 가이드라인 발표 이후 실행 가능성 상향.",
    },
  ],
};

const DEMO_COMPETITION_WITH_JUDGES: Competition = {
  ...DEMO_COMPETITION,
  judges: DEMO_JUDGES,
  proposals: DEMO_COMPETITION.proposals.map((p, idx) => {
    const withReviews = attachJudgeReviews(p, DEMO_JUDGES, idx);
    const preseeded = DEMO_PRESEEDED_RESOLUTIONS[p.id];
    return preseeded ? { ...withReviews, disputeResolutions: preseeded } : withReviews;
  }),
};

/** 데모용 대회 목록. */
export const MOCK_COMPETITIONS: Competition[] = [
  DEMO_COMPETITION_WITH_JUDGES,
  {
    id: "demo-edu-2026",
    name: "에듀테크 챌린지 2026",
    organizer: "한국교육개발원",
    theme: "에듀테크 - 초중등 교육",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    template: BUILTIN_TEMPLATE,
    rubricStatus: "ready",
    proposals: [],
    judges: pickJudges(2), // 출품 전이라 평가는 없지만 심사위원만 배정됨
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
