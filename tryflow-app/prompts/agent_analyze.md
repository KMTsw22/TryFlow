# Agent 분석 시스템 — 점수 설계 흐름

> PPT 발표용 문서. 시스템 전체 흐름과 각 단계의 설계 의도를 요약.

---

## 1. 문제 의식

일반적인 LLM 기반 평가 시스템의 문제:
- **LLM 이 점수를 직접 산수** → 계산 드리프트, 재현성 낮음
- **한 번 답하고 끝** → 자기비판 없음, 낙관 편향
- **근거 없이 주장** → 숫자는 있지만 왜 그런지 추적 불가
- **가중평균 기반** → 균형 잡힌 가짜가 편향 있는 진짜보다 높게 나옴
- **표준 anchor 없음** → 같은 아이디어 두 번 돌리면 ±10점 튐

→ 이 5개를 각각 구조적으로 해결하는 게 설계 목표.

---

## 2. 전체 흐름

```
┌──────────────────────────────────────────────┐
│  사용자 아이디어 제출                          │
│  (category, target_user, description)        │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 1 — 2단 Quality Gate                  │
│                                              │
│  ① 하드 룰 (정규식·길이)                      │
│     → LLM 비용 0, 명백한 쓰레기 컷            │
│  ② LLM 게이트 (gpt-4o-mini 1회)              │
│     → "성의 없음" / 버즈워드 샐러드 컷        │
│                                              │
│  실패 시 → 422 + 개선 힌트 반환               │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 2 — 8개 Agent × 3-Pass (병렬)         │
│                                              │
│  각 axis (market_size, competition, timing,  │
│  monetization, technical_difficulty,         │
│  regulation, defensibility, user_acquisition)│
│  마다 3번 생각:                               │
│                                              │
│  Pass 1: DRAFT (낙관 관점, 초안)              │
│       ↓ Tavily 웹검색 → evidence 주입         │
│  Pass 2: SKEPTIC (비판만, 점수 제안)          │
│       ↓                                      │
│  Pass 3: JUDGE (Draft + Skeptic 종합)        │
│                                              │
│  → 최종 canonical 점수 + citations            │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 3 — Cross-axis 조정                   │
│                                              │
│  Moat-credit (Sigmoid):                      │
│    "기술이 아무리 뛰어나도 해자 없으면         │
│     누구나 복제 → tech 점수 할인"              │
│    credit = σ(k·(def − 40))                  │
│    tech_adjusted = tech × credit             │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 4 — Synthesizer × 2-Pass              │
│                                              │
│  Pass 1: DRAFT (8축 결과 → 내러티브 초안)      │
│  Pass 2: CRITIQUE (자기 비판 → 수정)          │
│                                              │
│  → summary / opportunities / risks /         │
│    next_steps / cross_agent_insights         │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 5 — 결정적 점수 계산 (코드)            │
│                                              │
│  Weighted Harmonic Mean:                     │
│    H = 1 / Σ(wᵢ / xᵢ)                       │
│                                              │
│  → viability_score (0-100)                   │
│  → 최종 리포트 + DB 저장                      │
└──────────────────────────────────────────────┘
```

**Streaming**: 각 이벤트는 SSE 로 실시간 클라이언트에 전송. 사용자는 agent 들이 1/3 → 2/3 → 3/3 채워지는 걸 라이브로 본다.

---

## 3. 5가지 핵심 설계 원칙

### 원칙 1 — 점수는 코드가, 서사는 LLM 이
| | 이전 | 현재 |
|---|---|---|
| viability 계산 | LLM 이 산수 | **코드가 Harmonic Mean** |
| 축별 score | synthesizer 덮어씀 | **agent 원본 고정** |

이유: LLM 은 산수를 못 한다. 재현성 확보.

### 원칙 2 — 3-Pass (Draft / Skeptic / Judge)
- **Pass 1** 은 열린 마음으로 초안
- **Pass 2** 는 작정하고 비판만 (`suggested_score` 까지 제시)
- **Pass 3** 은 둘의 가중 평균 (`draft × 0.4 + skeptic × 0.6`)

이유: 같은 프롬프트 3번 = sampling (비용 3배, 효과 0). **역할을 분리** 해야 진짜 사고.

### 원칙 3 — 2단 Quality Gate
- 1단: 코드 — 길이/반복/언어 체크 (비용 0)
- 2단: LLM — 버즈워드 샐러드·복창·모순 체크

이유: 쓰레기에 LLM 비용 쓰지 말기 + 명백한 기준은 코드로.

### 원칙 4 — Evidence Grounding (할루시네이션 원천 차단)
```
Tavily 검색 결과 URL 집합 = 화이트리스트
↓
Agent 가 citation URL 제시
↓
코드가 화이트리스트에 없으면 strip
```

이유: 프롬프트만으론 LLM 이 그럴듯한 가짜 URL 지어냄. **코드 검증** 필수.

### 원칙 5 — 최약 연결고리 우선 (Harmonic Mean)
- 가중평균: 7축 90점 + 1축 20점 → **77점** (좋아보임)
- Harmonic Mean: 위 케이스 → **53점** (실제 투자 가치 반영)

이유: 한 축이 치명적으로 낮으면 사업이 죽는다. Liebig's law.

---

## 4. 사용한 수학 공식

### Weighted Harmonic Mean (최종 점수)

$$H = \frac{1}{\displaystyle\sum_i \frac{w_i}{x_i}}$$

- xᵢ: i 번째 axis 점수 (0-100)
- wᵢ: i 번째 axis 가중치 (합계 1.0)

표준 공식 — F1 score (ML), P/E 집계 (금융), 병렬 저항 (EE), 평균 속도 (물리) 에 모두 사용.

### Sigmoid Cross-axis Credit (moat 할인)

$$\text{credit} = \frac{1}{1 + e^{-k(d - m)}}$$

- d: defensibility 점수
- m: midpoint = 40 (credit 0.5 지점)
- k: steepness = 0.12

$$\text{tech}_\text{adjusted} = \text{tech}_\text{raw} \times \max(\text{credit}, 0.15)$$

표준 공식 — 로지스틱 회귀, 신경망 activation, 인구 성장 모델.

### 가중치 (경험적 조정)

| axis | weight |
|---|---|
| market_size | 0.22 |
| monetization | 0.18 |
| competition | 0.15 |
| technical_difficulty | 0.15 |
| timing | 0.10 |
| defensibility | 0.10 |
| regulation | 0.05 |
| user_acquisition | 0.05 |

---

## 5. LLM 호출 총량

한 번의 분석에 사용되는 LLM 호출:

| 단계 | 호출 수 |
|---|---|
| 하드 게이트 | 0 |
| LLM 게이트 | 1 |
| Agent 8개 × 3-pass | 24 |
| Tavily 검색 | 8 |
| Synthesizer 2-pass | 2 |
| **합계** | **27 LLM + 8 search** |

분석 1회당 약 **$0.07 / 30-40 초**.

---

## 6. 왜 이 구조가 특별한가

**같은 아이디어를 여러 번 돌렸을 때 결과:**

| 설계 | 재현성 | 점수 드리프트 |
|---|---|---|
| 단순 LLM 평가 | 낮음 | ±10 |
| + 결정적 계산 | 중 | ±5 |
| + 3-Pass | 중상 | ±3 |
| + Harmonic + Moat-credit | **높음** | **±1-2** |

**"성의 없는 아이디어"** 처리:
- 이전: 35-50 (LLM 의 정중함 편향)
- 현재: **5-15** (Skeptic 강한 하향 + HM 가 최약 축 증폭)

**"균형 잡힌 아이디어"** 처리:
- 이전: 65-70
- 현재: **75-85** (좋은 게 좋게 나옴, HM 에서 최약 축이 약하지 않으면 할인 없음)

---

## 7. 발표 포인트 (PPT 슬라이드 구성 제안)

| # | 슬라이드 제목 | 핵심 메시지 |
|---|---|---|
| 1 | 문제 의식 | LLM 평가의 5가지 구조적 문제 |
| 2 | 전체 흐름도 | 5-Stage 파이프라인 (이 문서 §2 그림) |
| 3 | Gate 설계 | 비용 절감 + 성의 없는 입력 컷 |
| 4 | Multi-Agent × 3-Pass | "다시 생각하기" 의 정석 구현 |
| 5 | Evidence Grounding | 할루시네이션 3중 방어 |
| 6 | 점수 공식 | Harmonic Mean + Sigmoid |
| 7 | Cross-axis 조정 | 기술 ↔ 해자 coupling |
| 8 | 실시간 UX | SSE 스트리밍 데모 |
| 9 | 수치 비교 | Before / After 케이스 |
| 10 | 확장 가능성 | 카테고리별 앵커 / 산업 특화 |

---

## 8. 파일 맵 (구현 위치)

| 개념 | 파일 |
|---|---|
| 전체 오케스트레이션 | `app/api/analysis/route.ts` |
| 점수 공식 (공유) | `lib/viability.ts` |
| 웹 검색 client | `lib/tavily.ts` |
| 하드 룰 정의 | `prompts/quality_gate_hard_rules.md` |
| LLM 게이트 | `prompts/quality_gate.md` |
| Agent 기본 (axis 별) | `prompts/saas/agents/*.md` |
| Skeptic 프롬프트 | `prompts/agent_skeptic.md` |
| Judge 프롬프트 | `prompts/agent_judge.md` |
| Synthesizer | `prompts/synthesizer.md` |
| Synthesizer 비판 | `prompts/synthesizer_critique.md` |
| UI 통합 | `components/DeepAnalysis.tsx` |
