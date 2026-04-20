# 변경 요약

## 코드 (`app/api/analysis/route.ts`)
- **가중치 재조정 (2026-04)**: regulation 0.10 → 0.05 (B2C 에서 과잉 가중), 회수한 0.05 를 market_size (+0.02) 와 monetization (+0.03) 에 재분배. `components/DeepAnalysis.tsx:AGENT_WEIGHTS` 도 동기화
- **Weighted Harmonic Mean** (2026-04): viability 최종 = `1 / Σ(w_i / x_i)`. F-score / P/E ratio / 병렬저항 등에 쓰이는 고전 공식. 낮은 축이 큰 역수로 분모를 지배 → weakest-link 효과가 자연히 나옴. 이전 custom blend 대체
- **공유 모듈**: `lib/viability.ts` 에 `AGENT_IDS`, `VIABILITY_WEIGHTS`, `computeViabilityScore` 집중. `app/api/analysis/route.ts` 와 `components/DeepAnalysis.tsx` 가 이 모듈을 import — 서버/클라 점수 계산 영원히 sync
- **Moat-aware tech credit** (`applyCrossAxisCaps`): step-function threshold → **연속 공식** 으로 교체. `credit = 0.5 + 0.5 × min(def/50, 1)`, `tech_adjusted = tech × credit`. defensibility 가 50+ 면 full credit, 0 이면 tech 를 50% 로 할인. Google Ads quality score / GPA weighting 등에서 쓰이는 conditional weighting 표준 패턴. `MOAT_FULL_CREDIT` (50) 과 `MOAT_CREDIT_FLOOR` (0.5) 로 튜닝 가능
- viability 점수를 LLM이 아니라 **코드에서 가중합 계산** (`computeViabilityScore`)
- synthesizer가 바꾼 각 축 sub-score 를 **agent 원본으로 덮어씀**
- `temperature: 0.2`, `response_format: json_object`, `max_tokens` 확대 (agent 2048 / synth 4096)
- **2단 quality gate**:
  - 1단 하드 룰 (`runQualityGate`) — 길이/반복/언어 유무, LLM 비용 0. 실패 시 422 + 힌트
  - 2단 LLM 게이트 (`runLLMQualityGate`) — gpt-4o-mini 1회 호출로 "성의 없음" 판정. 실패 시 422 + LLM 힌트. 게이트 자체가 실패하면 fail-open (분석 진행)
  - **Fix**: 하드 룰 #4 (unique-char 비율) 를 길이별 차등 임계값으로 수정. 한국어+마크다운 긴 문서 false positive 해결 (< 60자는 0.25, 60-200자는 0.15, 200자 이상은 0.06)
  - **UX fix**: 프론트 (DeepAnalysis.tsx) 에서 에러 상태일 때도 hints 박스 렌더 (이전엔 로딩 중에만 보여서 왜 막혔는지 사용자가 몰랐음)
- **Synthesizer critique pass** (`runSynthesizerCritique`) — synthesizer 초안 나온 뒤 자기비판/수정 2nd pass. 실패 시 초안 그대로 유지 (fail-open)
- **SSE 스트리밍** — 분석 플로우를 async generator (`runAnalysisStream`) 로 리팩토링. `Accept: text/event-stream` 헤더 보내면 각 단계 완료 시점마다 이벤트 흘려보냄. 기존 JSON 호출은 하위호환 유지
- **Evidence grounding (Tavily)** — `lib/tavily.ts` 추가. 각 agent Pass 1 에서 axis 별 deterministic query 로 웹 검색, 결과 5개 snippet 을 user message 에 주입. agent 출력의 `citations` 필드는 **코드 화이트리스트 검증** (`validateCitations`) 으로 search 결과 URL 집합과 대조, 매치 안 되면 strip. LLM hallucination URL 원천 차단. `TAVILY_API_KEY` 없으면 자동 비활성화 (degraded mode)
- **3-pass per agent** — 각 agent 가 3번의 역할 다른 호출로 진행:
  - Pass 1 (Draft): 기존 agent 프롬프트 + Tavily evidence → 초안 JSON
  - Pass 2 (Skeptic): 새 md `agent_skeptic.md`. Draft 를 받아 약점/과장 주장/누락 위협만 추출 (점수 결정 안 함)
  - Pass 3 (Judge): 새 md `agent_judge.md`. Draft + Skeptic critique 를 받아 canonical final 생성. 최종 score 결정
  - agent 당 LLM 3회 호출. citations 는 Pass 1 의 Tavily 결과로만 화이트리스트됨 (Pass 3 이 invent 시도해도 차단)
  - SSE 이벤트 `agent_pass_done { id, pass, score? }` 추가 → UI 에 `1/3 · 2/3 · 3/3` 실시간 표시

## 프롬프트
- `synthesizer.md` — 산식 계산 섹션 제거, 점수는 harness 담당이라고 명시
- `saas/agents/*.md` 8개 — **Calibration Anchors** (10/30/70점 3-tier 예시) + **Platform Stats Handling** + "5-15 점도 사용하라" 명시 + axis 별 "score below 20" 트리거 조건 추가. 정중함 편향으로 LLM 이 중간값에 모이는 문제 해결
- **Technical axis 리프레이밍** (2026-04): `technical_difficulty` 축을 "빌드 쉬움 = 좋음" → "기술 작업이 지속 가치를 창출하는가" 로 의미 변경. 순수 LLM wrapper 같은 commodity 는 이제 75 대신 25 점. 5-tier 앵커 (10 impossible / 25 commodity / 50 easy+legit wedge / 70 moderate+moat / 85 hard+barrier) 로 확장
- `quality_gate.md` (신규) — 2단 LLM 게이트의 규칙 정의. 코드가 로드해서 LLM 호출
- `quality_gate_hard_rules.md` (신규) — 1단 하드 룰 정의. 코드와 sync, 사람이 읽기용
- `synthesizer_critique.md` (신규) — synthesizer 의 self-critique 2nd pass 규칙 정의 (6개 실패 모드 체크리스트)
- `agent_skeptic.md` (신규) — agent Pass 2 의 비판 규칙. **업데이트**: `suggested_score` (구체 수치) 를 반드시 출력하도록 변경. 이전 `score_direction` 만으론 Judge 가 무시하기 쉬웠음
- `agent_judge.md` (신규) — agent Pass 3 의 최종 판단 규칙. **업데이트**: `base = draft×0.4 + skeptic_suggested×0.6` 가중평균을 기본 공식으로 명시. Skeptic 영향력 강화

## 환경 변수
- `TAVILY_API_KEY` (선택) — Tavily 웹 검색 API key. [tavily.com](https://tavily.com) 가입 → dashboard 에서 발급. `.env.local` 에 추가. 없으면 evidence grounding 비활성화, 분석은 그대로 작동

## 삭제
- `base.md`, `orchestrator.md` — route.ts 가 로드 안 하는 죽은 문서
- `ai_ml/`, `social/`, `other/` — 빈 폴더

## 안 건드린 것
- 비-SaaS 카테고리 (consumer, fintech 등 8개) — 전부 이전 그대로
