# Quality Gate — Hard Rules

하드 룰은 `app/api/analysis/route.ts` 의 `runQualityGate()` 함수에서 강제된다. 이 md 파일은 **사람이 읽기 위한 원본 정의** — 임계값이 바뀌면 코드와 이 문서를 **같이** 업데이트해야 한다.

LLM 호출 없이 통과/차단을 결정한다. 하나라도 걸리면 **422 응답 + hints** 반환, agent 분석 단계로 넘어가지 않음.

> 2026-04: 옛날엔 2단 게이트였으나 (hard rules + LLM gate) LLM 게이트는 hard rules 가 이미 실제 쓰레기를 다 거른다는 판단으로 제거됐다. 현재는 hard rules 만.

## 룰 정의

새 6-axis 제출 폼은 각 axis 답변이 form 단에서 이미 30자 이상 검증된다. `runQualityGate` 는 `axes` 인자가 들어오면 일부 룰을 완화한다 (`hasAxes` flag).

| # | 체크 | 임계값 | hasAxes 시 동작 | 실패 시 힌트 |
|---|---|---|---|---|
| 1 | description 길이 | `trim().length ≥ 30` | 스킵 (axis 별 검증으로 대체) | "아이디어 설명을 최소 30자 이상 작성해주세요 (현재 N자)." |
| 2 | target_user 길이 | `trim().length ≥ 2` | 동일 적용 | "대상 사용자를 좀 더 구체적으로 적어주세요." |
| 3 | description 에 실제 언어 문자 존재 (Hangul / Latin / Hiragana / Katakana / CJK) | desc.length ≥ 10 일 때만 적용 | 동일 적용 | "설명에 실제 언어 문자 (한글/영어 등) 가 포함되어야 합니다." |
| 4 | unique-character 비율 (공백 제외, length ≥ 10 일 때만 적용) | 길이별 차등: length < 60 → `ratio ≥ 0.25`, 60 ≤ length < 200 → `ratio ≥ 0.15`, length ≥ 200 → `ratio ≥ 0.06` | **스킵** (axis 답변이 "Market: ...\nProblem: ..." 으로 concat 되면 라벨 반복으로 false positive 빈발) | "반복된 문자 비율이 너무 높습니다. 실제 아이디어 설명을 작성해주세요." |
| 5 | 동일 단어 반복 비율 | 가장 많이 등장한 단어 / 전체 단어 수 (단어 수 ≥ 5, 단어 길이 ≥ 2 인 것만 카운트) — 비율이 임계값 초과면 차단 | 임계값 완화: 0.6 → **0.75** (axis 라벨 "Market/Problem/..." 자체가 반복어로 잡힘) | "같은 단어가 과도하게 반복됩니다." |

## 실패 응답 형식

```json
{
  "error": "idea_too_vague",
  "stage": "hard_gate",
  "message": "입력이 너무 부실해서 분석을 건너뛰었습니다.",
  "hints": ["<룰에서 제공한 한국어 힌트 1>", "..."]
}
```

HTTP status: **422 Unprocessable Entity**

## 통과 시

곧바로 6 Agent × 3-Pass 분석으로 넘어간다.

## 설계 원칙

- **비용**: LLM 호출 0. 오직 정규식 / 문자열 연산.
- **커버리지**: 명백한 쓰레기 (`asdf`, `ㅁㅇㅁㅇ`, `test test test`, 숫자만) 를 상위에서 컷.
- **False positive 회피**: 한국어/CJK + 마크다운 긴 문서 (조사·어미 반복 + `|`, `#`, `---` 심볼 반복) 는 자연적으로 unique-char 비율이 낮음. 룰 #4 임계값은 길이에 따라 tiered (짧으면 엄격, 길면 관대) 로 설계되어 긴 한국어 pitch 는 통과, 짧은 키보드 매쉬 (`asdfasdf`) 는 차단. 6-axis 폼 제출은 룰 #4 자체를 스킵 (form 단에서 이미 axis 별 30자 검증).
- **언어 중립**: 한글 / 영어 / 일본어 / 중국어 모두 "실제 언어" 로 인정.
