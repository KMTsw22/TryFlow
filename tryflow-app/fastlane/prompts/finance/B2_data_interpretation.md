# B2: 데이터 신뢰성·해석력 / Data Reliability & Interpretation

> **산출물 그룹 B — 분석 보고서/연구 논문.** 벤치마크: 한국은행 통화정책 경시대회, DB IFC(논문), FSI AIxData Challenge(결과 보고서)

## 1. 메타데이터
- **기준 ID**: B2
- **산출물 유형**: 분석 보고서/연구 논문
- **평가 유형**: 혼합 (정량 출처 검증 + 정성 해석 판정)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L5 중심), M4 RAG

## 2. 평가 대상
보고서가 인용한 데이터가 **신뢰할 출처에서, 최신 시점으로, 정확히 해석되어** 사용됐는지 검증한다. 출처-최신성-해석 3단 검증이다. 같은 숫자라도 1차 출처(한국은행 ECOS) 인용과 2차 가공 인용은 신뢰도가 다르고, 통계를 잘못 읽으면(상승률↔수준, 명목↔실질) 결론이 무너진다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| data_claims | array<{값,단위,출처,시점}> | 제출물 파싱 | 필수 |
| data_interpretations | array<string> | 제출물 파싱 | 필수 |
| charts | array<image> | 제출물 추출 | 선택 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: claims = extract_data_claims(submission)
    step 2: if claims empty: return (2.0, FAIL, conf=0.9)        # 데이터 없는 분석 보고서
    step 3: for c in claims:
                source_tier = classify_source(c.source)  # 1차=5 / 2차=3 / 미상=1
                value = M4_rag_verify(c.value, c.source, c.time)  # MATCH/STALE/MISMATCH/UNVERIFIABLE
                freshness = recency_score(c.time, contest_date)
    step 4: interpretation = M5 + L5:
                상승률↔수준, 명목↔실질, 계절조정, 단위 오류 탐지   # 0~5
    step 5: cherry = detect_selective_window(claims, charts, M4_full_series)
    step 6: raw = 0.30*avg(source_tier) + 0.25*avg(value_score) + 0.15*avg(freshness)
             + 0.30*interpretation
    step 7: if any value == MISMATCH: raw = min(raw, 2.0)        # 틀린 숫자 인용
    step 8: conf = confidence_formula(rag_hit_rate, ...)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 정책·논문형(한국은행) | 연구논문형(DB IFC) | 데이터·AI형(FSI 보고서) |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 3.5 | 3.2 | 3.5 |
| interpretation 가중 | 0.30 | 0.35 | 0.30 | 0.25 |
| value_score 가중 | 0.25 | 0.25 | 0.25 | 0.35 |
| 순위 모드 권장 가중치 | 20~25% | 25% | 20% | 25% |

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 1차 출처 + 최신 시점 + 정확한 해석 | ECOS 직접 인용, 명목·실질 구분, 계절조정 명시 |
| 4 | 출처·해석 정확하나 일부 데이터 시점이 다소 과거 | 1차 출처, 2년 전 데이터 일부 |
| 3 | 데이터 사용하나 2차 출처 의존 또는 해석 단순 | 언론 재인용, 추세 해석 표면적 |
| 2 | 출처 불명확 또는 해석 오류 1건 | 출처 미상 수치, 상승률↔수준 혼동 |
| 1 | 틀린 수치 인용 또는 데이터 왜곡 해석 | 실제와 다른 값, 체리피킹 구간 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융·경제 데이터 검증 심사위원이다. 데이터 인용·해석을 [데이터 신뢰성·해석력]으로 1~5점 평가하라.
5점=1차 출처를 정확한 수치·시점으로 인용 + 통계를 정확히 해석(명목/실질, 상승률/수준, 계절조정 구분)
/ 3점=2차 출처 의존 또는 해석 표면적 / 1점=틀린 수치 인용 또는 왜곡 해석.

[예시 1]
입력: "2025년 12월 소비자물가 상승률은 전년동월대비 2.3%(한국은행 ECOS). 실질금리는 명목 3.0%에서 물가 2.3%를 차감한 0.7%."
출력: {"score": 5, "rationale": "1차 출처를 정확히 인용하고 명목·실질 금리를 올바르게 구분함.", "errors": []}

[예시 2]
입력: "CPI 상승률이 3%이므로 현재 물가 수준은 3% 정도다."
출력: {"score": 2, "rationale": "물가 상승률(변화율)과 물가 수준(절대값)을 혼동함.", "errors": [{"text":"CPI 상승률을 물가 수준으로 해석","type":"상승률↔수준"}]}

[예시 3]
입력: "(출처 표기 없이) 가계부채가 1800조 원을 넘었다."
출력: {"score": 3, "rationale": "수치 자체는 그럴듯하나 출처가 표기되지 않아 신뢰성을 검증할 수 없음.", "errors": [{"text":"출처 미표기","type":"출처불명"}]}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "errors": [{"text":"...","type":"..."}]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "B2",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "rationale": "string",
  "evidence": ["출처 등급 분포", "수치 대조 결과", "해석 오류 목록"],
  "subscores": { "source_tier": 4.5, "value_score": 5.0, "freshness": 4.0, "interpretation": 5.0 },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- `cherry`(체리피킹) 의심 — 데이터 왜곡과 정당한 분석 의도(특정 기간 집중)를 사람이 구분
- `value == UNVERIFIABLE` 비율이 50% 초과 — RAG로 대부분 검증 불가
- 속보치·잠정치 인용으로 value가 STALE/허용오차 경계
- `confidence < 0.6`

## 10. 한계 및 이의제기 대응
- M4 RAG가 모든 수치를 검증할 수 없다 → 미검증 수치는 source_tier만으로 평가하고 비중 축소
- 이의제기 시 제공: 수치별 RAG 대조 결과(출처·시점), 해석 오류 유형, full_series 대조 그래프
- 지원자가 1차 출처를 보강 제출하면 source_tier·value_score 재산정

## 11. 예시
**통과**: `{claims:"ECOS 직접 인용, 명목/실질 구분", value:MATCH}` → `{score:4.9, passed:true, confidence:0.92}`
**탈락**: `{interpretation:"CPI 상승률 3%=물가 수준 3%", errors:[{type:"상승률↔수준"}]}` → `{score:2.0, passed:false}`
**경계**: `{charts:"특정 호황기 구간만 발췌 의심"}` → `{score:3.0, review_required:true, rationale:"구간 선택 의도 확인 필요"}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
