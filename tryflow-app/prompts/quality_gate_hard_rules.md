# Quality Gate — Hard Rules (1/2)

하드 룰은 `app/api/analysis/route.ts` 의 `runQualityGate()` 함수에서 강제된다. 이 md 파일은 **사람이 읽기 위한 원본 정의** — 임계값이 바뀌면 코드와 이 문서를 **같이** 업데이트해야 한다.

LLM 호출 없이 통과/차단을 결정한다. 하나라도 걸리면 **422 응답 + hints** 반환, 2단계 LLM 게이트로 넘어가지 않음.

## 룰 정의

| # | 체크 | 임계값 | 실패 시 힌트 |
|---|---|---|---|
| 1 | description 길이 | `trim().length ≥ 30` | "아이디어 설명을 최소 30자 이상 작성해주세요 (현재 N자)." |
| 2 | target_user 길이 | `trim().length ≥ 2` | "대상 사용자를 좀 더 구체적으로 적어주세요." |
| 3 | description 에 실제 언어 문자 존재 (Hangul / Latin / Hiragana / Katakana / CJK) | desc.length ≥ 10 일 때만 적용 | "설명에 실제 언어 문자 (한글/영어 등) 가 포함되어야 합니다." |
| 4 | unique-character 비율 (공백 제외, length ≥ 10 일 때만 적용) | 길이별 차등: length < 60 → `ratio ≥ 0.25`, 60 ≤ length < 200 → `ratio ≥ 0.15`, length ≥ 200 → `ratio ≥ 0.06` | "반복된 문자 비율이 너무 높습니다. 실제 아이디어 설명을 작성해주세요." |
| 5 | 동일 단어 반복 비율 | 가장 많이 등장한 단어 / 전체 단어 수 ≤ 0.6 (단어 수 ≥ 5, 단어 길이 ≥ 2 인 것만 카운트) | "같은 단어가 과도하게 반복됩니다." |

## 통과 시

2단계 (LLM 게이트 → `prompts/quality_gate.md`) 로 넘긴다.

## 실패 응답 형식

```json
{
  "error": "idea_too_vague",
  "stage": "hard",
  "message": "입력이 너무 부실해서 분석을 건너뛰었습니다.",
  "hints": ["<룰에서 제공한 한국어 힌트 1>", "..."]
}
```

HTTP status: **422 Unprocessable Entity**

## 설계 원칙

- **비용**: LLM 호출 0. 오직 정규식 / 문자열 연산.
- **커버리지**: 명백한 쓰레기 (`asdf`, `ㅁㅇㅁㅇ`, `test test test`, 숫자만) 를 상위에서 컷. 미묘한 "성의 없음" 은 2단계 LLM 이 처리.
- **False positive 회피**: 한국어/CJK + 마크다운 긴 문서 (조사·어미 반복 + `|`, `#`, `---` 심볼 반복) 는 자연적으로 unique-char 비율이 낮음. 룰 #4 임계값은 길이에 따라 tiered (짧으면 엄격, 길면 관대) 로 설계되어 긴 한국어 pitch 는 통과, 짧은 키보드 매쉬 (`asdfasdf`) 는 차단.
- **언어 중립**: 한글 / 영어 / 일본어 / 중국어 모두 "실제 언어" 로 인정.
