# 시스템 아키텍처 — 현재 상태 요약

> 점수 측정 파이프라인의 최신 구조. 코드와 동기화된 reference.

## 점수 파이프라인

```
입력 → Hard Gate → 6 Agent × 3-Pass → Synthesizer → Weighted Arithmetic Mean → 결과
```

## 파일별 책임

### 코드
- `app/api/analysis/route.ts` — 전체 오케스트레이션, SSE 스트리밍, Hard Gate, runAgent 3-pass, Synthesizer 호출
- `lib/viability.ts` — `AGENT_IDS`, `VIABILITY_WEIGHTS`, `computeViabilityScore`, `findWeakAxes`. 서버/클라 공유
- `lib/dimensions.ts` — 6축의 short/full label·설명 (UI 툴팁 source of truth)
- `lib/tavily.ts` — 웹 검색 client + URL 화이트리스트 추출
- `components/DeepAnalysis.tsx` — 클라이언트 리포트 렌더, viability 재계산 (서버와 동일 모듈 사용)

### 프롬프트
- `prompts/agent_skeptic.md` — Pass 2 Calibrator (양방향 보정)
- `prompts/agent_judge.md` — Pass 3 Judge (Draft + Calibrator + evidence 종합)
- `prompts/synthesizer.md` — 6축 결과 → 통합 내러티브
- `prompts/idea_summarizer.md` — 아이디어 카드용 짧은 요약 (다른 endpoint)
- `prompts/{category}/agents/{axis}.md` — 카테고리별 도메인 지식 (saas, consumer, marketplace, devtools, health, education, fintech, ecommerce, hardware)
- `prompts/saas/agents/{axis}.md` — base 프롬프트 (JSON 스키마 + scoring anchor 포함). non-SaaS 카테고리는 카테고리 도메인 지식 + saas base format 결합
- `prompts/quality_gate_hard_rules.md` — Hard gate 룰 정의 (사람이 읽기 위한 reference, 코드와 동기화 필요)

## 6 Axes (가중치)

| axis | weight | 설명 |
|---|---|---|
| market_size | 0.22 | TAM 크기·beachhead·확장성 (Andreessen) |
| problem_urgency | 0.18 | 문제 강도 — "hair on fire" (Graham/Blank) |
| product | 0.18 | 10x 솔루션 (Thiel #1) |
| defensibility | 0.17 | Moat — network effect, switching cost (NFX, Thiel #6) |
| business_model | 0.15 | Unit economics + GTM (Sequoia, Bessemer) |
| timing | 0.10 | Why now (Sequoia, Thiel #2) |

## Agent 3-Pass 구조

| Pass | 역할 | 출력 |
|---|---|---|
| 1. Draft | 낙관 초안. Tavily 와 병렬 실행 — evidence 없이 시작 | score, assessment, signals |
| 2. Calibrator | 양방향 보정 — 낙관 과장 ↓, 보수적 과소평가 ↑. 근거 없으면 unchanged | calibration, overstated[], understated[], suggested_score |
| 3. Judge | Draft + Calibrator + evidence 종합. `draft × 0.4 + calibrator × 0.6` 가중평균 | 최종 score + assessment + citations (evidence URL 화이트리스트만) |

## 점수 계산

```
viability = clamp(Σ(wᵢ × xᵢ), 5, 95)
```

- 가중 산술 평균. missing axis → 50 으로 fallback.
- 약한 축은 `findWeakAxes()` 로 별도 표시 (composite − 15 이하).

## 변경 이력 (요약)

이 시스템은 여러 차례 반복 개선되어 현재 구조에 도달했다. 주요 변경:

- **2026-04 6 axes 재편**: 8축 → 6축. regulation 제거, competition → defensibility 흡수, user_acquisition → business_model 흡수, technical_difficulty → product (10x solution) 의미 변경. Primary VC source (Sequoia / a16z / Thiel / NFX / YC) 근거 기반.
- **Weighted Harmonic Mean → Weighted Arithmetic Mean**: 약한 축 1개로 전체 점수가 과도하게 깎이는 신뢰 문제 해결. 약축 신호는 `findWeakAxes()` 로 분리.
- **LLM Quality Gate 제거**: hard gate 가 실제 쓰레기는 모두 거름. LLM gate 는 ROI 낮음 → 제거.
- **Synthesizer Critique 제거**: agent 가 이미 3-pass 로 다듬어진 상태라 2차 critique 가 중복.
- **Cross-axis Moat-credit 제거**: defensibility 점수 자체가 "복사 쉬움"을 이미 반영. 별도 product 할인은 이중계산.
- **Skeptic → Calibrator (양방향)**: 단순 비판은 보수적 과소평가를 못 잡음 → 양방향 보정으로 재설계.
