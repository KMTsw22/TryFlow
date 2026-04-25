# Agent 분석 시스템 — 점수 설계 흐름

> PPT 발표용 문서. 시스템 전체 흐름과 각 단계의 설계 의도를 요약.

---

## 1. 문제 의식

일반적인 LLM 기반 평가 시스템의 문제:
- **LLM 이 점수를 직접 산수** → 계산 드리프트, 재현성 낮음
- **한 번 답하고 끝** → 자기비판 없음, 낙관 편향
- **근거 없이 주장** → 숫자는 있지만 왜 그런지 추적 불가
- **표준 anchor 없음** → 같은 아이디어 두 번 돌리면 ±10점 튐
- **단순 비판 일변도** → 점수가 무조건 깎이기만 함, 보수적 과소평가는 못 잡음

→ 이 5개를 각각 구조적으로 해결하는 게 설계 목표.

---

## 2. 전체 흐름

```
┌──────────────────────────────────────────────┐
│  사용자 아이디어 제출                          │
│  (category, target_user, 6 axis 답변)         │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 1 — Hard Quality Gate                 │
│                                              │
│  코드 룰 (정규식·길이·반복·언어)               │
│     → LLM 비용 0, 명백한 쓰레기 컷            │
│                                              │
│  실패 시 → 422 + 개선 힌트 반환               │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 2 — 6개 Agent × 3-Pass (병렬)         │
│                                              │
│  각 axis (market_size, problem_urgency,      │
│  timing, product, defensibility,             │
│  business_model) 마다 3번 생각:               │
│                                              │
│  Pass 1: DRAFT (낙관 관점, 초안)              │
│       ↓ Tavily 웹검색 → evidence (병렬)       │
│  Pass 2: CALIBRATOR (양방향 보정)             │
│       ↓ 과장이면 ↓, 과소평가면 ↑              │
│  Pass 3: JUDGE (Draft + Calibrator 종합)     │
│                                              │
│  → 최종 canonical 점수 + citations            │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 3 — Synthesizer                       │
│                                              │
│  6축 결과 → 통합 내러티브 생성                │
│  (summary / opportunities / risks /          │
│   next_steps / cross_agent_insights)         │
│                                              │
│  ※ 점수는 건들지 않음 — agent 원본 고정       │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│  STAGE 4 — 결정적 점수 계산 (코드)            │
│                                              │
│  Weighted Arithmetic Mean:                   │
│    Score = Σ(wᵢ × xᵢ),  clamp [5, 95]        │
│                                              │
│  + findWeakAxes() 로 약한 축 별도 표시        │
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
| viability 계산 | LLM 이 산수 | **코드가 가중 산술 평균** |
| 축별 score | synthesizer 덮어씀 | **agent 원본 고정** |

이유: LLM 은 산수를 못 한다. 재현성 확보.

### 원칙 2 — 3-Pass (Draft / Calibrator / Judge)
- **Pass 1** 은 열린 마음으로 초안
- **Pass 2** 는 양방향 보정 — 낙관 과장이면 깎고, 보수적 과소평가면 올림 (`suggested_score` 제시)
- **Pass 3** 은 둘의 가중 평균 (`draft × 0.4 + calibrator × 0.6`) + evidence 검증

이유: 같은 LLM 호출 안에서 자기비판은 잘 안 됨 — **독립 inference** 로 분리해야 진짜 비판이 됨. 단방향 비판은 과소평가는 못 잡음 → Calibrator는 양방향.

### 원칙 3 — Hard Quality Gate
- 코드 — 길이/반복/언어/단어 반복 체크 (비용 0)

이유: 쓰레기에 LLM 비용 쓰지 말기. 명백한 기준은 코드로.

### 원칙 4 — Evidence Grounding (할루시네이션 원천 차단)
```
Tavily 검색 결과 URL 집합 = 화이트리스트
↓
Agent 가 citation URL 제시
↓
코드가 화이트리스트에 없으면 strip
```

이유: 프롬프트만으론 LLM 이 그럴듯한 가짜 URL 지어냄. **코드 검증** 필수.

### 원칙 5 — 가중 산술 평균 + 별도 약축 표시
- Weighted Arithmetic Mean 으로 종합 점수 산출
- 약한 축은 `findWeakAxes()` 로 UI 에서 별도 강조

이유: 조화평균은 약한 축 하나로 전체 점수를 과도하게 깎아 사용자 신뢰 문제 발생. 약축 신호는 별도 채널로 전달.

---

## 4. 사용한 수학 공식

### Weighted Arithmetic Mean (최종 점수)

$$S = \sum_i w_i \cdot x_i, \quad S_\text{clamped} = \mathrm{clamp}(S, 5, 95)$$

- xᵢ: i 번째 axis 점수 (0-100, missing → 50)
- wᵢ: i 번째 axis 가중치 (합계 1.0)

### Calibrator 가중평균 (Pass 3 Judge)

$$\text{base} = 0.4 \cdot \text{draft} + 0.6 \cdot \text{calibrator}_\text{suggested}$$

Calibrator 60% 가중 — 더 엄격하고 양방향(↑↓)으로 보정되게 설계.

### 가중치 (primary VC source 근거)

| axis | weight | 근거 |
|---|---|---|
| market_size | 0.22 | Andreessen "market matters most" |
| problem_urgency | 0.18 | Graham/Blank "hair on fire" |
| product | 0.18 | Thiel #1 (10x), Sequoia "Solution" |
| defensibility | 0.17 | NFX, Thiel #6 (Durability) |
| business_model | 0.15 | Sequoia + Bessemer (unit economics + GTM) |
| timing | 0.10 | Sequoia "Why Now" (binary-ish) |

---

## 5. LLM 호출 총량

한 번의 분석에 사용되는 LLM 호출:

| 단계 | 호출 수 |
|---|---|
| Hard Gate | 0 |
| Agent 6개 × 3-pass | 18 |
| Tavily 검색 | 6 |
| Synthesizer | 1 |
| **합계** | **19 LLM + 6 search** |

분석 1회당 약 **$0.05 / 30-40 초**.

---

## 6. 왜 이 구조가 특별한가

**같은 아이디어를 여러 번 돌렸을 때 결과:**

| 설계 | 재현성 | 점수 드리프트 |
|---|---|---|
| 단순 LLM 평가 | 낮음 | ±10 |
| + 결정적 계산 | 중 | ±5 |
| + 3-Pass | 중상 | ±3 |
| + Calibrator (양방향) | **높음** | **±1-2** |

**"성의 없는 아이디어"** 처리:
- 이전: 35-50 (LLM 의 정중함 편향)
- 현재: **5-15** (Hard gate 컷 + Calibrator 강한 하향)

**"균형 잡힌 아이디어"** 처리:
- 이전: 65-70
- 현재: **75-85** (Calibrator 가 보수적 과소평가도 잡아 올림)

---

## 7. 발표 포인트 (PPT 슬라이드 구성 제안)

| # | 슬라이드 제목 | 핵심 메시지 |
|---|---|---|
| 1 | 문제 의식 | LLM 평가의 5가지 구조적 문제 |
| 2 | 전체 흐름도 | 4-Stage 파이프라인 (이 문서 §2 그림) |
| 3 | Hard Gate | 비용 절감 + 성의 없는 입력 컷 |
| 4 | Multi-Agent × 3-Pass | "다시 생각하기" 의 정석 구현 |
| 5 | Calibrator | 양방향 보정 — 단순 비판 아님 |
| 6 | Evidence Grounding | 할루시네이션 화이트리스트 방어 |
| 7 | 점수 공식 | 가중 산술 평균 + 약축 표시 |
| 8 | 실시간 UX | SSE 스트리밍 데모 |
| 9 | 수치 비교 | Before / After 케이스 |
| 10 | 확장 가능성 | 카테고리별 앵커 / 산업 특화 |

---

## 8. 파일 맵 (구현 위치)

| 개념 | 파일 |
|---|---|
| 전체 오케스트레이션 | `app/api/analysis/route.ts` |
| 점수 공식 (공유) | `lib/viability.ts` |
| 차원 정의 (공유) | `lib/dimensions.ts` |
| 웹 검색 client | `lib/tavily.ts` |
| 하드 룰 정의 (문서) | `prompts/quality_gate_hard_rules.md` |
| Agent 기본 (axis 별) | `prompts/saas/agents/*.md` |
| 카테고리 도메인 지식 | `prompts/{category}/agents/*.md` |
| Calibrator 프롬프트 | `prompts/agent_skeptic.md` |
| Judge 프롬프트 | `prompts/agent_judge.md` |
| Synthesizer | `prompts/synthesizer.md` |
| UI 통합 | `components/DeepAnalysis.tsx` |
