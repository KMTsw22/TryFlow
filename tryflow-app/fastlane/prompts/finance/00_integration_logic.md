# 00: 통합 평가 로직 / Integration Logic

> 산출물 유형 판별 → 해당 엔진 호출 → 금융지식 엔진 연계 → 통합 점수·순위 산출 → 이의제기까지의 전체 흐름을 정의한다.

## 1. 라이브러리 구조
| 구분 | 파일 | 역할 |
|------|------|------|
| 공유 엔진 | core_financial_knowledge_engine.md | 금융지식 6레이어 × 5메커니즘. A·B·C 모든 기준이 호출 |
| 그룹 A (기획안/제안서) | A1 문제 실재성 / A2 금융 메커니즘 정합성 / A3 기대효과 정량성 | 금감원·DB IFC·FSI 공모 트랙 |
| 그룹 B (분석보고서/논문) | B1 프레임워크 적절성 / B2 데이터 신뢰성·해석력 / B3 추론 엄밀성 | 한국은행·DB IFC·FSI 결과보고서 |
| 그룹 C (발표자료/PT) | C1 메시지 금융 논리 / C2 시각화 정직성 / C3 근거-주장 구조 | 전 대회 본선 PT + 금감원 PPT |

> 자격·형식·표절은 산출물 종류와 무관한 범용 전제 게이트로, 정교한 평가 대상에서 제외하고 §5의 사전 게이트로만 처리한다.

## 2. 산출물 유형 판별
```
function route(submission):
    step 1: signals = {파일형식, 슬라이드 구조 비율, 섹션 헤더 패턴, 페이지/슬라이드 수}
    step 2: artifact = classifier(signals)
            # 슬라이드형(장당 텍스트<120어, 도형 다수) → C
            # 논문/보고서 구조(초록·방법론·참고문헌 헤더) → B
            # 제안 블록 구조(문제정의·솔루션·기대효과 헤더) → A
    step 3: if classifier.confidence < 0.7: use organizer.declared_artifact_type
    step 4: return engine_group[artifact]   # A / B / C
```
- 한 대회가 복수 산출물을 받으면(예: FSI = 코드+보고서, 본선 = 보고서+PT) 각 산출물에 해당 엔진을 적용 후 §4.3으로 합산한다.

## 3. 평가 호출 흐름
```
function evaluate(submission):
    step 1: group = route(submission)                         # A / B / C
    step 2: fk = CORE_FK.evaluate(submission, artifact_type=group)   # 금융지식 엔진 1회 실행
    step 3: for criterion in group.criteria:                  # A1~A3 / B1~B3 / C1~C3
                result[criterion] = criterion.evaluate(submission, fk)
                # 각 기준은 fk.layer_scores·violations·claims를 재사용 (LLM 중복 호출 방지)
    step 4: if fk.violations has CRITICAL: applicant.CRITICAL_FLAG = true
    step 5: return aggregate(result, fk)
```

## 4. 점수 합산
### 4.1 정규화
각 기준의 raw 점수(1.0~5.0)를 0~100으로 정규화한다.
```
normalized = (raw − 1.0) / 4.0 × 100
```
- SKIP 처리된 기준(예: 차트 없는 덱의 C2)은 합산에서 제외하고 가중치를 §4.2로 재분배.
- REVIEW 상태 기준은 잠정 점수로 합산하되 지원자 전체를 HOLD로 표시.

### 4.2 가중 평균 및 가중치 재분배
```
선택 기준 집합 S = {c1..ck}, 주최자 지정 가중치 wi (합 100%)
평가 가능한 기준 집합 S' = S − {SKIP 기준} − {데이터 결손 기준}
재분배 가중치 wi' = wi / Σ(wj for j in S')
통합점수 = Σ(wi' × normalized_i)  for i in S'
```
- 단일 기준 가중치가 60%를 초과하면 편중 경고를 표시한다.

### 4.3 복수 산출물 합산
한 지원자가 산출물 2개 이상(예: 보고서 + PT)을 제출하면:
```
산출물별 통합점수를 산출 후, 주최자 지정 산출물 가중치로 재차 가중 평균
기본 산출물 가중치: 핵심 산출물 70% + 보조 산출물(PT 등) 30%
```

### 4.4 CRITICAL 캡
`CRITICAL_FLAG`(금융지식 치명적 오개념)가 있으면:
- 모드 A: 즉시 REJECTED (사람 검토 1회 후 확정)
- 모드 B: 통합점수를 **40점 이하**로 캡

## 5. 사전 게이트 (범용, 비핵심)
점수 평가 이전에 통과/탈락만 판정하는 최소 게이트. 규칙 검사만 수행한다.
```
function pre_gate(submission):
    - 자격: 참가 대상·팀 구성 규칙 위반 → REJECTED
    - 형식: 마감 초과·허용되지 않은 파일 형식·필수 항목 누락 → REJECTED
    - 표절: 유효 표절률 임계 초과 → REJECTED, 경계 구간 → HOLD
    - 판정 불가(증빙 판독 실패 등) → 자동 탈락이 아닌 HOLD
```

## 6. 모드 A / 모드 B 분기
### 6.1 모드 A — 탈락 모드
```
function mode_A(submission):
    step 1: if pre_gate(submission) == REJECTED: return REJECTED
    step 2: fk + criteria 평가
    step 3: if CRITICAL_FLAG: return REJECTED(reason="금융지식 치명적 오개념", needs_human_confirm=true)
    step 4: for c in selected_criteria:
                if c.score < c.threshold: return REJECTED(reason=c.id)
                if c.review_required: mark HOLD
    step 5: return PASSED  (HOLD면 사람 검토 후 확정)
```
### 6.2 모드 B — 순위 모드
```
function mode_B(submission):
    step 1: if pre_gate(submission) == REJECTED: return EXCLUDED(score=0)
    step 2: integrated = weighted_average(selected_criteria)   # §4
    step 3: if CRITICAL_FLAG: integrated = min(integrated, 40)
    step 4: return RANKED(score=integrated, hold=any(review_required))
```

## 7. 대회 유형별 가중치 프리셋
주최자가 직접 조정하지 않을 경우의 권장 기본값. 각 기준 파일 §5의 대회 유형별 임계값과 함께 적용한다.

### 7.1 아이디어/기획 공모전 (예: 금감원 금융공모전)
| 산출물 | 기준 | 가중치 |
|--------|------|:--:|
| A 기획안 | A1 문제 실재성 / A2 메커니즘 정합성 / A3 기대효과 정량성 | 25 / 40 / 20 |
| C PT | C1 메시지 논리 / C3 근거-주장 구조 | 10 / 5 |
> 금융지식 엔진(CORE-FK)은 A1·A2·A3에 내재되어 별도 가중 없이 반영.

### 7.2 정책·논문형 대회 (예: 한국은행 통화정책 경시대회)
| 산출물 | 기준 | 가중치 |
|--------|------|:--:|
| B 보고서 | B1 프레임워크 / B2 데이터 / B3 추론 엄밀성 | 25 / 25 / 35 |
| C PT | C1 메시지 논리 | 15 |

### 7.3 데이터·AI 경진대회 (예: FSI AIxData Challenge)
| 산출물 | 기준 | 가중치 |
|--------|------|:--:|
| B 결과보고서 | B1 / B2 / B3 | 20 / 30 / 25 |
| A 기획서(공모 트랙) | A1 / A2 / A3 | 합산 시 산출물 가중 적용 |
| C 발표 | C1 / C3 | 15 / 10 |

### 7.4 금융권 주관 대학생 대회 (예: DB IFC)
| 산출물 | 기준 | 가중치 |
|--------|------|:--:|
| A 또는 B (택1) | 해당 그룹 3기준 | 30 / 35 / 20 |
| C PT | C1 / C2 / C3 | 6 / 5 / 4 |

## 8. 기준 간 충돌 해결 규칙
1. **사전 게이트 우선**: 게이트 REJECTED면 이후 평가 생략.
2. **CRITICAL 우선**: CORE-FK가 CRITICAL 오개념을 반환하면 다른 기준 점수가 높아도 결격(모드 A)/점수 캡(모드 B).
3. **REVIEW 전파**: 어느 기준이든 review_required면 지원자 전체를 HOLD로 두고 사람 검토 강제. 자동 탈락 금지.
4. **점수 괴리**: 한 산출물의 기준 간 점수가 3점 이상 괴리하거나 confidence<0.6인 기준이 있으면 HOLD.
5. **데이터 결손**: 필수 입력 누락 기준은 모드 A에서 HOLD, 모드 B에서 §4.2 가중치 재분배.

## 9. 본선 진출자 추천 (모드 B)
```
function recommend_finalists(ranked, N):
    step 1: pool = [a for a in ranked if a.status not in (EXCLUDED, HOLD)]
    step 2: sort pool by integrated_score desc
    step 3: finalists = pool[0:N]
    step 4: 동점이 N 경계를 가를 때 tie-break (순서대로 적용):
            ① CORE-FK 금융지식 점수 높은 지원자 우선
            ② review_required 0건인 지원자 우선
            ③ 핵심 기준(대회 유형별 최고 가중 기준) 점수 높은 순
            ④ 제출 시각 빠른 순
            그래도 동점이면 동점자 전원 포함 + tie_review 표시
    step 5: HOLD 지원자는 'review_required' 목록으로 분리 제시
    return { recommended, tie_review, review_required }
```
- 시스템은 추천만 하며, 최종 본선 진출자 확정은 주최자가 수행한다.

## 10. 이의제기 처리 절차
지원자가 결과에 이의를 제기하면 다음 절차를 따른다.
```
function handle_appeal(applicant, appeal):
    step 1: 자동 평가 패키지 공개 — 기준별 score·rationale·evidence·quote·ref,
            CORE-FK violations(rule_id·정정·출처), confidence, REVIEW 트리거 여부
    step 2: appeal.type 분류:
            (a) 사실 오류 주장(틀린 RAG 대조, 오탐) → 해당 기준만 부분 재평가
            (b) 추가 자료 제출(출처 보강, 발표 스크립트) → 영향받는 subscore만 재산정
            (c) 정성 판정 이견(견해차) → 도메인 전문가 1인 추가 검토
    step 3: 재평가 결과가 기존과 다르면 통합점수·순위 재산출, 동일하면 사유와 함께 기각
    step 4: 모든 이의제기 처리 이력을 보존 (재현 가능성·감사 대응)
```
- 자동 판정만으로 최종 탈락이 확정되지 않으며, 이의제기 기간 종료 후 주최자가 확정한다.

## 11. 통합 출력 포맷 (JSON)
```json
{
  "applicant_id": "string",
  "artifact_type": "A | B | C | multi",
  "mode": "A | B",
  "final_status": "PASSED | REJECTED | EXCLUDED | HOLD",
  "integrated_score": "number (0-100, 모드 B)",
  "rank": "number (모드 B)",
  "financial_knowledge": { "score": "number", "critical_flag": "boolean", "violations": ["MC-XX"] },
  "criteria_results": [
    { "criterion_id": "A1|A2|...", "score": "number", "normalized": "number", "weight": "number",
      "confidence": "number", "review_required": "boolean" }
  ],
  "rejection_reason": "string | null",
  "review_required": "boolean",
  "recommended_finalist": "boolean",
  "appeal_package_ready": "boolean"
}
```

## 12. 운영 원칙
- 시스템은 의사결정 보조 도구이며, 탈락·본선 진출 확정은 주최자(사람)가 수행한다.
- 금융지식 CRITICAL 판정과 규제 위반 판정은 자동 결격 확정 전 사람 검토를 1회 거친다.
- 단일 기준 가중치 60% 초과 시 편중 경고를 표시한다.
- 모든 자동 판정에 rationale·evidence·quote·ref·confidence를 첨부하여 이의제기에 대응한다.
- 평가 모델·룰셋·지식그래프 버전을 결과에 기록하여 재현성을 보장한다.

## 13. 변경 이력
- v1.0 (2026-05-13): 산출물 유형 기반 + 금융지식 엔진 중심 구조로 재설계
- v2.0 (2026-05-13): 대회 유형별 가중치 프리셋, 정규화·가중치 재분배 공식, 복수 산출물 합산, 동점 처리 세분화, 이의제기 절차 추가
