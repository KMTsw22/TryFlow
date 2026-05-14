# C1: 핵심 메시지의 금융 논리성 / Core Message Financial Logic

> **산출물 그룹 C — 발표자료(PT 덱).** 벤치마크: 금융감독원 금융공모전(PPT), 한국은행·DB IFC·FSI 본선 PT

## 1. 메타데이터
- **기준 ID**: C1
- **산출물 유형**: 발표자료(PT 덱)
- **평가 유형**: 정성 (금융지식 엔진 연계)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L1·L2 중심), M2 오개념 룰셋, M1 지식그래프

## 2. 평가 대상
PT 덱이 압축해 전달하는 **핵심 메시지(한 줄 결론)가 금융적으로 옳은지** 검증한다. PT는 내용이 응축돼 오개념이 한 문장에 그대로 노출된다. "1장 요약 역검증" 메커니즘으로 핵심 주장을 추출하고, 그 주장의 금융 논리와 슬라이드 간 일관성을 본다. 전달 기술(디자인·발표력)이 아니라 메시지의 금융적 타당성을 본다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| deck_file | file (PDF/PPTX) | 발표자료 업로드 | 필수 |
| slide_texts | array<string> | 슬라이드 텍스트 추출 | 필수 |
| presentation_script | string | 발표 스크립트(있을 시) | 선택 |
| slide_count | integer | 자동 추출 | 필수 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: core_message = llm_extract_one_line_conclusion(slide_texts + presentation_script)
    step 2: if core_message.confidence < 0.5: return (2.0, REVIEW, conf=0.5)  # 핵심 메시지 불명확
    step 3: claims = fk.claims (slide 범위)
    step 4: mc = M2_ruleset([core_message] + claims)
    step 5: kg = M1_graph_check([core_message] + claims.CAUSAL)
    step 6: if mc has CRITICAL or kg has CRITICAL: return (1.0, FAIL, conf=0.9)
    step 7: consistency = back_verify(core_message, slide_texts)
            # 각 슬라이드가 핵심 메시지와 모순되지 않는가 (역검증)
    step 8: term = L1_term_accuracy(claims)
    step 9: raw = 0.40*(5 − mc_penalty) + 0.35*consistency + 0.25*term
    step 10: conf = confidence_formula(core_message.confidence, llm_self_consistency, ...)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 아이디어형(금감원 PPT) | 정책·논문형 본선 PT | 데이터·AI형 발표 |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 2.8 | 3.2 | 3.0 |
| mc_penalty 가중 | 0.40 | 0.40 | 0.45 | 0.40 |
| consistency 가중 | 0.35 | 0.35 | 0.30 | 0.35 |
| 순위 모드 권장 가중치 | 15~25% | 20% | 25% | 15% |

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 핵심 메시지 명확 + 금융 논리 정확 + 슬라이드 전부 일관 | 1줄 결론 도출 가능, 오개념 0, 용어 정확 |
| 4 | 메시지 명확·정확하나 슬라이드 1곳 표현 느슨 | 결론 명확, 일부 용어 느슨 |
| 3 | 메시지는 추출되나 금융 논리가 표면적 | 결론 도출되나 근거 연결 약함 |
| 2 | 핵심 메시지 불명확 또는 용어 오용 다수 | 무엇을 주장하는지 한 줄로 안 나옴 |
| 1 | 핵심 결론에 치명적 금융 오개념 | "금리 인하 = 통화량 감소" 결론 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융 공모전 심사위원이다. 발표자료에서 핵심 결론을 한 문장으로 추출하고, [핵심 메시지의 금융 논리성]을
1~5점 평가하라. 디자인·발표 기술은 평가하지 말라. 5점=메시지 명확 + 금융 논리 정확 + 슬라이드 일관
/ 3점=메시지 추출되나 논리 표면적 / 1점=핵심 결론에 치명적 오개념.

[예시 1]
슬라이드 요지: "thin-filer 청년 → 대안신용평가(통신·납부 데이터) 적용 → 1금융권 진입률 개선"
출력: {"score": 5, "core_message": "thin-filer 청년에게 대안신용평가를 적용하면 1금융권 진입률을 높일 수 있다", "rationale": "핵심 메시지가 한 문장으로 명확하고 금융 논리에 오류가 없음.", "misconceptions": []}

[예시 2]
슬라이드 요지: "기준금리 인하 → 시중 통화량 감소 → 물가 안정"
출력: {"score": 1, "core_message": "기준금리를 인하하면 통화량이 줄어 물가가 안정된다", "rationale": "핵심 결론이 기준금리-통화량 관계를 정반대로 서술한 치명적 오개념.", "misconceptions": ["MC-01: 기준금리 인하는 통화량 확대 압력"]}

[예시 3]
슬라이드 요지: 여러 주제가 섞여 핵심 결론이 한 문장으로 안 나옴
출력: {"score": 2, "core_message": null, "rationale": "슬라이드들이 단일 핵심 메시지로 수렴하지 않아 결론을 한 문장으로 추출할 수 없음.", "misconceptions": []}

[출력 형식] {"score": <1-5>, "core_message": "<1문장 또는 null>", "rationale": "<2문장>", "misconceptions": ["..."]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "C1",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "core_message": "string | null",
  "rationale": "string",
  "evidence": ["오개념 목록", "슬라이드 일관성 평가"],
  "subscores": { "misconception_penalty": 0.0, "consistency": 5.0, "term_accuracy": 5.0 },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- `core_message.confidence < 0.5` — 슬라이드만으로 핵심 메시지 추출 실패 (스크립트 보강 요청)
- 발표 스크립트 미제출로 슬라이드 텍스트만 입력 — 맥락 부족
- M2가 MINOR 오개념을 보고했으나 의도적 단순화 가능성 (발표 특성상 압축 허용)
- `confidence < 0.6`

## 10. 한계 및 이의제기 대응
- 슬라이드는 텍스트가 적어 LLM이 의도를 오해할 수 있다 → core_message 추출 confidence가 낮으면 REVIEW
- 의도적 단순화와 오개념을 구분 — 발표 특성상 압축은 허용, 틀린 것만 감점
- 이의제기 시 제공: 추출된 core_message, 탐지된 오개념(rule_id·정정), 슬라이드별 일관성 평가
- 지원자가 발표 스크립트를 보강 제출하면 전체 재평가

## 11. 예시
**통과**: `{core_message:"대안신용평가로 thin-filer 진입률 개선", misconceptions:[]}` → `{score:5.0, passed:true, confidence:0.9}`
**탈락**: `{core_message:"기준금리 인하=통화량 감소→물가 안정"}` → `{score:1.0, passed:false, rationale:"핵심 결론에 CRITICAL 오개념"}`
**경계**: `{core_message:null, extraction_confidence:0.45}` → `{score:2.0, review_required:true}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
