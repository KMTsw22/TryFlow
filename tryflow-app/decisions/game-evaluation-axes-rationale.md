# 게임 대회 평가 축 선정 근거 (9축)

**작성일**: 2026-05-13
**최종 수정**: 2026-05-13 (텍스트 기반 AI 평가 한계 반영 → 그래픽·오디오·Polish 제거, 범위·실현가능성 + 개발 프로세스·QA 계획 추가)
**배경**: 게임 대회 도메인 추가. 기존 6축(SaaS/스타트업) 패턴을 따르되, 축은 게임 대회 업계의 표준 평가 체계에서 도출. 교수님 피드백("축을 어디서 가져왔냐") 동일 원칙 적용 — **모든 축은 1차 권위 소스에 근거**.

---

## 핵심 설계 원칙 — "텍스트 기반 AI 평가 가능성"

**제약**: 현재 proposals 스키마는 `title / team / summary` 텍스트만 받음. AI는 멀티모달 입력 (이미지·영상·실행 빌드) 을 받지 않는다.

**결과**: 텍스트만으로 평가 불가능한 축은 **의도적으로 제외**.

| 평가 불가 축 | 제외 사유 |
|---|---|
| ~~그래픽 (Visual Art)~~ | 스크린샷·아트워크를 볼 수 없음 |
| ~~오디오 (Audio)~~ | BGM·SFX·성우 연기를 들을 수 없음 |
| ~~완성도 (Polish)~~ | 빌드를 실행해 버그·성능을 검증할 수 없음 |

이 3축은 **본심 인간 심사위원 단계**로 위임. AI 단계는 **1차 서면 필터링** 역할.

대체 축: 텍스트로 평가 가능하면서 게임 대회 본질을 포착하는 2개 축을 신설.
- **범위·실현 가능성 (Scope & Feasibility)** — 팀 규모·기간 대비 컨셉 적정성
- **개발 프로세스·QA 계획 (Dev Process / QA Plan)** — Polish의 텍스트 평가 가능 대체 (QA 계획서·테스트 케이스·플랫폼 호환 명세)

---

## 출처 — 3대 권위 소스 (industry-standard)

| 출처 | 성격 | 평가 항목 |
|---|---|---|
| **Ludum Dare** (전세계 최대 인디 게임잼) | 참가자 상호 평가, 9 카테고리 | Innovation, Fun, Theme, Graphics, Audio, Humor, Mood, Overall, Community |
| **IGF (Independent Games Festival, GDC)** | 인디 게임 최고 권위 어워드, 전문 심사위원 250-300명 | Excellence in Visual Art / Audio / Design / Narrative + Nuovo + Grand Prize |
| **대한민국 게임대상** (문체부 주관) | 한국 게임 산업 공식 어워드 | 작품성(40%), 창작성(30%), 대중성(30%) — 본상 50% + 대국민 25% + 미디어 25% |

**출처 URL**
- [Ludum Dare Rules](https://ldjam.com/events/ludum-dare/rules)
- [IGF Judges, Jury & Rules](https://gdconf.com/igf-judges-jury-rules/)
- [IGF Competition Rules](https://igf.com/igf-competition-rules/)
- [대한민국 게임대상 심사기준 개편 (테크M)](https://www.techm.kr/news/articleView.html?idxno=116367)
- [게임대상 점수 비중 (게임메카)](https://www.gamemeca.com/view.php?gid=1756023)

**보조 출처 (신규 축 정당화용)**
- GDC Vault — "Postmortems & Scope Management" 강연 시리즈 (Scope & Feasibility 근거)
- IEEE Software Engineering Body of Knowledge (SWEBOK) — QA Planning (Dev Process 근거)

---

## 최종 9축

| # | 축 | 가중치 | 질문 | 1차 출처 |
|---|---|---|---|---|
| 1 | **재미 (Fun)** | 0.16 | 플레이가 본질적으로 즐거운가 | LD Fun, 게임대상 작품성 |
| 2 | **게임 디자인 (Game Design)** | 0.14 | 메커닉·레벨·밸런스가 잘 짜였는가 | IGF Excellence in Design, 게임대상 작품성 |
| 3 | **혁신성 (Innovation)** | 0.13 | 새로운 컨셉/메커닉/조합인가 | LD Innovation, 게임대상 창작성 |
| 4 | **스토리텔링/내러티브 (Narrative)** | 0.10 | 시나리오·줄거리·대화의 완성도 | IGF Excellence in Narrative, 게임대상 작품성 |
| 5 | **분위기/몰입감 (Mood)** | 0.10 | 정서적 임팩트·세계관 몰입도 | LD Mood |
| 6 | **테마 적합성 (Theme Fit)** | 0.10 | 대회 주제·제약 조건과의 부합도 | LD Theme |
| 7 | **범위·실현 가능성 (Scope & Feasibility)** | 0.10 | 팀 규모·기간 대비 적정 범위인가 | GDC Postmortems, 게임잼 평가 통용 |
| 8 | **개발 프로세스·QA 계획 (Dev Process)** | 0.09 | QA·테스트·플랫폼 호환 계획이 견실한가 | 게임대상 운영 안정성, SWEBOK QA Planning |
| 9 | **시장성/대중성 (Marketability)** | 0.08 | BM·플랫폼 적합성·리텐션 가능성 | 게임대상 대중성 |

**총점 계산**: 가중치 산술평균 (Σ w_i · x_i). 약점 축은 별도 하이라이트 (SaaS 6축과 동일 정책).

**합계 검증**: 0.16+0.14+0.13+0.10+0.10+0.10+0.10+0.09+0.08 = 1.00 ✓

---

## 축 매핑 — 3개 소스 ↔ 9축

```
Ludum Dare 9    : Innovation, Fun,  Theme, Graphics*, Audio*, Humor*, Mood, Overall*, Community*
IGF 5           :                          Visual*,   Audio*,                                  Design, Narrative, Nuovo*
게임대상 3        : (작품성: 그래픽*+사운드*+프로그래밍+레벨디자인+볼륨), (창작성: 신규IP+컨셉+장르독창), (대중성: DAU+BM+안정성)
보조           : GDC Postmortems (Scope), SWEBOK (QA Plan)

→ 통합 9축       : 1.Fun  2.Design  3.Innovation  4.Narrative  5.Mood  6.Theme  7.Scope  8.DevProcess  9.Marketability
```

`*` = 의도적 제외 (다음 섹션 참조).

---

## 의도적 제외 (인지된 trade-off)

| 제외 항목 | 출처 | 제외 사유 |
|---|---|---|
| **Graphics / Visual Art** | LD, IGF, 게임대상 | **텍스트 기반 AI 평가 불가** — 스크린샷을 볼 수 없음. 본심 인간 심사로 위임. |
| **Audio** | LD, IGF, 게임대상 | **텍스트 기반 AI 평가 불가** — 음악·SFX를 들을 수 없음. 본심 인간 심사로 위임. |
| **Polish / 완성도** | 게임대상 작품성 | **텍스트 기반 AI 평가 불가** — 빌드를 실행할 수 없음. 대체 축으로 "개발 프로세스·QA 계획" 도입 (계획 품질은 텍스트로 평가 가능). |
| **Humor** | LD | 장르 의존성 과다 — 호러·드라마·시리어스 게임에 적용 불가. 평가 형평성 저해. |
| **Overall** | LD | 다른 축의 가중평균으로 자동 산출되므로 독립 축으로 두면 중복. |
| **Community** | LD | 대회 외부 활동(소셜 미디어, 팬덤) 평가는 작품 본질과 무관 — 대회 평가 범위 이탈. |
| **Nuovo (IGF)** | IGF | "매체에 대한 새로운 관점"은 Innovation 축에 흡수. 독립 카테고리로 두기엔 정의 모호. |
| **IP 활용 범위** | 게임대상 창작성 | 학생·인디 대회 맥락에 부적합 (IP 소유 가정). |

---

## 결정적 인용 (발표 방어용)

1. **Ludum Dare Voting Rules**
   > "Games are rated in nine categories: innovation, fun, theme, graphics, audio, humor, mood, overall, and community."
   → 1·3·5·6 축의 직접 근거

2. **IGF Competition Categories**
   > "The Independent Games Festival will nominate six finalist standout titles in each of these categories: Excellence in Visual Art, Excellence in Audio, Excellence in Design, Excellence in Narrative, and Best Student Game."
   → 2·4 축의 직접 근거 (게임 디자인 축은 IGF가 가장 명시적)

3. **대한민국 게임대상 심사 항목**
   > "작품성(40%): 그래픽·사운드·프로그래밍의 완성도 및 조화, 스토리 전개·콘텐츠 균형·레벨 디자인, 콘텐츠의 볼륨. 창작성(30%): 신규 IP 개발 및 기존 IP 활용 범위, 게임 콘셉트 및 참신한 게임 내 콘텐츠, 장르적 독창성 및 다양성. 대중성(30%): DAU·리텐션·판매량, 플랫폼의 다양성, 매출 규모 및 비즈니스 모델, 운영 안정성."
   → 8·9 축의 직접 근거 + 1·2·4 축의 한국 산업 맥락 보강

4. **GDC Postmortems — Scope Management**
   > GDC Vault 의 인디 게임 postmortem 강연들이 가장 빈번하게 지적하는 단일 실패 원인은 "scope creep" / "feature creep". 학생·인디 대회에서 적정 범위 평가가 prediction 가치 높음.
   → 7 축 (Scope & Feasibility) 근거

5. **SWEBOK — Software Engineering Body of Knowledge, IEEE**
   > "Software Quality Management" 챕터에서 QA Planning 을 별도 knowledge area 로 명시. 코드 품질이 아닌 "QA 계획의 견실함" 자체가 학술적으로 검증 가능한 평가 항목.
   → 8 축 (Dev Process / QA Plan) 근거

---

## "AI 단계 + 인간 본심" 2단계 심사 모델

**현 설계는 1차 서면 심사 (AI) 와 본심 (인간 심사위원) 을 분리한다.**

| 단계 | 평가자 | 평가 축 |
|---|---|---|
| **1차 서면** | AI (9축) | Fun, Game Design, Innovation, Narrative, Mood, Theme, Scope, Dev Process, Marketability |
| **본심** | 인간 심사위원 | 위 9축 재검증 + **Graphics, Audio, Polish** (실제 빌드/영상으로 확인) |

**근거**: BIC Festival 2025 도 25인 심사위원이 3개월에 걸쳐 직접 플레이해 채점. AI 가 그래픽·오디오·Polish 를 텍스트로 평가하는 것은 **방법론적으로 정직하지 않다**. AI 는 텍스트로 검증 가능한 9축에 집중하고, 매체 의존적 3축은 인간이 본심에서 평가하는 게 학술적·실무적으로 타당.

**발표 방어 시 답변**:
> "AI 단계는 1차 서면 필터링입니다. 텍스트만으로 정직하게 평가 가능한 9개 축에 한정하고, 그래픽·오디오·완성도는 본심 심사위원이 실제 빌드와 영상을 확인해 평가합니다. 이는 BIC Festival 의 25인 심사위원 3개월 직접 플레이 모델과 동일한 분업입니다."

---

## 대회 성격별 가중치 변형 (향후 옵션)

기본 9축은 **균형형 (일반 대회)**. 대회 성격에 따라 가중치 재배분 가능:

- **인디 게임잼 (Ludum Dare 류)**: Innovation/Fun/Theme/Mood 가중치 ↑, Marketability ↓
- **학생 졸업작품 대회**: Scope/Dev Process/Game Design 가중치 ↑, Marketability ↓ (또는 제외)
- **상업 인디 대회 (BIC 류)**: Marketability/Dev Process 가중치 ↑, Theme ↓ (자유 주제)
- **스토리 중심 대회**: Narrative/Mood 가중치 ↑

`rubric_generator.md` 가 대회 description 을 받아 가중치를 자동 재배분하도록 설계.

---

## 향후 멀티모달 확장 시 로드맵

현재 9축 시스템에 추가 가능한 축 (proposals 스키마에 스크린샷·영상·플레이 URL 컬럼 추가 후):

| 축 | 도입 조건 | 평가 방법 |
|---|---|---|
| **Graphics / Visual Art** | screenshots[] 컬럼 추가 | Claude Vision API 로 스크린샷 분석 |
| **Audio** | gameplay_video_url 추가 | 트레일러 영상 오디오 트랙 분석 |
| **Polish** | project_url (itch.io / Steam) 추가 | WebFetch 로 코멘트·리뷰 scrape, 빌드 다운로드 가능성 검증 |
| **Accessibility** | accessibility_spec 필드 추가 | TGA Innovation in Accessibility 기준 평가 |

이 4축이 추가되면 13축 시스템으로 확장. 멀티모달 도입 시 발표·논문 후속 작업.

---

## 현재 설계에서 미포함 (인지된 한계)

- **접근성 (Accessibility)**: TGA 2020+ 공식 카테고리이지만, 학생/잼 대회에서 명시적 접근성 명세서 첨부 빈도가 낮아 평가 sparsity 발생. 멀티모달 확장 단계에서 별도 축으로 도입 검토.
- **재플레이성 (Replayability)**: 게임대상 "콘텐츠 볼륨"에 매핑되나 Game Design 축에 흡수. 분리 시 11축 시스템으로 확장 가능.
- **세계관 (Worldbuilding)**: Mood + Narrative 축에 분산 흡수. 스토리 중심 대회에서만 분리 의미 있음.
