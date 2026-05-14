# B3: 추론의 논리·인과 엄밀성 / Causal Reasoning Rigor

> **산출물 그룹 B — 분석 보고서/연구 논문.** 벤치마크: 한국은행 통화정책 경시대회, DB IFC(논문), FSI AIxData Challenge(결과 보고서)

## 1. 메타데이터
- **기준 ID**: B3
- **산출물 유형**: 분석 보고서/연구 논문
- **평가 유형**: 정성 (금융지식 엔진 연계 — B그룹 핵심 기준)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L3·L6 중심), M5 추론 정합성, M1 지식그래프

## 2. 평가 대상
보고서의 **추론 사슬이 논리적으로 엄밀한지** 검증한다. 데이터·프레임이 맞아도 추론에서 무너질 수 있다. 핵심 점검: 인과와 상관의 구분, 전이경로 제시, 반론·대안가설 검토, 미시↔거시 비약, 부분균형을 일반균형처럼 결론내는 오류. 금융·경제 보고서에서 가장 흔하고 치명적인 실패 지점이며 상위권 변별의 핵심이다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| argument_chains | array<{전제,추론,결론}> | 제출물 파싱 | 필수 |
| counterarguments | array<string> | 제출물 파싱 | 선택 |
| conclusion | string | 제출물 파싱 | 필수 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: chains = extract_argument_chains(submission)
    step 2: for chain in chains:
                if is_causal(chain.conclusion):
                    ev = classify_evidence(chain.premise)        # CAUSAL_BASIS / CORRELATION_ONLY
                    path = has_transmission_path(chain)          # M1 경로 노드 존재 여부
                    if ev == CORRELATION_ONLY and not path: chain.flaw = ("인과-상관 비약", MAJOR)
    step 3: scope_jump = M5(미시→거시, 부분균형→일반균형 확대 여부)
    step 4: confounders = M5(교란변수 가능성을 배제했는가)
    step 5: counter_review = has_counterargument(counterarguments)   # 0 or 1
    step 6: conclusion_support = M5(결론이 추론 사슬에서 도출되는가)  # 0~5
    step 7: flaw_ratio = flawed_chains / total_chains
    step 8: raw = 0.35*(1−flaw_ratio)*5 + 0.20*(1−scope_jump_penalty)*5
             + 0.20*counter_review*5 + 0.25*conclusion_support
    step 9: if any chain.flaw == CRITICAL or conclusion_support < 1.5: raw = min(raw, 2.0)
    step 10: conf = confidence_formula(...)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 정책·논문형(한국은행) | 연구논문형(DB IFC) | 데이터·AI형(FSI 보고서) |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 3.5 | 3.5 | 3.0 |
| flaw_ratio 가중 | 0.35 | 0.35 | 0.35 | 0.40 |
| counter_review 가중 | 0.20 | 0.25 | 0.25 | 0.10 |
| 추론 엄밀도 | 보통 | 엄격 | 엄격 | 보통 |
| 순위 모드 권장 가중치 | 25~35% | 35% | 30% | 25% |
> 학부생 대회 특성상 완전한 인과 식별(자연실험 등)을 요구하지 않는다. 주최자가 엄밀도를 대회 수준에 맞게 조정한다.

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 인과-상관 구분 + 전이경로 제시 + 반론 검토 + 결론이 추론에서 도출 | 인과 주장에 채널 명시, 대안가설 기각 논증 |
| 4 | 추론 엄밀하나 반론 검토가 약함 | 인과 논증 견고, 한계 언급 짧음 |
| 3 | 큰 비약은 없으나 일부 추론이 상관에 의존 | 일부 주장 근거가 상관관계 수준 |
| 2 | 인과-상관 비약 또는 미시↔거시 비약 다수 | "A와 B가 같이 움직이니 A가 B의 원인" |
| 1 | 결론이 추론에서 도출되지 않음 / 자기모순 | 분석과 무관한 결론, 전제 간 충돌 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융·경제 논문 심사위원이다. 추론 사슬을 [논리·인과 엄밀성]으로 1~5점 평가하라.
5점=인과 주장에 전이경로 제시 + 상관/인과 구분 + 반론·대안가설 검토 + 결론이 추론에서 도출
/ 3점=큰 비약은 없으나 일부 추론이 상관에 의존하거나 반론 검토 없음 / 1점=인과-상관 혼동·결론 단절·자기모순.

[예시 1]
입력: "기준금리 인상→가계 대출이자 부담 증가→처분가능소득 감소→소비 위축. 다만 가계 자산효과가
이를 일부 상쇄할 수 있어 순효과는 시차에 따라 달라진다."
출력: {"score": 5, "rationale": "전이경로를 단계별로 제시하고 상쇄 요인·시차까지 검토함.", "flaws": []}

[예시 2]
입력: "주가와 환율이 같은 시기에 하락했다. 따라서 환율 하락이 주가를 끌어내렸다."
출력: {"score": 2, "rationale": "동시 움직임(상관)만으로 인과를 단정했고 전이경로나 교란변수 검토가 없음.", "flaws": [{"text":"환율→주가 인과 단정","type":"인과상관"}]}

[예시 3]
입력: "한 가계의 저축이 늘면 부가 늘어난다. 따라서 모든 가계가 저축을 늘리면 국가의 부가 늘어난다."
출력: {"score": 2, "rationale": "미시 결론을 거시로 그대로 확대한 구성의 오류(절약의 역설 미고려).", "flaws": [{"text":"미시→거시 확대","type":"범위비약"}]}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "flaws": [{"text":"...","type":"인과상관|범위비약|무근거결론|모순"}]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "B3",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "rationale": "string",
  "evidence": ["추론 결함 목록", "반론 검토 여부", "결론 도출 평가"],
  "subscores": { "flaw_ratio": 0.0, "scope_jump": false, "counter_review": 1, "conclusion_support": 5.0 },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- `chain.flaw == CRITICAL` — 자동 점수 캡 전 사람 검토 (인과-상관 판정은 분야 합의가 갈릴 수 있음)
- LLM이 flaw를 보고했으나 M1·M5 신호와 불일치
- 상위권(`raw ≥ 4.0`) — 추론 엄밀성 판정의 견해차 가능성
- `confidence < 0.6`

## 10. 한계 및 이의제기 대응
- 인과-상관 판정은 분야 합의가 갈릴 수 있다 → CRITICAL flaw는 사람 검토 후 확정
- LLM이 매끄러운 문장을 논리적이라 오인할 수 있어 argument_chains를 명시 추출해 구조로 검증
- 이의제기 시 제공: 결함으로 판정한 추론 사슬, 결함 유형, 전이경로 부재 지점

## 11. 예시
**통과**: `{chains:"전이경로 명시 + 상쇄요인·시차 검토", flaw_ratio:0, counter:1}` → `{score:4.9, passed:true, confidence:0.87}`
**탈락**: `{chain:"주가·환율 동반 하락→환율이 원인", flaws:[{type:"인과상관"}]}` → `{score:2.0, passed:false}`
**경계**: `{flaw 판정의 분야 합의 불명확}` → `{score:3.5, review_required:true}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
