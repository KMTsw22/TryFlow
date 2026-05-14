# A2: 솔루션의 금융 메커니즘 정합성 / Financial Mechanism Soundness

> **산출물 그룹 A — 기획안/제안서.** 벤치마크: 금융감독원 금융공모전, DB IFC(기획안), FSI AIxData Challenge(공모 트랙)

## 1. 메타데이터
- **기준 ID**: A2
- **산출물 유형**: 기획안/제안서
- **평가 유형**: 정성 (금융지식 엔진 연계 — A그룹 핵심 기준)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L2·L4 중심), M1 지식그래프, M2 룰셋, M4 규제 RAG

## 2. 평가 대상
제안한 솔루션이 **금융적으로 성립하는가** — 수익모델·리스크 구조·자금 흐름·규제 적합성이 금융 작동원리와 모순되지 않는지 검증한다. 일반 아이디어 공모전이라면 "참신함"으로 통과될 제안도, 금융 메커니즘이 깨지면(무위험 고수익, 자금 출처 불명, 무인가 영업) 본 기준에서 탈락한다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| proposed_solution | string | 제출물 파싱(솔루션 블록) | 필수 |
| revenue_model | string | 제출물 파싱 | 선택 |
| risk_description | string | 제출물 파싱 | 선택 |
| regulatory_refs | array<string> | 제출물 파싱 | 선택 |
| contest_domain | string | 대회 등록 정보 | 필수 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: claims = fk.claims filtered to solution block
    step 2: kg = M1_graph_check(claims.CAUSAL)        # 위험-수익, 유동성-수익성 엣지 충돌
    step 3: if kg has CRITICAL: return (1.0, FAIL, conf=0.9)   # 금융 제1원칙 위반
    step 4: mc = M2_ruleset(claims)                   # 0~5, 심각도별 감점
    step 5: reg = M4_rag_verify(regulatory_refs ∪ implied_regulation(solution))
            if reg == VIOLATION: return (1.0, FAIL, conf=0.85)
    step 6: coherence = M5(자금흐름이 닫히는가, 수익원이 명시되는가, 리스크 귀속 주체가 있는가)  # 0~5
    step 7: kg_score = 5 − kg.minor_penalty
    step 8: raw = 0.45*kg_score + 0.20*mc + 0.20*reg_score + 0.15*coherence
    step 9: if reg == GRAY: review = true
    step 10: conf = confidence_formula(...)
    return (round1(raw), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 아이디어형(금감원) | 핀테크·서비스형(은행권) | 데이터·AI형(FSI 공모) |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 2.8 | 3.2 | 3.0 |
| kg_score 가중 | 0.45 | 0.45 | 0.40 | 0.45 |
| reg_score 가중 | 0.20 | 0.15 | 0.30 | 0.20 |
| 순위 모드 권장 가중치 | 25~35% | 30% | 35% | 25% |
> CRITICAL(kg 부호충돌, 규제 VIOLATION)은 가중치와 무관하게 즉시 FAIL — 게이트 성격.

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 수익모델·리스크·규제가 모두 금융적으로 정합 | 수익원 명확, 리스크 전가 구조 설계, 규제 적합 |
| 4 | 메커니즘 정합하나 리스크 서술 일부 부족 | 수익모델 명확, 리스크 식별 개략적 |
| 3 | 큰 틀은 성립하나 자금흐름·수익원 불명확 | "수수료로 운영" 수준 모호 |
| 2 | 금융 메커니즘에 결함 (오개념 다수) | 리스크 주체 불명, 명목·실질 혼동 |
| 1 | 금융 제1원칙 위반 또는 규제 명백 저촉 | 무위험 고수익 보장, 무인가 금융업 전제 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융 상품 구조·규제에 정통한 심사위원이다. 솔루션을 [금융 메커니즘 정합성]으로 1~5점 평가하라.
5점=수익원·자금흐름·리스크 귀속·규제 적합성이 모두 금융 원리에 부합 / 3점=큰 틀은 성립하나 수익모델·자금흐름 모호
/ 1점=위험-수익 상충 등 제1원칙 위반 또는 규제 명백 저촉.

[예시 1]
입력: "B2B 매출채권 팩토링 중개. 수수료 수익. 매출처 부도위험은 신용보험으로 전가."
출력: {"score": 5, "rationale": "수익원이 명확하고 리스크 귀속·전가 구조가 금융 원리에 부합함.", "flaws": []}

[예시 2]
입력: "원금 100% 보장하면서 연 12% 확정 수익을 지급하는 투자 플랫폼."
출력: {"score": 1, "rationale": "원금 보장과 고수익 확정은 위험-수익 상충 원칙을 정면 위반함.", "flaws": [{"text":"무위험 고수익 보장","severity":"CRITICAL"}]}

[예시 3]
입력: "앱으로 모은 포인트를 굴려 사용자에게 이자를 준다. 재원은 추후 마련."
출력: {"score": 2, "rationale": "수익원과 자금 흐름이 닫히지 않아 메커니즘에 결함이 있음.", "flaws": [{"text":"수익원 불명","severity":"MAJOR"}]}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "flaws": [{"text":"...","severity":"CRITICAL|MAJOR|MINOR"}]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "A2",
  "applicant_id": "string",
  "score": "number (1.0-5.0)",
  "passed": "boolean",
  "rationale": "string",
  "evidence": ["지식그래프 충돌", "규제 적합성 결과", "자금흐름 평가"],
  "subscores": { "kg_score": 5.0, "misconception": 4.0, "regulatory": 4.0, "coherence": 4.0 },
  "regulatory_verdict": "FIT | GRAY | VIOLATION",
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- `regulatory_verdict == GRAY` — 신산업으로 규제 불명확 (규제 샌드박스 적용 가능성 검토)
- `kg.confidence < 0.6` — 지식그래프가 신종 금융구조 미수록 → LLM flaws와 교차 검증
- `regulatory_verdict == VIOLATION` — 자동 FAIL 전 사람 1회 검토 (규제 해석 오류 방지)
- LLM이 CRITICAL flaw를 보고했으나 M1·M2는 미탐지 — 신호 불일치

## 10. 한계 및 이의제기 대응
- 규제 해석은 전문 영역 → VIOLATION·GRAY 판정은 사람 검토 후 확정
- 지식그래프 미수록 구조는 UNVERIFIABLE 처리, 자동 결격 금지
- 이의제기 시 제공: 충돌한 지식그래프 엣지(출처 포함), 적용 규제 조항, LLM flaws

## 11. 예시
**통과**: `{solution:"매출채권 팩토링, 리스크 보험 전가", kg:정합, reg:FIT}` → `{score:4.8, passed:true, confidence:0.9}`
**탈락**: `{solution:"원금보장 연12% 확정수익"}` → `{score:1.0, passed:false, rationale:"위험-수익 상충 원칙 위반(CRITICAL)"}`
**경계**: `{solution:"조각투자 인프라 펀드", reg:GRAY}` → `{score:3.2, review_required:true, regulatory_verdict:"GRAY"}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, 이의제기 대응 추가
