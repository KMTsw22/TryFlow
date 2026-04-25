# SaaS 점수 양 극단 테스트 예시

폼에 그대로 복붙해서 시스템 보정이 정상 작동하는지 검증할 때 쓰는 reference. 카테고리: **SaaS / B2B**.

---

## 🔴 ~10점 예시 — 구조적 실패 SaaS

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
특별한 이유는 없음. 그냥 만들어보고 싶었음.
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

## 🟢 ~90점 예시 — 구조적 성공 SaaS

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
