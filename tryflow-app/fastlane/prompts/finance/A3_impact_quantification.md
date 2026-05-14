# A3: 기대효과의 정량적 타당성 / Quantified Impact Validity

> **산출물 그룹 A — 기획안/제안서.** 벤치마크: 금융감독원 금융공모전, DB IFC(기획안), FSI AIxData Challenge(공모 트랙)

## 1. 메타데이터
- **기준 ID**: A3
- **산출물 유형**: 기획안/제안서
- **평가 유형**: 혼합 (정량 검증 + 정성 판정)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L5 중심), M4 RAG, M5 추론 정합성

## 2. 평가 대상
제안의 기대효과가 **숫자로 제시되었는가 + 그 숫자에 산출 근거가 있는가**를 2단으로 검증한다. "획기적으로 개선" 같은 정성 수식어로만 효과를 주장하면 통과시키지 않는다. 금융 제안은 효용·비용·시장 영향이 계량 가능하므로, 추정의 존재 여부와 추정 논리의 타당성을 함께 본다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| expected_impact | string | 제출물 파싱(기대효과 블록) | 필수 |
| impact_figures | array<{값,단위}> | 제출물 파싱 | 선택 |
| calculation_basis | string | 제출물 파싱 | 선택 |
| input_assumptions | array<{변수,값,출처}> | 제출물 파싱 | 선택 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: impact = extract_impact_block(submission)
    step 2: figures = extract_quantified_claims(impact)
    step 3: if figures empty: return (2.0, FAIL, conf=0.9)        # 정량 추정 부재
    step 4: coverage = (정량화된 핵심 효과 수) / (선언된 핵심 효과 수)
    step 5: for f in figures:
                basis_exists = has_calculation_chain(f, calculation_basis)
                basis_valid  = M5_check(f.derivation)            # 추정 논리 비약 검사
                inputs_grounded = M4_rag_verify(f.input_assumptions)
    step 6: realism = llm_assess_realism(figures)                 # 과장 가정 탐지, 0~5
    step 7: raw = 0.35*(coverage*5) + 0.35*avg(basis_valid) + 0.20*avg(inputs_grounded) + 0.10*realism
    step 8: if any figure has inflated_assumption: raw = min(raw, 3.0)
    step 9: conf = confidence_formula(...)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 아이디어형(금감원) | 사업화·핀테크형 | 데이터·AI형(FSI 공모) |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 2.5 | 3.5 | 3.0 |
| coverage 가중 | 0.35 | 0.30 | 0.40 | 0.35 |
| basis_valid 가중 | 0.35 | 0.30 | 0.35 | 0.40 |
| 정량화 엄격도 | 보통 | 완화 | 엄격 | 보통 |
| 순위 모드 권장 가중치 | 15~20% | 15% | 25% | 20% |
> 아이디어 부문은 초기 단계 특성상 정밀 추정이 어려워 임계값·엄격도를 완화한다.

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 핵심 효과 정량화 + 산출 근거 명시 + 입력 가정 실측 기반 | "연 38억 절감 = 19만명 × 2만원, 19만명은 통계청" |
| 4 | 정량화·근거 제시되나 입력 가정 1건 약함 | 산출식 명확, 가정 일부 추정치 |
| 3 | 숫자는 있으나 산출 근거가 개략적 | "약 OO만 명에게 도움" — 도출 과정 없음 |
| 2 | 정량 추정 없이 정성 수식어만 | "획기적 개선", "큰 효과 기대" |
| 1 | 과장 가정에 기반한 비현실적 수치 | 도입률 100%·전 국민 가입 전제 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융 사업성 평가 심사위원이다. '기대효과'를 [정량적 타당성]으로 1~5점 평가하라.
5점=핵심 효과가 숫자로 제시 + 산출식·입력 가정 명시 + 가정 현실적 / 3점=숫자는 있으나 산출 근거 개략적
/ 1점=정성 수식어만 있거나 가정이 비현실적으로 과장.

[예시 1]
입력: "연 38억 원 수수료 절감. 산출: 대상 19만 명 × 1인당 평균 2만 원. 19만 명은 통계청 사회초년생 통계 기반."
출력: {"score": 5, "rationale": "핵심 효과가 산출식과 함께 제시되고 입력 가정이 실측 통계에 근거함.", "issues": []}

[예시 2]
입력: "본 서비스가 도입되면 금융 취약계층의 삶의 질이 크게 향상될 것으로 기대된다."
출력: {"score": 2, "rationale": "정량 추정이 전혀 없고 정성 수식어로만 효과를 주장함.", "issues": ["정량 추정 부재"]}

[예시 3]
입력: "전 국민 5천만 명이 가입하면 연 5조 원 효과." (도입률 가정 없음)
출력: {"score": 1, "rationale": "도입률 100%·전 국민 가입이라는 비현실적 가정에 기반함.", "issues": ["과장 가정: 전 국민 가입"]}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "issues": ["..."]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "A3",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "rationale": "string",
  "evidence": ["검증된 추정 체인", "과장 가정 목록"],
  "subscores": { "coverage": 1.0, "basis_valid": 4.0, "inputs_grounded": 4.0, "realism": 4.0 },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- 입력 가정을 M4 RAG로 검증 못 하는 신규 지표 → basis_valid만으로 평가하고 REVIEW
- `realism < 2.0` 이면서 `basis_valid ≥ 4.0` — 추정 논리는 견고하나 가정이 낙관적 (탈락 전 검토)
- 보수적 추정으로 효과가 작게 나온 경우와 효과가 실제로 미미한 경우가 구분 안 될 때
- `confidence < 0.6`

## 10. 한계 및 이의제기 대응
- 초기 단계 아이디어는 정밀 추정이 어렵다 → 주최자가 "정량화 엄격도"를 조정 (아이디어 부문 완화)
- 이의제기 시 제공: 검증한 추정 체인, 과장으로 판정한 가정과 근거, RAG 대조 결과
- 지원자가 입력 가정의 출처를 보강 제출하면 inputs_grounded·basis_valid 재산정

## 11. 예시
**통과**: `{impact:"연38억 절감=19만명×2만원, 통계청 인용", coverage:1.0, basis_valid:5}` → `{score:4.7, passed:true, confidence:0.9}`
**탈락**: `{impact:"삶의 질이 크게 향상될 것"}` → `{score:2.0, passed:false, rationale:"정량 추정 부재"}`
**경계**: `{impact:"절감액 추정 있으나 도입률 가정 낙관적", basis_valid:4, realism:1.8}` → `{score:3.0, review_required:true}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
