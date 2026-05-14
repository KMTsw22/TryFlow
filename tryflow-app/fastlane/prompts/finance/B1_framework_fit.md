# B1: 분석 프레임워크 적절성 / Analytical Framework Fit

> **산출물 그룹 B — 분석 보고서/연구 논문.** 벤치마크: 한국은행 통화정책 경시대회, DB IFC(논문), FSI AIxData Challenge(결과 보고서)

## 1. 메타데이터
- **기준 ID**: B1
- **산출물 유형**: 분석 보고서/연구 논문
- **평가 유형**: 정성 (금융지식 엔진 연계)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L3·L6 중심), M3 깊이 계층

## 2. 평가 대상
보고서가 채택한 **금융·경제 이론·모형·분석틀이 다루는 문제에 적합한지** 검증한다. 옳은 데이터를 써도 잘못된 프레임으로 분석하면 결론이 무너진다. 예: 단기 유동성 문제를 장기 성장모형으로 분석, 미시 후생 문제를 거시 총량지표로 진단. 프레임워크의 존재·적합성·일관성을 본다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| analytical_framework | string | 제출물 파싱(방법론 섹션) | 필수 |
| research_question | string | 제출물 파싱 | 필수 |
| applied_theories | array<string> | 제출물 파싱 | 선택 |
| contest_domain | string | 대회 등록 정보 | 필수 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: framework = extract_framework(submission)
    step 2: if framework absent (데이터 나열만): return (2.0, FAIL, conf=0.85)
    step 3: rq_profile = profile(research_question)   # {시간지평: 단기/장기, 층위: 미시/거시}
    step 4: fw_profile = profile(framework)
    step 5: fit = match(rq_profile, fw_profile)        # 0~5, 시간지평·층위 일치도
    step 6: theory_validity = M4_rag_verify(applied_theories)  # 폐기·오용 이론 탐지, 0~5
    step 7: depth = M3_depth_tier(framework 적용 서술)         # Tier3=가정·한계 인지
    step 8: consistency = 분석 전개가 선언한 프레임을 끝까지 따르는가  # 0~5
    step 9: raw = 0.40*fit + 0.20*theory_validity + 0.25*depth_to_5 + 0.15*consistency
    step 10: conf = confidence_formula(...)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 정책·논문형(한국은행) | 연구논문형(DB IFC) | 데이터·AI형(FSI 보고서) |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 3.5 | 3.5 | 3.0 |
| fit 가중 | 0.40 | 0.45 | 0.40 | 0.35 |
| depth 가중 | 0.25 | 0.25 | 0.30 | 0.30 |
| 순위 모드 권장 가중치 | 20~30% | 30% | 25% | 20% |

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 문제에 최적화된 프레임 + 가정·한계 인지 + 일관 적용 | 단기 유동성 문제에 자금시장 모형, 가정 명시 |
| 4 | 적합한 프레임이나 한계 서술 부족 | 적절한 모형, 일관 적용, 한계 언급 없음 |
| 3 | 프레임은 있으나 문제와 부분적으로만 부합 | 거시 문제에 거시 프레임이나 층위 혼재 |
| 2 | 프레임이 문제와 불일치 또는 데이터 나열 수준 | 미시 후생 문제를 GDP 총량으로만 분석 |
| 1 | 폐기·오용 이론 적용 또는 분석틀 부재 | 분석 없이 의견 나열 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융·경제 연구 심사위원이다. 보고서의 [분석 프레임워크 적절성]을 1~5점 평가하라.
5점=연구문제의 시간지평·분석층위에 맞는 프레임 선택 + 가정·한계 인지 + 일관 적용
/ 3점=프레임은 있으나 문제와 부분적으로만 부합 / 1점=분석틀 부재 또는 부적합 이론 적용.

[예시 1]
입력: "연구질문: 5월 단기 유동성 경색 원인. 분석틀: 단기자금시장(콜·RP) 수급 모형. 모형 가정(차익거래 제약)과
한계(구조적 요인 미반영)를 명시하고 일관되게 적용."
출력: {"score": 5, "rationale": "단기 문제에 단기자금시장 모형을 선택해 시간지평이 일치하고 가정·한계까지 인지함.", "mismatch": []}

[예시 2]
입력: "연구질문: 특정 취약계층의 후생 변화. 분석틀: 국가 전체 GDP 성장률 추이."
출력: {"score": 2, "rationale": "미시 후생 문제를 거시 총량지표로 진단해 분석층위가 불일치함.", "mismatch": ["미시 문제 ↔ 거시 프레임"]}

[예시 3]
입력: "통계 표 5개를 제시하고 각 표 아래에 소감을 서술. 명시적 분석틀 없음."
출력: {"score": 2, "rationale": "분석 프레임워크가 없이 데이터 나열에 그침.", "mismatch": ["분석틀 부재"]}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "mismatch": ["..."]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "B1",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "rationale": "string",
  "evidence": ["프레임-문제 적합성", "이론 유효성", "깊이 Tier"],
  "subscores": { "fit": 5.0, "theory_validity": 5.0, "depth_tier": 3, "consistency": 5.0 },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- `fit < 3.0` 이면서 `consistency ≥ 4.0` — 비주류·학제간 프레임일 가능성 (부적합이 아닐 수 있음)
- 신규 방법론(머신러닝 예측 등)으로 M4 KB에 평가 기준 미비
- 상위권(`raw ≥ 4.0`) — 프레임 선택 적절성은 견해차가 커 도메인 전문가 교차 검토
- `confidence < 0.6`

## 10. 한계 및 이의제기 대응
- 프레임 선택의 적절성은 견해차가 큰 영역 → CRITICAL 결격 사유로 쓰지 않고 점수형으로만 반영
- 이의제기 시 제공: rq_profile·fw_profile 매칭 결과, 이론 유효성 RAG 결과, LLM mismatch 목록
- 지원자가 프레임 선택 근거를 보강하면 fit·depth 재산정

## 11. 예시
**통과**: `{framework:"단기자금시장 모형, 가정·한계 명시", fit:5, depth:3}` → `{score:4.8, passed:true, confidence:0.85}`
**탈락**: `{framework:"통계 표 나열 후 소감"}` → `{score:2.0, passed:false, rationale:"분석 프레임워크 부재"}`
**경계**: `{framework:"비주류 행동거시 모형, 일관 적용", fit:2.5, consistency:4.5}` → `{score:3.0, review_required:true}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
