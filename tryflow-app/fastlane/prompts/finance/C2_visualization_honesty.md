# C2: 데이터 시각화 정직성 / Data Visualization Honesty

> **산출물 그룹 C — 발표자료(PT 덱).** 벤치마크: 금융감독원 금융공모전(PPT), 한국은행·DB IFC·FSI 본선 PT

## 1. 메타데이터
- **기준 ID**: C2
- **산출물 유형**: 발표자료(PT 덱)
- **평가 유형**: 혼합 (이미지 분석 + 정성 판정)
- **자동화 수준**: 반자동
- **호출 엔진**: CORE-FK (레이어 L5 중심), M4 RAG

## 2. 평가 대상
PT 덱의 차트·그래프가 **데이터를 정직하게 시각화했는지** 검증한다. 금융 데이터 시각화는 설득을 위해 왜곡되기 쉽다 — Y축 절단으로 변화 과장, 비례 왜곡, 유리한 구간만 발췌(체리피킹), 이중축 오용. 디자인의 미려함이 아니라 시각화가 데이터의 진실을 호도하지 않는지를 본다.

## 3. 입력 명세
| 필드명 | 타입 | 출처 | 필수 |
|--------|------|------|------|
| chart_images | array<image> | 슬라이드 차트 추출 | 필수 |
| chart_captions | array<string> | 슬라이드 텍스트 | 선택 |
| underlying_data_refs | array<string> | 차트 출처 표기 | 선택 |

## 4. 평가 엔진 메커니즘
```
function evaluate(submission, fk):
    step 1: charts = extract_charts(chart_images)
    step 2: if charts empty: return (NA, SKIP)   # 통합 로직에서 가중치 재분배
    step 3: for chart in charts:
                axis     = detect_truncated_axis(chart)        # Y축 0 미시작 + 변화 과장
                proportion = detect_proportion_distortion(chart)
                cherry   = detect_selective_window(chart, M4_full_series(underlying_data_refs))
                dual_axis = detect_misleading_dual_axis(chart)
                caption  = caption_vs_chart_consistency(chart, chart_captions)
    step 4: penalty = Σ severity_weight(violations)   # CRITICAL=2.0, MAJOR=1.0, MINOR=0.5
    step 5: raw = 5 − penalty
    step 6: if cherry confirmed by M4 (전체 시계열 대비 명백): raw = min(raw, 2.0)
    step 7: conf = confidence_formula(image_recognition_conf, rag_hit_rate, ...)
    return (max(round1(raw),1.0), PASS if raw>=3.0 else FAIL, conf)
```

## 5. 가중치·임계값 (대회 유형별)
| 항목 | 기본값 | 아이디어형(금감원) | 정책·논문형 PT | 데이터·AI형 발표 |
|------|:--:|:--:|:--:|:--:|
| 통과 임계값(raw) | 3.0 | 2.8 | 3.0 | 3.2 |
| CRITICAL 위반 패널티 | 2.0 | 2.0 | 2.0 | 2.5 |
| MAJOR 위반 패널티 | 1.0 | 1.0 | 1.0 | 1.0 |
| 순위 모드 권장 가중치 | 10~15% | 10% | 15% | 15% |
> 차트가 없는 덱은 SKIP — 00_integration_logic.md §4의 가중치 재분배 규칙 적용.

## 6. 점수 루브릭
| 점수 | 판정 기준 | 예시 |
|------|-----------|------|
| 5 | 축·비례·구간·캡션 모두 정직 | Y축 0 시작, 전체 구간 표시, 캡션이 데이터와 일치 |
| 4 | 정직하나 경미한 표기 누락 1건 | 로그축 미표기 등 |
| 3 | 경계성 왜곡 1건 (의도 불명확) | Y축 절단이나 맥락상 허용 가능 |
| 2 | 명백한 왜곡 1건 | 호황기 구간만 발췌해 추세 호도 |
| 1 | 왜곡 다수 또는 캡션이 데이터를 정면 호도 | 축 절단 + 체리피킹 + 과장 캡션 |

## 7. LLM 채점 프롬프트 (few-shot)
```
[시스템]
당신은 금융 데이터 시각화 검증 심사위원이다. 차트 이미지·캡션과 전체 원본 시계열을 비교해
[시각화 정직성]을 1~5점 평가하라. 5점=축·비례·구간·캡션 모두 정직 / 3점=경계성 표현 1건(의도적 호도로
보긴 어려움) / 1점=축 절단·구간 발췌·과장 캡션으로 데이터 호도.

[예시 1]
입력: "선그래프, Y축 0부터 시작, 2015~2025 전체 구간 표시, 캡션 '가계부채 증가세'."
출력: {"score": 5, "rationale": "축 기준·표시 구간이 정직하고 캡션이 데이터 추세와 일치함.", "distortions": []}

[예시 2]
입력: "막대그래프, Y축이 98에서 시작(0 미시작), 2칸 차이를 4배 높이로 표현, 캡션 '폭발적 성장'. 원본 시계열상 실제 증가율은 2%."
출력: {"score": 1, "rationale": "Y축 절단으로 미미한 변화를 폭발적 성장처럼 과장하고 캡션이 이를 강화함.", "distortions": [{"text":"Y축 0 미시작 + 과장 캡션","type":"축절단"}]}

[예시 3]
입력: "수익률 차트가 2020~2021 호황기만 표시. 원본 시계열에는 2022 급락 구간 존재."
출력: {"score": 2, "rationale": "유리한 호황기 구간만 발췌해 전체 추세를 호도함.", "distortions": [{"text":"호황기 구간만 발췌","type":"체리피킹"}]}

[출력 형식] {"score": <1-5>, "rationale": "<2문장>", "distortions": [{"text":"...","type":"축절단|비례왜곡|체리피킹|이중축오용|캡션불일치"}]}
```

## 8. 출력 포맷
```json
{
  "criterion_id": "C2",
  "applicant_id": "string",
  "score": "number (1.0-5.0) | null(SKIP)",
  "passed": "boolean | null",
  "rationale": "string",
  "evidence": ["탐지된 왜곡 유형", "원본 시계열 대조 결과"],
  "subscores": { "axis": "ok", "proportion": "ok", "cherry_pick": "suspected", "caption": "ok" },
  "review_required": "boolean",
  "confidence": "number (0-1)"
}
```

## 9. REVIEW 트리거 조건
- "왜곡 다수"(`raw ≤ 2.0`) 판정 — 차트 이미지 인식 한계로 사람 검토 후 확정
- `cherry`(체리피킹) 의심이나 underlying_data_refs 미표기로 M4 대조 불가
- Y축 절단이 분야 관행상 허용되는 맥락(예: 환율 일중 변동)
- `confidence < 0.6` (이미지 인식 신뢰도 낮음)

## 10. 한계 및 이의제기 대응
- 차트 이미지 인식은 정확도 한계가 있다 → 자동 탐지는 보조용, 탈락 판정은 REVIEW 후 확정
- Y축 절단은 분야 관행상 허용되기도 함 → 단독 탈락 사유로 쓰지 않음
- 이의제기 시 제공: 탐지된 왜곡 유형과 해당 차트, 원본 시계열 대조 그래프
- 지원자가 원본 데이터를 보강 제출하면 cherry_pick 항목 재산정

## 11. 예시
**통과**: `{charts:"Y축 0 시작, 전체 구간, 캡션 정확"}` → `{score:5.0, passed:true, confidence:0.85}`
**탈락**: `{distortions:[{type:"체리피킹"},{type:"축절단"}], caption:"폭발적 성장"}` → `{score:1.0, passed:false}`
**경계**: `{distortions:[{type:"축절단"}], context:"환율 일중 변동(관행 허용)"}` → `{score:3.0, review_required:true}`

## 12. 변경 이력
- v1.0 (2026-05-13): 초기 버전
- v2.0 (2026-05-13): 대회 유형별 가중치·임계값, few-shot 프롬프트, confidence·REVIEW 트리거, SKIP 처리, 이의제기 대응 추가
