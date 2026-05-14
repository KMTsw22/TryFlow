# A1: 금융 문제 정의의 실재성 / Financial Problem Validity

> **산출물 그룹 A — 기획안/제안서.** 벤치마크: 금융감독원 금융공모전, DB IFC(기획안), FSI AIxData Challenge(공모 트랙)

## 1. 메타데이터
- **기준 ID**: A1
- **산출물 유형**: 기획안/제안서
- **평가 유형**: 정성 (금융지식 엔진 연계)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L5·L6 중심), M4 RAG

## 2. 평가 대상
제안서가 짚은 "금융 문제"가 **실제로 존재하는 금융 사각지대·페인포인트인지** 검증한다. 일반 공모전 엔진은 문제의 "흥미로움"을 보지만, 본 기준은 문제가 시장 데이터·규제 현실로 뒷받침되는 실재 문제인지를 본다. 가공의 문제 위에 세운 제안은 솔루션이 화려해도 통과시키지 않는다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| problem_statement | string | 제출물 파싱(문제정의 블록) | 필수 |
| target_segment | string | 제출물 파싱 | 필수 |
| cited_evidence | array<{값,출처,시점}> | 제출물 파싱 | 선택 |
| contest_theme | string | 대회 등록 정보 | 필수 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: problem = extract_problem_block(submission)
    step 2: if problem missing or vague("불편하다" 수준): return (1.0, FAIL, conf=0.9)
    step 3: existence = M4_rag_verify(problem.scale_claims,
                sources=[KOSIS, 금감원 민원통계, 협회 공시])      # 0~5
    step 4: specificity = llm_assess_specificity(problem, target_segment)  # 0~5
    step 5: theme_fit = semantic_fit(problem, contest_theme)              # 0~5
    step 6: not_solved = ¬M4_already_institutionalized(problem)           # 이미 해결된 사안인가
    step 7: raw = 0.40*existence + 0.30*specificity + 0.20*theme_fit + 0.10*(not_solved*5)
    step 8: if existence < 2.0: raw = min(raw, 2.0)   # 데이터 근거 없는 문제는 통과 불가
    step 9: conf = confidence_formula(rag_hit_rate, llm_self_consistency, fk.coverage)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 아이디어형(금감원) | 논문형/연구형(DB IFC 기획안) | 데이터·AI형(FSI 공모) |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 2.5 | 3.5 | 3.0 |
| existence 가중 | 0.40 | 0.30 | 0.50 | 0.40 |
| specificity 가중 | 0.30 | 0.35 | 0.25 | 0.30 |
| 순위 모드 권장 가중치 | 15~20% | 15% | 20% | 15% |
> 정규화: `normalized = (raw − 1) / 4 × 100`. 통합 합산은 00_integration_logic.md §4.

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 데이터로 입증된 실재 문제 + 대상·원인 구체화 | 금감원 민원통계 인용, thin-filer 규모 제시 |
| 4 | 실재 문제이나 규모 데이터 일부 부족 | 문제 명확, 정량 근거 1건만 |
| 3 | 문제는 타당하나 일반적·광범위 | "고령층 금융 접근성" 수준 |
| 2 | 문제 정의 모호 또는 데이터 근거 없음 | "사람들이 금융을 어려워함" |
| 1 | 이미 해결된 문제이거나 가공의 문제 | 이미 제도화된 사안을 미해결로 전제 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융 공모전 심사위원이다. '문제 정의'만 [금융 문제의 실재성·구체성]으로 1~5점 평가하라.
솔루션·기대효과는 평가하지 말라. 5점=시장 데이터로 입증 가능 + 대상·원인 구체 / 3점=타당하나 일반적
/ 1점=이미 해결됐거나 가공의 문제.

[예시 1]
입력: "thin-filer(금융이력 부족) 청년은 신용점수 산출 불가로 1금융권 대출이 사실상 차단된다.
대상: 만 19~29세 사회초년생, 금감원 통계상 약 19만 명."
출력: {"score": 5, "rationale": "대상 집단과 발생 원인이 금융 구조 관점에서 구체적이고 규모가 통계로 제시됨.", "data_grounded": true}

[예시 2]
입력: "요즘 사람들은 적금 가입을 귀찮아한다. 이를 해결하면 좋겠다."
출력: {"score": 2, "rationale": "문제가 모호하고 금융 사각지대로 볼 근거나 데이터가 없음.", "data_grounded": false}

[예시 3]
입력: "고령층이 보이스피싱에 취약하다." (대상·규모·원인 서술 없음)
출력: {"score": 3, "rationale": "실재 문제이나 지나치게 일반적이고 대상·원인 구체화가 없음.", "data_grounded": false}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "data_grounded": <bool>}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "A1",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "rationale": "string",
  "evidence": ["검증된 문제 규모 데이터", "구체성 평가"],
  "subscores": { "existence": 4.0, "specificity": 4.0, "theme_fit": 5.0, "not_solved": 1 },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- `existence < 2.0` 이면서 `specificity ≥ 4.0` — RAG로 미검증이나 정성적으로 실재 가능성 높음
- 신생 시장(토큰증권·조각투자 등)으로 M4 검증 불가 → existence 보류
- `confidence < 0.6` (RAG 미적중률 높음 or LLM 3회 샘플 점수 분산 큼)
- theme_fit < 2.0 — 문제는 타당하나 대회 주제와 무관 (탈락 전 주최자 확인)

## 10. 한계 및 이의제기 대응
- RAG로 확인 안 되는 문제도 실재할 수 있다 → existence 단독으로 탈락시키지 않고 §9 트리거로 REVIEW
- 이의제기 시 제공: 검증에 사용한 출처 목록, RAG 대조 결과, LLM rationale 3회 샘플
- 지원자가 추가 출처를 제시하면 existence만 재산정(부분 재평가)

## 11. 예시
**통과**: `{problem:"thin-filer 청년 1금융권 차단, 금감원 통계 인용", existence:5, specificity:4}` → `{score:4.6, passed:true, confidence:0.88}`
**탈락**: `{problem:"사람들이 적금 가입을 귀찮아함"}` → `{score:2.0, passed:false, rationale:"문제 모호, 데이터 근거 없음"}`
**경계**: `{problem:"조각투자 소비자 보호 공백", existence:1.5(신생시장), specificity:4.5}` → `{score:3.0, review_required:true}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
