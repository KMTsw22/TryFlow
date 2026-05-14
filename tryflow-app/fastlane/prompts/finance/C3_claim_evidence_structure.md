# C3: 근거-주장 구조 완결성 / Claim-Evidence Structure

> **산출물 그룹 C — 발표자료(PT 덱).** 벤치마크: 금융감독원 금융공모전(PPT), 한국은행·DB IFC·FSI 본선 PT

## 1. 메타데이터
- **기준 ID**: C3
- **산출물 유형**: 발표자료(PT 덱)
- **평가 유형**: 정성 (구조 분석)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L6 보조), 구조 매칭 엔진

## 2. 평가 대상
PT 덱에서 **각 핵심 주장이 뒷받침 근거 슬라이드와 연결되어 완결적인 논증 구조를 이루는지** 검증한다. 발표자료는 슬라이드 단위로 쪼개져 "주장만 있고 근거 슬라이드가 없는" 빈 구조가 흔하다. 주장-근거 매칭률과 논리 흐름의 완결성을 본다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| slide_texts | array<string> | 슬라이드 텍스트 추출 | 필수 |
| slide_charts | array<{slide_idx,image}> | C2 차트 추출 결과 공유 | 선택 |
| slide_count | integer | 자동 추출 | 필수 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: slides = classify_slide_roles(slide_texts)   # 주장 / 근거 / 전환 / 요약
    step 2: claim_slides = slides where role == 주장
    step 3: if claim_slides empty: return (2.0, FAIL, conf=0.8)
    step 4: for c in claim_slides:
                supporting = match_evidence_slides(c, slides ∪ slide_charts)  # 의미 연결
                relevance = fk.L6_check(supporting, c)   # 근거가 주장과 금융적으로 관련 있는가
                c.supported = (len(supporting) > 0 and relevance >= 3.0)
    step 5: support_ratio = count(supported) / count(claim_slides)
    step 6: flow = check_logical_flow(slides)            # 문제→분석→해결→효과 흐름
    step 7: orphan_ratio = orphan_evidence / total_evidence_slides
    step 8: raw = 0.50*support_ratio*5 + 0.30*flow + 0.20*(1−orphan_ratio)*5
    step 9: if support_ratio < 0.5: raw = min(raw, 2.0)
    step 10: conf = confidence_formula(role_classification_conf, ...)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 아이디어형(금감원) | 정책·논문형 PT | 데이터·AI형 발표 |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 2.8 | 3.2 | 3.0 |
| support_ratio 가중 | 0.50 | 0.50 | 0.55 | 0.50 |
| flow 가중 | 0.30 | 0.30 | 0.25 | 0.30 |
| 순위 모드 권장 가중치 | 10~15% | 12% | 15% | 12% |

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 모든 주장이 근거 슬라이드와 연결 + 논리 흐름 완결 | 주장마다 데이터 슬라이드, 문제→해결 흐름 명확 |
| 4 | 대부분 연결되나 1개 주장의 근거 약함 | 1건 근거 슬라이드 부족 |
| 3 | 주장의 절반 이상은 근거 있으나 흐름 느슨 | 근거는 있으나 슬라이드 순서 산만 |
| 2 | 주장의 절반 이상이 근거 없음 | 주장 슬라이드만 나열 |
| 1 | 근거 구조 부재 / 흐름 파악 불가 | 슬라이드 간 논리 연결 없음 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 발표 논증 구조 분석가다. 각 슬라이드를 주장/근거/전환/요약으로 분류한 뒤
[근거-주장 구조 완결성]을 1~5점 평가하라. 5점=모든 핵심 주장이 뒷받침 근거 슬라이드와 연결 +
문제→분석→해결→효과 흐름 완결 / 3점=주장의 절반 이상 근거 있으나 흐름 느슨 / 1점=주장만 나열·흐름 파악 불가.

[예시 1]
입력: "S1 문제(thin-filer 차단) / S2 근거(금감원 통계 차트) / S3 주장(대안평가 효과) / S4 근거(파일럿 데이터) / S5 요약"
출력: {"score": 5, "rationale": "모든 핵심 주장에 근거 슬라이드가 연결되고 문제→해결→효과 흐름이 완결적임.", "unsupported_claims": []}

[예시 2]
입력: "S1 주장 / S2 주장 / S3 주장 / S4 주장 (근거·데이터 슬라이드 없음)"
출력: {"score": 2, "rationale": "주장 슬라이드만 나열되고 이를 뒷받침하는 근거 슬라이드가 없음.", "unsupported_claims": ["S1","S2","S3","S4"]}

[예시 3]
입력: "S1 문제 / S2 주장 / S3 근거(S2와 무관한 일반 통계) / S4 주장 / S5 근거"
출력: {"score": 3, "rationale": "근거 슬라이드는 있으나 일부가 주장과 직접 연결되지 않아 구조가 느슨함.", "unsupported_claims": ["S2(근거 무관)"]}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "unsupported_claims": ["..."]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "C3",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "rationale": "string",
  "evidence": ["주장-근거 매칭률", "근거 없는 주장 목록", "논리 흐름 평가"],
  "subscores": { "support_ratio": 1.0, "flow": 5.0, "orphan_ratio": 0.0 },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- `support_ratio` 가 경계값(0.4~0.6) — 슬라이드 역할 자동 분류 오분류 가능성
- `role_classification_conf < 0.6` — 역할 분류 신뢰도 낮음
- 발표 스크립트에서 근거가 구두 보강될 가능성 (스크립트 미제출 시)
- 차트가 근거 역할을 하는데 C2 추출이 누락된 경우

## 10. 한계 및 이의제기 대응
- 슬라이드 역할 자동 분류는 오분류 가능 → support_ratio 경계값이면 REVIEW
- 시각 자료(차트)가 근거 역할을 하는 경우가 많아 C2의 차트 추출 결과를 근거 후보로 공유
- 이의제기 시 제공: 슬라이드별 역할 분류 결과, 근거 없다고 판정한 주장과 사유
- 지원자가 발표 스크립트를 보강 제출하면 매칭 재산정

## 11. 예시
**통과**: `{support_ratio:1.0, flow:"문제→분석→해결→효과 명확"}` → `{score:5.0, passed:true, confidence:0.85}`
**탈락**: `{support_ratio:0.3, unsupported_claims:["S1","S2","S3"]}` → `{score:2.0, passed:false}`
**경계**: `{support_ratio:0.5, role_classification_conf:0.55}` → `{score:3.0, review_required:true}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
