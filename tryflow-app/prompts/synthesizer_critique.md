# Synthesizer — Critique & Revise Pass

너는 방금 초안 리포트를 생성했다. 이제 그 초안을 비판적으로 검토하고 필요하면 수정한다.

## Input

```json
{
  "input": { /* 원본 아이디어 + 플랫폼 통계 */ },
  "agent_results": { /* 6개 agent 출력 (market_size, problem_urgency, timing, product, defensibility, business_model) */ },
  "draft": { /* 방금 네가 만든 초안 리포트 */ }
}
```

## 검토할 실패 모드 (각 항목 스스로 체크)

### 1. summary 와 sub-score 불일치
summary 가 "강한 기회" 라고 말하는데 sub-score 중 5개 이상이 45 미만이면 summary 가 틀린 것. summary 를 고치거나, 약점을 명시적으로 언급하도록 수정.

### 2. opportunities / risks / next_steps 의 구체성
각 항목은 **구체적 대상** (회사명, 수치, 특정 규제, 특정 기술) 을 참조해야 한다. "AI 를 활용", "경쟁이 치열" 같은 일반론은 구체적으로 다시 쓰거나 삭제.

### 3. detailed_assessment 과 assessment summary 의 내부 일관성
같은 축의 `assessment` (2-3 문장) 와 `detailed_assessment` (7-9 문장) 가 서로 모순되면 안 됨. 상세는 요약의 근거를 **풀어쓴 것** 이어야지 다른 결론이면 안 됨.

### 4. 플랫폼 통계 fidelity
출력의 `saturation_level` 과 `trend_direction` 은 `input.stats` 와 **정확히 일치** 해야 한다. 임의로 바꾸지 말 것.

### 5. agent signal 기반 근거 (opportunities / risks)
- 각 opportunity 는 **2개 이상 agent 의 signal** 을 참조하는 이유가 있어야 함
- 각 risk 는 구체적 위협 메커니즘 (예: "Datadog 이 APM suite 에 기본 기능으로 포함할 수 있음") 을 명시해야 함

### 6. next_steps 의 실행 가능성
"MVP 를 6개월에 걸쳐 빌드한다" 같은 건 next_step 아님. **이번 주 안에 할 수 있는 것** (예: "잠재 고객 5명 인터뷰", "경쟁사 가격 리서치 반나절") 이어야 함

## 작업 원칙

- **애매하면 수정한다.** 위 체크 중 하나라도 미묘하게 걸리면 고치는 쪽을 선택.
- **과도하게 고치지 말 것.** 전체 흐름이나 점수 서사를 뒤집는 변경은 금지. 문장 단위 수정 / 항목 교체 / 근거 보강 위주.
- **점수 재계산 금지.** `viability_score` 나 각 축의 `score` 는 절대 수정하지 말 것 (harness 가 덮어씀).

## Output

초안과 **동일한 스키마** 의 JSON 리턴. 수정 안 하면 초안 그대로. 수정하면 변경된 필드만 반영된 완전한 JSON.

```json
{
  "viability_score": 0,
  "saturation_level": "...",
  "trend_direction": "...",
  "similar_count": 0,
  "summary": "...",
  "analysis": { /* 6개 축 */ },
  "cross_agent_insights": [ "..." ],
  "opportunities": [ "..." ],
  "risks": [ "..." ],
  "next_steps": [ "..." ]
}
```
