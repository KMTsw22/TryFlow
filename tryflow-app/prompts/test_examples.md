# 카테고리별 점수 양 극단 테스트 예시

폼에 그대로 복붙해서 시스템 보정이 정상 작동하는지 검증할 때 쓰는 reference. 9개 카테고리 각각에 대해 10점·90점 예시 제공.

## 카테고리 인덱스

- [SaaS / B2B](#saas--b2b)
- [Consumer App](#consumer-app)
- [Marketplace](#marketplace)
- [Dev Tools](#dev-tools)
- [Health & Wellness](#health--wellness)
- [Education](#education)
- [Fintech](#fintech)
- [E-commerce](#e-commerce)
- [Hardware](#hardware)

---

## SaaS / B2B

### 🔴 ~10점 예시 — 구조적 실패 SaaS

### 기본 정보

| 필드 | 값 |
|---|---|
| Category | SaaS / B2B |
| Target User | 50인 이하 한국 중소기업 IT 담당자 |

### 6-axis 답변

#### Market — 누가 아프고 얼마나 많은가
```
직원 50명 이하 중소기업의 IT 담당자가 사내 와이파이 비밀번호를 분기마다 바꾸는 게 귀찮을 때 쓰는 도구. 정확한 시장 크기는 모르겠지만 한국에 중소기업이 많으니까 클 거라고 생각함.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
지금은 그냥 사내 메신저에 새 비밀번호를 공지함. 큰 문제는 아니지만 가끔 직원이 못 봐서 다시 알려줘야 함. 1~2분 정도 시간이 걸림.
```

#### Timing — 왜 지금
```
특별한 이유는 없음. 와이파이 비번 바꾸는 게 귀찮다는 동료 말 듣고 그냥 만들어보고 싶었음.
```

#### Product — 무엇을 하나
```
와이파이 비밀번호를 자동으로 생성하고 직원들에게 슬랙/카카오톡으로 보내주는 SaaS. 사실 슬랙 봇으로 30분이면 만들 수 있는 기능이긴 함.
```

#### Defensibility — 따라 하기 어려운 점
```
딱히 없음. 누구든 일주일이면 똑같이 만들 수 있을 듯.
```

#### Business model — 누가 왜 돈을 내나
```
월 5천원 정도 받을 생각인데 사실 무료 슬랙 봇이 많아서 받을 수 있을지 모르겠음. 우선 무료로 풀고 나중에 생각해보려 함.
```

### 예상 axis 점수

| axis | 점수 |
|---|---|
| market_size | ~15 |
| problem_urgency | ~10 |
| timing | ~10 |
| product | ~12 |
| defensibility | ~8 |
| business_model | ~10 |
| **viability** | **~11** |

---

### 🟢 ~90점 예시 — 구조적 성공 SaaS

### 기본 정보

| 필드 | 값 |
|---|---|
| Category | SaaS / B2B |
| Target User | Series B+ ~ pre-IPO B2B SaaS 회사의 CISO / Head of Security |

### 6-axis 답변

#### Market — 누가 아프고 얼마나 많은가
```
한국·일본·EU 시장에 동시 진출하려는 글로벌 SaaS 회사의 CISO. SOC 2 / ISO 27001 / GDPR / K-ISMS / 일본 ISMAP 를 동시에 받아야 하는 회사가 한국에만 매년 200~400개 (KISA 통계 기준), 일본 200+, 아시아 SaaS 글로벌 진출 가속화로 매년 25%+ 성장. 단일 jurisdiction 도구 (Vanta, Drata) 만으로는 K-ISMS / ISMAP 컨트롤 매핑이 안 됨. ACV $30~80K 가능, TAM 글로벌 $4B+.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
현재 글로벌 진출 SaaS 의 보안팀은 jurisdiction 별로 SOC 2 는 Vanta, K-ISMS 는 한국 컨설팅펌, ISMAP 은 일본 컨설팅펌으로 따로 진행. 같은 통제 (예: 접근권한 로그) 를 3번씩 증빙 수집, 컨설팅 비용 jurisdiction 당 $50~150K, 인증 받는 데 6~12개월. 매년 갱신 시 이 작업이 반복됨. CISO 가 가장 시간을 많이 쓰는 1번 항목.
```

#### Timing — 왜 지금
```
(1) 한국 SaaS 의 일본·동남아 진출 가속화 (2024~2025 KISA 보고서: 글로벌 진출 SaaS 매년 30%+ 증가) (2) EU AI Act 2026 시행 → AI 컴포넌트 있는 SaaS 는 GDPR + AI Act 동시 대응 강제 (3) ISMAP 2025 개정으로 일본 정부조달 진입 가능해짐 (4) Vanta/Drata 가 한국·일본 controls 매핑을 안 함 — 글로벌 incumbent 의 sweet-spot blindspot.
```

#### Product — 무엇을 하나
```
단일 evidence collection layer (AWS/GCP/GitHub/Okta integration) 로 한 번 수집한 통제 증빙을 SOC 2 / ISO 27001 / GDPR / K-ISMS / ISMAP 5개 framework 의 controls 에 자동 매핑. CISO 가 jurisdiction 추가 시 새로 수집할 evidence 를 자동으로 식별 (gap analysis). 컨설팅펌 대비 시간 70%·비용 60% 절감, 갱신 작업은 90% 자동화. 단일 jurisdiction 도구 대비 multi-jurisdiction 매핑이 핵심 10x 차별화.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) Multi-jurisdiction control mapping ontology — 5개 framework × 평균 200 control = 1,000+ 매핑 관계. 매핑은 framework 개정마다 업데이트 필요해서 시간이 갈수록 누적.
(2) Auditor 네트워크 효과 — 한국·일본 인증기관과 직접 API 연동 (제출 자동화). 신규 진입자는 인증기관과 별도 협상 필요.
(3) 데이터 — 고객사 audit pass/fail 패턴 학습으로 "이 통제는 K-ISMS 심사관이 자주 reject" 같은 인사이트 축적, 신규 고객은 1년차부터 통과율 향상.
(4) 고객 switching cost — 한 번 evidence pipeline 을 깔면 매년 갱신을 거기서 해야 함, 갈아타는 데 6개월 이상 소요.
```

#### Business model — 누가 왜 돈을 내나
```
ACV $30~80K (Vanta/Drata 와 동일 tier), Series B+ 타겟. 단일 framework $20K → 추가 framework 당 +$15K 로 자연스러운 expansion (NRR 130%+ 가능, multi-jurisdiction 본질). CAC $10~20K (outbound + 보안 컨퍼런스 + 기존 컨설팅펌 referral), payback 8~12개월. Margin 75~80% (compliance team 인건비가 주요 비용). GTM = (1) outbound to CISO at known global-bound SaaS, (2) 한국·일본 보안 컨퍼런스 키노트 / 부스, (3) 컨설팅펌 channel partner. 비교 가능 회사 모두 검증됨 (Vanta $2.45B valuation, Drata $2B, Secureframe $375M).
```

### 예상 axis 점수

| axis | 점수 |
|---|---|
| market_size | ~88 |
| problem_urgency | ~85 |
| timing | ~90 |
| product | ~85 |
| defensibility | ~88 |
| business_model | ~88 |
| **viability** | **~88** (clamp 95 직전) |

---

## 핵심 차이 요약

| | 10점 예시 | 90점 예시 |
|---|---|---|
| 시장 | "많을 거라 생각" | KISA 통계 + ACV 추정 |
| 문제 | "1~2분 귀찮음" | "CISO 시간의 #1, $50~150K 비용" |
| Why now | "만들어보고 싶음" | EU AI Act + ISMAP 개정 + 시장 30% 성장 |
| 차별화 | "슬랙 봇 30분이면 만듦" | 1,000+ 매핑 ontology + 인증기관 네트워크 |
| 해자 | "없음" | 데이터 + 네트워크 효과 + switching cost 4중 |
| 비즈니스 | "월 5천원, 무료부터" | ACV $30~80K, Vanta comparable, NRR 130% |

10점짜리는 **모든 axis 가 동시에 약함** + Calibrator 가 보정할 근거조차 없는 구조. 90점짜리는 **각 axis 가 서로 독립적으로 강한 근거**를 가지고 있어서 Calibrator 도 깎을 만한 게 안 보이는 구조.

---

## Consumer App

### 🔴 ~10점 예시 — 구조적 실패 Consumer App

| 필드 | 값 |
|---|---|
| Category | Consumer App |
| Target User | 한국 20~30대 |

#### Market — 누가 아프고 얼마나 많은가
```
한국에 핸드폰 쓰는 20~30대 다 쓸 수 있어서 시장 큼. 정확한 수치는 모르지만 다들 메모를 함.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
기본 메모 앱이 못생겼고 색깔이 단조로움. 큰 불편은 아님.
```

#### Timing — 왜 지금
```
딱히 이유는 없음. 메모 앱 색깔이 마음에 안 들어서 그냥 한번 만들어보고 싶었음. 시장 시그널은 안 봤음.
```

#### Product — 무엇을 하나
```
색깔 예쁜 메모 앱. 카드 형태로 메모 정리됨. 노션이나 애플 메모 앱이랑 큰 차이는 없음.
```

#### Defensibility — 따라 하기 어려운 점
```
딱히 없음. 누구든 일주일이면 비슷한 디자인으로 카피 가능. 디자인 좀 다르게 하는 정도 차이.
```

#### Business model — 누가 왜 돈을 내나
```
일단 무료로 풀고 광고 붙이거나 구독 받을 생각. 잘 안 정해짐.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~12 | problem_urgency | ~8 | timing | ~10 |
| product | ~12 | defensibility | ~8 | business_model | ~10 |
| **viability** | **~10** |

### 🟢 ~90점 예시 — 구조적 성공 Consumer App

| 필드 | 값 |
|---|---|
| Category | Consumer App |
| Target User | 한국 65세+ 1인 가구 노인 (만성질환 약물 5종+ 복용) |

#### Market — 누가 아프고 얼마나 많은가
```
한국 65세 이상 950만명 (통계청 2024), 만성질환자 70%, 평균 5종 약물 복용. 1인 가구 노인 35% 돌파. 약물 오용 응급실 방문 연 30만건, 의료비 부담 연 1.5조원 (건강보험공단 2023). WHO medication adherence 시장 글로벌 $290B.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
현재 종이 약통 + 가족 전화 confirm 에 의존. 자녀 멀리 살아 매일 확인 불가, 평균 35% 누락/중복 복용 (서울대병원 노인의학 2023). 일반 알람앱은 시각인지 저하 / 약 이름 복잡 → 노인 사용률 4% 미만. 약사 직접 상담은 약국당 일 200명 처리 한계.
```

#### Timing — 왜 지금
```
(1) 2025 노인장기요양보험 디지털 헬스케어 급여 신설 — B2B2C reimbursement path 확보 (2) 카카오 시니어 사용률 43% 도달 — 디지털 채널 임계 돌파 (3) 보건복지부 1인 가구 노인 안전망 사업 ₩2,000억 편성 (4) 미국 Pillpack ($1B Amazon 인수) 모델 검증, 한국 carbon copy 무.
```

#### Product — 무엇을 하나
```
음성 알림 (인지 저하 친화 UX) + 자녀 앱 미러링 + 약사 검수 처방전 OCR + 보험사 reimbursement 자동 청구. 일반 알람앱 대비 (1) 시니어 UX (글자 4배, 음성 우선) (2) 약사 검수로 상호작용 경고 (3) 자녀 모니터링 (4) 보험 청구 자동화 = 결합 10x.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) 약사회 협약 — 처방전 OCR 정확도 데이터셋, 신규는 6개월+ 필요 (2) 노인 사용 행동 데이터 — 누락 패턴 학습, 1년차부터 정확도 +20% (3) 보험사 PMPM 계약 — 한화/삼성생명 partnership (4) 가족 네트워크 효과 — 자녀가 부모 lock-in.
```

#### Business model — 누가 왜 돈을 내나
```
B2B2C — 보험사 PMPM $5/월 + 약국 처방 매출 5% commission. 보험사당 ACV $2~5M (가입자 수만 명). CAC 보험사 outbound $50K, payback 3~6개월. Margin 70% (서버 + 약사 검수 비용). 비교: Pillpack ($1B exit), Medisafe ($30M raised, USA), Truepill ($1.6B valuation).
```

| axis | 예상 점수 |
|---|---|
| market_size | ~85 | problem_urgency | ~88 | timing | ~85 |
| product | ~82 | defensibility | ~80 | business_model | ~85 |
| **viability** | **~84** |

---

## Marketplace

### 🔴 ~10점 예시 — 구조적 실패 Marketplace

| 필드 | 값 |
|---|---|
| Category | Marketplace |
| Target User | 모든 한국인 |

#### Market — 누가 아프고 얼마나 많은가
```
중고거래 시장이 크다고 들었음. 당근 있긴 한데 우리도 한번 해보려고.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
당근이 너무 동네 위주라서 멀리 있는 좋은 물건을 못 봄. 그게 좀 답답함.
```

#### Timing — 왜 지금
```
특별한 이유는 없음. 당근이 동네 위주라 멀리 못 보는 게 답답해서 그냥 한번 시작해보려 함.
```

#### Product — 무엇을 하나
```
전국 단위 중고거래 앱. 당근이랑 거의 같은데 거리 제한 없음.
```

#### Defensibility — 따라 하기 어려운 점
```
딱히 없음. 당근이 거리 제한만 풀면 그대로 따라 잡힘. 우리만의 무기는 아직 못 찾음.
```

#### Business model — 누가 왜 돈을 내나
```
일단 무료로 풀고 사용자 모이면 광고. 마진율은 잘 모름.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~15 | problem_urgency | ~10 | timing | ~8 |
| product | ~10 | defensibility | ~5 | business_model | ~10 |
| **viability** | **~10** |

### 🟢 ~90점 예시 — 구조적 성공 Marketplace

| 필드 | 값 |
|---|---|
| Category | Marketplace |
| Target User | 한국 제조업 중소기업 (셀러) + 일본·동남아 산업기계 바이어 |

#### Market — 누가 아프고 얼마나 많은가
```
한국 제조업 중소기업 12만개, 산업기계 부품 시장 연 ₩8조 중 중고/리퍼브 비중 15% = ₩1.2조. 한국산 중고기계 일본·동남아 수요 연 35% 증가 (KOTRA 2024 통계). 일본 노후 공장 retrofit 시장 기준 ₩30조 가시권.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
부품 교체 시 (1) 신품 한 달 대기, 가격 5배 (2) 중고는 네이버 카페·전화로 거래, 검증 X, 사기 다발 (3) 글로벌 바이어는 한국어 플랫폼 못 씀 → 일본 도쿄 중개상이 한국 매입 후 50% 마진 가져감. 공장 가동 중단 손실 일평균 ₩1,200만원 (중소벤처기업부 2024).
```

#### Timing — 왜 지금
```
(1) 2025 중대재해법 강화 — 인증된 부품만 사용 의무화로 검증 플랫폼 폭발 수요 (2) 엔저 + 한국 제조업 sluggish → 한국산 중고기계 일본 수출 33% 증가 (3) 정부 ‘제조업 ESG 순환경제’ 보조금 2025년 ₩1,500억 신설 (4) 카페·전화 거래는 외국인 접근 불가 — 글로벌 진출 한국 진영 비어있음.
```

#### Product — 무엇을 하나
```
AI 인증 (사진+센서 데이터 → 잔여수명 추정) + 한국기계산업진흥회 공인 인증서 발급 + 글로벌 결제·물류 통합 (영문/일문 자동화). 카페 거래 대비 (1) 인증으로 사기 0 (2) 에스크로 (3) 글로벌 직매 = 10x 거래 신뢰.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) 인증 데이터셋 — 100만장+ 부품 사진 + 실제 잔여수명 라벨, 신규 진입자는 1년+ 데이터 수집 필요 (2) 한국기계산업진흥회 MOU — 공인 인증서 발급 권한 독점 (3) 양면 네트워크 효과 — 카테고리당 셀러 5,000 / 바이어 3만 critical mass (4) 중대재해법 인증 lock-in — 기업이 갈아타려면 재인증.
```

#### Business model — 누가 왜 돈을 내나
```
take-rate 8~12% + 인증 수수료 ₩30만/건 + 셀러 SaaS ₩10만/월. 평균 거래 ₩2,000만 → 거래당 매출 ₩200만. GMV ₩100억 → 매출 ₩12억. CAC 셀러 ₩50만 (제조사 협회 채널), payback 6개월. Margin 55% (인증 인건비). 비교: Plant Predict ($60M raised), Surplus Solutions (USA, $500M GMV).
```

| axis | 예상 점수 |
|---|---|
| market_size | ~85 | problem_urgency | ~88 | timing | ~88 |
| product | ~85 | defensibility | ~88 | business_model | ~85 |
| **viability** | **~86** |

---

## Dev Tools

### 🔴 ~10점 예시 — 구조적 실패 Dev Tools

| 필드 | 값 |
|---|---|
| Category | Dev Tools |
| Target User | 개발자 |

#### Market — 누가 아프고 얼마나 많은가
```
개발자 많음. 시장 클 거임. 정확한 수치는 모르지만 다들 VSCode 쓰니까 잠재 사용자 많을 듯.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
VSCode 기본 테마가 단조로움. 다크모드 색깔이 별로임.
```

#### Timing — 왜 지금
```
그냥 만들고 싶었음. 다크모드 색깔이 단조롭다는 트윗 보고 시작함. 시장 시그널은 안 봤음.
```

#### Product — 무엇을 하나
```
예쁜 다크 테마 모음 사이트. VSCode 마켓플레이스에 비슷한 거 많음.
```

#### Defensibility — 따라 하기 어려운 점
```
없음. CSS 몇 줄이면 누구든 카피 가능. 마켓플레이스에 비슷한 테마가 이미 수백 개 있음.
```

#### Business model — 누가 왜 돈을 내나
```
광고? 후원 버튼? 유료 테마? 잘 모르겠음. 일단 무료로 풀고 다운로드 늘면 생각해보려 함.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~10 | problem_urgency | ~5 | timing | ~5 |
| product | ~10 | defensibility | ~5 | business_model | ~5 |
| **viability** | **~7** |

### 🟢 ~90점 예시 — 구조적 성공 Dev Tools

| 필드 | 값 |
|---|---|
| Category | Dev Tools |
| Target User | LLM agent 를 production 에 운영하는 enterprise (금융·의료·방산 self-host 필수 segment) |

#### Market — 누가 아프고 얼마나 많은가
```
글로벌 LLM agent 운영 기업 2025년 5,000+ (Anthropic/OpenAI API 매출 $20B 연환산). enterprise monitoring spend 평균 $80K/연 → TAM $400M, 2027년 $1.5B (Gartner Q1 2025). LangSmith ($3B), Langfuse 검증된 시장에서 self-host enterprise segment 빈자리.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
기존 APM (Datadog/New Relic) 은 token-level / agent decision tree / tool call cost 추적 못함. LangSmith 는 SaaS only — 금융·의료·방산 compliance 막힘 (PII / on-prem 의무). production AI 버그 디버깅 평균 6.3시간 (Anthropic 2024 dev survey), 비용 분석 수기.
```

#### Timing — 왜 지금
```
(1) 2025 EU AI Act, NIST AI RMF — agent decision audit log 의무화 (2) Claude 4 / GPT-5 multi-step agent 본격화 (3) Datadog AI feature 18개월 격차 (4) Langfuse OSS 채택 폭증하지만 self-host 운영 어려움 — managed self-host 빈자리.
```

#### Product — 무엇을 하나
```
agent run trace + token cost per decision + tool call replay + on-prem 배포 + audit log compliance. Datadog 대비 (1) agent semantic 이해 (2) on-prem 자동 배포 = 10x debug 속도. LangSmith 대비 self-host + audit log = enterprise unblock.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) Open source 코어 — 채택 가속 + community telemetry 인사이트 데이터 누적 (2) framework 통합 — LangChain/LlamaIndex/AutoGen 공식 partner 등재 (3) NIST AI RMF audit log 표준 워킹그룹 참여 — 표준 자체가 moat (4) 금융·방산 reference customer compliance 노하우.
```

#### Business model — 누가 왜 돈을 내나
```
usage-based ($0.001/trace) + enterprise tier $50K~$500K ACV. ARR Year 2 plan $5M, Year 4 $50M. Net retention 150%+ (agent volume 자연 성장). CAC $5K (PLG bottom-up + OSS 채택), payback 4~8개월. 비교: Datadog $40B mcap, LangSmith ($3B), Langfuse (YC W23, $4M raised).
```

| axis | 예상 점수 |
|---|---|
| market_size | ~85 | problem_urgency | ~85 | timing | ~92 |
| product | ~88 | defensibility | ~85 | business_model | ~88 |
| **viability** | **~87** |

---

## Health & Wellness

### 🔴 ~10점 예시 — 구조적 실패 Health & Wellness

| 필드 | 값 |
|---|---|
| Category | Health & Wellness |
| Target User | 모든 직장인 |

#### Market — 누가 아프고 얼마나 많은가
```
현대인 다 스트레스 받음. 시장 클 거임. 코로나 이후 정신건강 관심 늘었다는 얘기는 들음.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
직장인이 피곤하고 번아웃 옴. 명상하면 좀 나아진다고 들었는데 임상 근거는 모름.
```

#### Timing — 왜 지금
```
요즘 다들 번아웃 얘기 많이 하니까 일단 시도해보려 함. 특별한 시장 신호나 데이터는 없음.
```

#### Product — 무엇을 하나
```
명상 음원 앱. 한국어 가이드 명상 30개 들어있음. Calm 이랑 비슷하지만 한국어임.
```

#### Defensibility — 따라 하기 어려운 점
```
Calm 한국어 버전이 이미 있음... 별 차이 없음.
```

#### Business model — 누가 왜 돈을 내나
```
월 9,900원 구독. 광고는 안 받을 생각인데 무료 명상 유튜브가 많아서 결제할지 모름.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~15 | problem_urgency | ~10 | timing | ~10 |
| product | ~10 | defensibility | ~5 | business_model | ~12 |
| **viability** | **~10** |

### 🟢 ~90점 예시 — 구조적 성공 Health & Wellness

| 필드 | 값 |
|---|---|
| Category | Health & Wellness |
| Target User | 한국 갱년기 여성 (45~55세) — 호르몬 치료 (HRT) 미접근층 |

#### Market — 누가 아프고 얼마나 많은가
```
한국 갱년기 여성 660만명 (통계청 2024), 평균 기간 7년, 70%가 증상 호소. HRT 처방률 7% (미국 38%, 영국 22%) — 정보·접근성 부족 (대한폐경학회 2023). TAM ₩2.4조, 글로벌 menopause care $24B 2024 → $40B 2030 (Statista).
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
산부인과 방문 평균 대기 3주, 진료 5분, 처방 의사마다 천차만별. 70%가 증상 무시·자가요법 (홍삼/석류). 우울증 발병률 4배, 직장 productivity 손실 연 1인 $1,500 (KAIST 2024 보건경제). 사회적 stigma 로 회사·가족 상담 불가.
```

#### Timing — 왜 지금
```
(1) 2025 비대면 진료법 정식 시행 — 갱년기 D2C 합법화 (2) 식약처 HRT 가이드라인 2024 개정 — 처방 진입 장벽 ↓ (3) 미국 Tia Health $100M, Midi Health $60M 라운드로 시장 검증 (4) 한국 폐경여성협회 환자단체 활성화 + 기업 ESG 여성건강 지원 의무화.
```

#### Product — 무엇을 하나
```
1:1 갱년기 전문의 비대면 진료 (30분) + 호르몬 검사 키트 + HRT 처방·정기 배송 + 증상 트래킹 앱. 산부인과 대비 (1) 5분 → 30분 진료 (2) 야간/주말 (3) 약국 픽업 → 정기 배송 = 10x access. 일반 비대면 진료 대비 갱년기 전문 = 처방 정확도 +40%.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) 갱년기 전문의 네트워크 — 한국 갱년기 전문의 200명 중 70%와 독점 계약 (2) 한국 여성 증상-호르몬 임상 데이터셋 — 글로벌 incumbent 못 가져감 (3) 현대해상 갱년기 보험 partner — reimbursement (4) 약국 cold-chain 배송 lock-in.
```

#### Business model — 누가 왜 돈을 내나
```
진료 ₩8만 + 키트 ₩15만 + 월 정기 처방 ₩6~12만. ARPU 연 ₩90만, LTV ₩270만 (3년 retention). CAC 인스타·맘카페 콘텐츠 ₩20만, payback 4개월. Margin 60% (의약품 마진 구조 낮음). 비교: Tia ($550M valuation), Midi ($330M).
```

| axis | 예상 점수 |
|---|---|
| market_size | ~85 | problem_urgency | ~88 | timing | ~88 |
| product | ~85 | defensibility | ~82 | business_model | ~82 |
| **viability** | **~85** |

---

## Education

### 🔴 ~10점 예시 — 구조적 실패 Education

| 필드 | 값 |
|---|---|
| Category | Education |
| Target User | 학생 |

#### Market — 누가 아프고 얼마나 많은가
```
한국 학생 많음. 학원 시장 클 거임. 정확한 수치는 모르지만 다들 공부에 관심 많아 잠재 시장 큼.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
공부하기 싫음. 동기부여가 안 됨. 친구들도 다 비슷한 얘기 함. 큰 비용 문제는 아님.
```

#### Timing — 왜 지금
```
특별한 이유 없음. 인스타에서 동기부여 콘텐츠가 인기인 거 같아 그냥 만들어보려 함.
```

#### Product — 무엇을 하나
```
명언 인용구 보여주는 동기부여 앱. 매일 하나씩 push 알림.
```

#### Defensibility — 따라 하기 어려운 점
```
없음. 인용구 DB 만 있으면 누구나 카피 가능. 비슷한 앱 이미 앱스토어에 30개 이상 있음.
```

#### Business model — 누가 왜 돈을 내나
```
일단 무료로 풀고 사용자 모이면 월 3천원 구독으로 전환하려 함. 광고 모델도 고민 중.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~12 | problem_urgency | ~8 | timing | ~5 |
| product | ~8 | defensibility | ~5 | business_model | ~8 |
| **viability** | **~8** |

### 🟢 ~90점 예시 — 구조적 성공 Education

| 필드 | 값 |
|---|---|
| Category | Education |
| Target User | 베트남·인도네시아 IT 전공 졸업생 (한국 IT 기업 취업 희망) |

#### Market — 누가 아프고 얼마나 많은가
```
한국 IT 기업 외국인 개발자 채용 수요 2024년 12,000명 (2019 대비 4배, KOSA), 평균 연봉 ₩5,500만. 베트남 ICT 전공 대학 졸업 연 8만명, 인니 5만명 vs 한국 진출 1,500명 — 미스매치 거대. TAM (등록비+ISA): 학년당 200명 × $25K = $5M, 5년 plan $50M.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
한국 IT 기업 진입 = 한국어 N3 + 기술면접 + E-7 비자 + 채용 동시 통과 = 1% 미만 성공. 부트캠프는 한국어 또는 기술만 분리 (FastCampus 한국어 X, KGITBANK 기술만). E-7 비자 변호사 비용 $5K, 회사 의지 필요. 베트남 IT 신입 ₩600만 → 한국 ₩5,500만 = 9배 lift, 동기 강력.
```

#### Timing — 왜 지금
```
(1) 2024 K-Tech Pass 비자 신설 — IT 인재 fast-track (2) 한국 출산율 0.72 → IT 인력난 영구 구조화 (3) 베트남 FPT, 인니 Binar 등 동남아 IT 교육 인프라 상위 10% 양산 가능 (4) 한국 IT 기업 80% 외국인 개발자 고용 의향 (KOSA 2024) (5) Microverse, Holberton 동남아→한국 진출 실패 → 빈자리.
```

#### Product — 무엇을 하나
```
12개월 풀스택 + 한국어 N3 (출제유형 학습) + 카카오·네이버 PM 1:1 멘토 + E-7 비자 행정 패키지 + 채용 보장 + ISA. 기존 부트캠프 대비 (1) 언어+기술+비자 통합 (2) 채용사 직접 매칭 (3) ISA 환불 보장 = 9x salary lift, 1% → 70% 통과율.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) 한국 IT 기업 채용 협약 — 카카오·네이버·라인 자회사 50개사 우선 채용 partnership (2) 비자 변호사 inhouse — E-7 통과율 95% 데이터 누적, 신규는 못 따라옴 (3) 동남아 졸업생 referral network → CAC 자연 감소 (4) ISA 6년 lock-in — 학생 중도 이탈 비용 큼.
```

#### Business model — 누가 왜 돈을 내나
```
등록비 $0 + ISA 17% × 36개월 (한국 연봉 ₩5,500만 × 17% × 3년 = ₩2,805만/학생). 학생당 매출 ~₩3,000만, 학년당 200명 → 연 ₩60억. CAC $300 (TikTok/FB VN/ID), payback 14개월. Margin 45% (멘토 인건비 + 비자 변호사). 비교: Holberton ($75M raised), Microverse ($25M, 한국 진출 실패), Lambda (peak $1B valuation).
```

| axis | 예상 점수 |
|---|---|
| market_size | ~82 | problem_urgency | ~88 | timing | ~88 |
| product | ~85 | defensibility | ~82 | business_model | ~82 |
| **viability** | **~84** |

---

## Fintech

### 🔴 ~10점 예시 — 구조적 실패 Fintech

| 필드 | 값 |
|---|---|
| Category | Fintech |
| Target User | 한국 직장인 |

#### Market — 누가 아프고 얼마나 많은가
```
한국 직장인 다 금융앱 쓰니까 시장 큼. 토스 카카오뱅크 사용자 합치면 수천만 명일 거임.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
토스가 너무 복잡하고 광고가 많음. 가계부 화면이 못생기고 카테고리 자동 분류가 부정확함.
```

#### Timing — 왜 지금
```
특별한 이유 없음. 그냥 가계부 앱 좀 깔끔하게 만들고 싶어서 시작해보려 함.
```

#### Product — 무엇을 하나
```
심플한 가계부 앱. 토스 인사이트랑 비슷하지만 더 깔끔함.
```

#### Defensibility — 따라 하기 어려운 점
```
딱히 없음. 토스가 가계부 화면만 좀 다듬으면 그대로 따라 잡힘. 차별점 못 찾음.
```

#### Business model — 누가 왜 돈을 내나
```
무료 + 광고. 나중에 프리미엄 구독 고민 중. 마이데이터 라이선스 비용·절차는 잘 모름.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~12 | problem_urgency | ~8 | timing | ~5 |
| product | ~10 | defensibility | ~5 | business_model | ~5 |
| **viability** | **~8** |

### 🟢 ~90점 예시 — 구조적 성공 Fintech

| 필드 | 값 |
|---|---|
| Category | Fintech |
| Target User | 한국 해외출장 발생 중소기업 (Brex/Ramp 의 한국 fit 버전) |

#### Market — 누가 아프고 얼마나 많은가
```
한국 해외출장 발생 중소기업 4.2만개 (KOSME 2024), 임직원 평균 8명, 출장경비 연 ₩3,000만/사. TAM ₩1.3조 (interchange + SaaS). 글로벌 corp card $300B, Brex $12B / Ramp $13B 검증.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
(1) 신한/KB 법인카드 외환수수료 1.5~3% (2) 출장경비 영수증 엑셀 정리 — 직원당 월 8시간 (3) 회계연동 수기, 마감 평균 7일 (4) 외환 한도 일 $5,000 — IT 스타트업 해외 SaaS 결제 (AWS/Notion/Figma) 막힘. 기업당 연 손실 ₩500~2,000만.
```

#### Timing — 왜 지금
```
(1) 2024 외환거래법 개정 — 핀테크 외화 결제 한도 확대 (2) 해외 SaaS 결제 B2B 지출 연 30% 성장 (3) 한국 스타트업 일본·동남아 진출 — 출장 4배 증가 (4) 신한·KB 모바일 SaaS UX 미흡 18개월 격차.
```

#### Product — 무엇을 하나
```
멀티 통화 법인카드 + 영수증 OCR 자동 + ERP (더존/SAP) 자동 연동 + 외환수수료 0.3% + 해외 SaaS 결제 unlimited. 신한 법인카드 대비 (1) 외환 1/5 비용 (2) OCR 자동화 (3) 정산 7일 → 1시간 = 10x productivity.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) 라이선스 — 외국환업자 등록 + 마이데이터, 신규는 18개월 (2) 더존 (한국 점유율 70%) 공식 connector partnership (3) 환율 대량 헷지 — 거래량 누적 → 수수료 절감 flywheel (4) 삼일/삼정 회계법인 channel partner — referral lock-in.
```

#### Business model — 누가 왜 돈을 내나
```
interchange 1.5% + SaaS ₩50,000/직원/월. 8명 사 → ARR ₩480만 + 거래 ₩200만 = ₩680만/사. CAC ₩200만 (회계법인 referral), payback 4개월. Net retention 130%+ (직원 수·해외지출 자연 성장). Margin 60%. 비교: Brex $12B, Ramp $13B, 한국 corp card 핀테크 미성숙.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~82 | problem_urgency | ~85 | timing | ~85 |
| product | ~85 | defensibility | ~85 | business_model | ~88 |
| **viability** | **~85** |

---

## E-commerce

### 🔴 ~10점 예시 — 구조적 실패 E-commerce

| 필드 | 값 |
|---|---|
| Category | E-commerce |
| Target User | 한국 20~30대 여성 |

#### Market — 누가 아프고 얼마나 많은가
```
온라인 쇼핑 시장 큼. 쿠팡 매출 보면 알 수 있음. 정확한 segment 수치나 카테고리 비중은 모름.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
쿠팡이 너무 빨라서 충동구매가 늘어남. 좀 천천히 사고 싶음.
```

#### Timing — 왜 지금
```
특별한 이유 없음. 요즘 충동구매가 사회 문제라 들었고 그냥 한번 만들어보려 함.
```

#### Product — 무엇을 하나
```
‘느린 쇼핑몰’ — 24시간 후 배송. 충동구매 줄여줌.
```

#### Defensibility — 따라 하기 어려운 점
```
없음. 발주만 늦추면 끝이라 누구든 카피 가능. 쿠팡이 ‘24시간 모드’ 옵션 추가하면 끝.
```

#### Business model — 누가 왜 돈을 내나
```
일반 쇼핑몰처럼 마진 30% 정도 받기. 정확한 마진 구조나 운영비 계산은 아직 못 함.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~12 | problem_urgency | ~5 | timing | ~5 |
| product | ~8 | defensibility | ~3 | business_model | ~10 |
| **viability** | **~7** |

### 🟢 ~90점 예시 — 구조적 성공 E-commerce

| 필드 | 값 |
|---|---|
| Category | E-commerce |
| Target User | 한국 미슐랭/파인다이닝 셰프 (B2B) + 백화점 식품관 프리미엄 식자재 소비자 (B2C) |

#### Market — 누가 아프고 얼마나 많은가
```
한국 프리미엄 식자재 (B2B 호텔·레스토랑 + B2C 백화점 식품관) 시장 연 ₩5.8조 (한국농수산식품유통공사 2024). 미슐랭 별·블랙리본 1,400개, 파인다이닝 5,000개. 농가 직거래 비중 8%, 도매시장 거치며 중간 마진 70% — 디지털 D2C 빈자리 ₩4조+.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
(1) 셰프 매일 새벽 가락시장 직접 방문 (시간 8시간/일) (2) 농가는 도매상에 후려치기 (마진 70% 도매 가져감) (3) 콜드체인 미흡 — 폐기율 22% (4) 산지 직배송은 농가 IT 부족 → 미실현. 셰프당 식자재 비용 매출 30%, 농가 수익 도매 거래의 1/3.
```

#### Timing — 왜 지금
```
(1) 2024 농어촌 디지털 농업법 — 농가 D2C 보조금 ₩800억 신설 (2) 미슐랭 가이드 한국판 4년차 — 셰프 농가 스토리텔링 차별화 압력 (3) 마켓컬리 콜드체인 라스트마일 외주 가능 (4) 외식 객단가 인플레이션 — ₩30만 dinner 코스 시장 35% 성장 (5) 정식당·권숙수 등 농가 직거래 운동 anchor 형성.
```

#### Product — 무엇을 하나
```
(1) 농가 IoT 센서 → 수확 알림 → 셰프 앱 push (2) 새벽 5시 콜드체인 직배송 (3) 미슐랭 셰프 영상 농가 콘텐츠 → 백화점 식품관 B2C SKU. 가락시장 대비 (1) 가격 30% ↓ for 셰프 (2) 매출 2배 ↑ for 농가 (3) 신선도 24시간 컷 = 10x farm-to-table.
```

#### Defensibility — 따라 하기 어려운 점
```
(1) 농가 독점 계약 — 미슐랭 셰프 매칭 농가 700곳, 매년 +200 (2) 콜드체인 라스트마일 SLA — 새벽 5시 정시 도착 (3) 셰프 anchor — 권숙수·가온·정식당 reference → 신규 셰프 자연 유입 (4) 농가-셰프 거래 데이터 → 가격 책정 alpha, 후발주자 못 가져감.
```

#### Business model — 누가 왜 돈을 내나
```
take-rate 18% (가락시장 도매 30~50% 대비 매력) + 농가 SaaS ₩3만/월 + 백화점 식품관 wholesale 마진 25%. GMV ₩100억 → 매출 ₩18억 (Year 2 plan). CAC 셰프 ₩50만 (미슐랭 referral), payback 4개월. Margin 35% (콜드체인 cost). 비교: Crowd Cow ($30M raised), Good Eggs ($100M raised).
```

| axis | 예상 점수 |
|---|---|
| market_size | ~80 | problem_urgency | ~85 | timing | ~85 |
| product | ~85 | defensibility | ~85 | business_model | ~78 |
| **viability** | **~83** |

---

## Hardware

### 🔴 ~10점 예시 — 구조적 실패 Hardware

| 필드 | 값 |
|---|---|
| Category | Hardware |
| Target User | 모든 사람 |

#### Market — 누가 아프고 얼마나 많은가
```
스마트홈 시장 크다고 함. 다들 집에 전구 쓰니까 잠재 사용자 많을 거임. 정확한 수치 모름.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
전등 스위치 누르는 게 귀찮음. 손에 짐 들고 있을 때 특히.
```

#### Timing — 왜 지금
```
특별한 이유 없음. 그냥 음성 제어 스마트홈 만들어보고 싶었음. 시장 시그널은 안 봤음.
```

#### Product — 무엇을 하나
```
음성으로 켜는 스마트 전구. 샤오미가 5,000원에 비슷한 거 팔긴 함.
```

#### Defensibility — 따라 하기 어려운 점
```
딱히 없음. 샤오미가 5천원에 비슷한 거 팔고 더 싸게 만듦. 차별화 포인트 못 찾음.
```

#### Business model — 누가 왜 돈을 내나
```
3만원에 팔 생각. 마진 구조나 BOM 단가는 아직 계산 못 했고 채널 전략도 미정.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~12 | problem_urgency | ~8 | timing | ~5 |
| product | ~8 | defensibility | ~3 | business_model | ~8 |
| **viability** | **~7** |

### 🟢 ~90점 예시 — 구조적 성공 Hardware

| 필드 | 값 |
|---|---|
| Category | Hardware |
| Target User | 글로벌 EUV fab 운영사 (TSMC, Samsung, Intel, SK Hynix) — 2nm 노광 결함 검출 second-source |

#### Market — 누가 아프고 얼마나 많은가
```
EUV fab 운영기업 4개사, EUV 노광기 200대+ 운영. inline 광학 결함 검출 시장 $4.5B (Gartner 2025 fab capex), 2028 $9B (3nm → 2nm 전환). Lasertec ($16B mcap) 독점 → second-source TAM $2B 가시권.
```

#### Problem — 오늘 어떻게 하고 있고 왜 망가졌나
```
EUV wafer 결함 검출 = 별도 inspection step, wafer 1장당 5~8분 추가. 결함 1개 missed = wafer ₩300만 폐기. fab 시간당 손실 $50K. 3nm 미만 nano-defect 검출 정확도 한계 (Lasertec actinic 95% → 2nm 에서 80% 하락). Lasertec 독점 → 가격 협상력 없음, lead time 18개월.
```

#### Timing — 왜 지금
```
(1) 2024 ASML 0.55 NA EUV 양산 — 기존 검출기 해상도 부족 (2) Samsung/TSMC 2nm 양산 2026 — 검출 수요 폭증 (3) 미·EU CHIPS Act ₩1,000조 fab 신설 (4) Lasertec 독점 → 한국·미국 fab second-source 정치적 압박 강력 (지정학) (5) GIST·KAIST actinic 광학 IP 성숙.
```

#### Product — 무엇을 하나
```
actinic EUV 광원 inline 결함 검출 모듈 — 노광 직후 30초 nano-defect 90% 검출. 별도 inspection step 제거 → wafer throughput +12%. Lasertec 대비 (1) inline (2) 가격 60% (3) 한국·미국 fab support hours = 10x TCO. 2nm node defect 검출 정확도 92% (Lasertec 80%).
```

#### Defensibility — 따라 하기 어려운 점
```
(1) 특허 — actinic 검출 광원 + AI 결함 분류 50건 출원 (2) Samsung Foundry NDA 공동개발 — 양산 데이터 라이브러리 (3) 한국 광기술원 (GIST) spinout — 출연연 IP transfer 독점 (4) Lasertec 일본 fab 우선 / 정치적 second-source 수요 — 시장 양분 구조 강제.
```

#### Business model — 누가 왜 돈을 내나
```
모듈당 ASP $8M~$15M, EUV 노광기 1대당 1 모듈. Year 5 plan 100대 deployed → 매출 $1B. Margin 65% (광학부품 R&D heavy). CAC enterprise 영업 $500K/deal, deal size 거대해 payback 1년 미만. SaaS 보수계약 ASP의 15%/연. 비교: Lasertec $16B mcap, KLA $80B (메인 inspection), ASML $300B.
```

| axis | 예상 점수 |
|---|---|
| market_size | ~85 | problem_urgency | ~88 | timing | ~92 |
| product | ~88 | defensibility | ~88 | business_model | ~85 |
| **viability** | **~88** |

---

## 카테고리 공통 패턴

10점짜리 axis 답변의 공통 신호:
- 시장 — "많을 거임", "다들 씀" (수치/통계 0건)
- 문제 — "귀찮음", "별로임" (cost 추정 0건)
- Why now — "그냥", "특별한 이유 없음" (catalyst 0건)
- 제품 — "30분이면 만듦", "OOO 이랑 비슷" (10x 0건)
- 해자 — "없음", "누가 카피하면 끝"
- 비즈니스 — "월 X천원", "광고? 잘 모름"

90점짜리 axis 답변의 공통 신호:
- 시장 — 정부/협회 통계 + ACV/ARPU + TAM 자릿수
- 문제 — 시간 (X시간/일) + 비용 (₩X만~Y억) + 대안 빈자리
- Why now — 규제·법 시행일 + 기술 fab/플랫폼 inflection + 경쟁자 격차 시간
- 제품 — 측정 가능한 10x (시간 70% / 정확도 +20% 등) + alternative anchor 명시
- 해자 — 4중 이상 layered (데이터 + 네트워크 + 라이선스 + lock-in)
- 비즈니스 — ACV/CAC/payback/NRR + 비교 가능 회사 valuation 명시
