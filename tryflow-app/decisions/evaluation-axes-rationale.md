# 평가 축 선정 근거 (6축)

**작성일**: 2026-04-21
**배경**: 교수님 피드백 — "8개 축을 어디서 가져왔냐, AI가 랜덤으로 뽑은 거면 설득력 없음." 각 축은 1차 VC 소스에 근거해야 한다.

---

## 최종 6축

| # | 축 | 가중치 | 질문 | 근거 |
|---|---|---|---|---|
| 1 | **Market Size & Quality** | 0.22 | 시장이 크고 beachhead가 명확한가 | Sequoia, Andreessen, Gurley, Thiel #3 |
| 2 | **Problem & Urgency** | 0.18 | 얼마나 아픈 문제이고 얼마나 자주 발생하는가 | Sequoia "Problem", Graham "hair on fire", Blank |
| 3 | **Product (10x Solution)** | 0.18 | 대안 대비 10배 나은가 | Thiel #1 Engineering, Sequoia "Solution", Andreessen |
| 4 | **Moat & Defensibility** | 0.17 | 성공 후에도 지킬 수 있는가 | NFX (16 Network Effects), Thiel #6 Durability, Gurley |
| 5 | **Business Model & Unit Economics** | 0.15 | 단위경제·확장성·유통이 성립하는가 | Sequoia "Business Model", Bessemer 10 Laws, Thiel #5 |
| 6 | **Why Now / Timing** | 0.10 | 왜 지금이 적기인가 | Sequoia "Why Now" (시그니처 질문), Thiel #2, Graham |

**총점 계산**: 가중치 산술평균 (Σ w_i · x_i). 약점 축(총점 대비 -15점 이상 낮은 축)은 UI에서 별도 하이라이트.

---

## 이전 8축에서의 변화

| 이전 축 | 처리 | 사유 |
|---|---|---|
| Market Size | 유지 | 가장 강력한 근거 |
| Monetization | **Business Model로 확장** | 단위경제·GTM·확장성 포함 (Bessemer·Sequoia) |
| Technical | **Product (10x)로 재정의** | "만들기 얼마나 어려운가"가 아니라 "10배 나은가"로 질문 자체 변경 (Thiel #1) |
| Competition | **Moat에 흡수** | Thiel: "Competition is for losers" — 경쟁 분석은 결국 독점 가능성 질문 |
| Moat / Defensibility | 유지 | 가장 잘 근거된 축 (NFX 전체 프레임워크) |
| Timing | 유지 | Sequoia 시그니처 질문 |
| Regulation | **삭제** | top-tier VC 프레임워크 9개 중 0곳이 독립 축으로 다루지 않음. Why Now 하위로 편입 |
| User Acquisition | **Business Model에 흡수** | CAC는 단위경제의 구성 요소 (Bessemer) |
| — | **Problem & Urgency 신설** | Graham·Blank·Sequoia 모두 강조. 기존 8축에 빠져 있던 가장 큰 결락 |

---

## 점수 계산 방식 변경

**이전**: 가중치 조화평균 (weighted harmonic mean) — 약점 축이 전체를 크게 끌어내림.

**현재**: 가중치 산술평균 (weighted arithmetic mean) + 약점 축 하이라이트.

**변경 이유**: 교수님 피드백에서 "팔각형은 거의 꽉 차 보이는데 총점은 40점"이라는 체감-점수 괴리 지적. 조화평균의 이론적 정당성(Thiel식 conjunctive 평가)은 있으나, 사용자 신뢰 측면에서 산술평균이 우월. 약점 축 식별은 `findWeakAxes()` 별도 함수로 유지해 "어느 축이 약한가"는 여전히 드러냄. 참고: Village Capital VIRAL Pathway도 축별 독립 점수 + 종합 레벨 방식.

---

## 결정적 인용구 (발표 방어용)

1. **Marc Andreessen (a16z), "The Only Thing That Matters," 2007**
   > "In a great market—a market with lots of real potential customers—the market pulls product out of the startup… When a great team meets a lousy market, market wins."
   → Market Size 가중치 0.22의 근거

2. **Paul Graham, "How to Get Startup Ideas," YC, 2012**
   > "The very best startup ideas tend to have three things in common: they're something the founders themselves want, that they themselves can build, and that few others realize are worth doing."
   → Problem & Urgency 축 + Product (10x) 축의 근거

3. **Peter Thiel, *Zero to One*, 2014**
   > "Every great business is built around a secret that's hidden from the outside… If you nail all seven, you'll master fortune."
   → Product(10x) + Moat + Timing 3개 축을 동시 뒷받침

4. **Sequoia Capital, "Writing a Business Plan"**
   10개 슬라이드 중 Problem / Why Now / Market Size / Competition / Business Model / Team / Solution 등이 정확히 본 6축과 겹침.
   → 프레임워크 전체 설계의 근거

5. **Gompers, Gornall, Kaplan & Strebulaev, Journal of Financial Economics, 2020**
   > "The management team was mentioned most frequently both as an important factor (by 95% of VC firms) and as the most important factor (by 47% of VC firms)."
   → 학술 실증. Team(Founder-Market Fit)은 현 제품에서 평가 불가능해 제외했으나, 향후 제출 폼 개편 시 추가 고려.

---

## 주요 출처 URL

- [Sequoia — Writing a Business Plan](https://sequoiacap.com/article/writing-a-business-plan/)
- [Andreessen — The Only Thing That Matters](https://pmarchive.com/guide_to_startups_part4.html)
- [Paul Graham — How to Get Startup Ideas](https://paulgraham.com/startupideas.html)
- [Bill Gurley — All Markets Are Not Created Equal](https://abovethecrowd.com/2012/11/13/all-markets-are-not-created-equal-10-factors-to-consider-when-evaluating-digital-marketplaces/)
- [NFX — The 4 Signs of Founder-Market Fit](https://www.nfx.com/post/4-signs-founder-market-fit)
- [NFX — Network Effects Manual](https://www.nfx.com/post/network-effects-manual)
- [Gompers et al. — How Do VCs Make Decisions (HLS summary)](https://corpgov.law.harvard.edu/2019/08/20/how-do-venture-capitalists-make-decisions/)
- [Bessemer — 10 Laws of Cloud](https://www.bvp.com/atlas/10-laws-of-cloud)
- [Village Capital — VIRAL Pathway](https://www.mainetechnology.org/wp-content/uploads/2018/08/VIRAL-Assessment-for-Entrepreneurs.pdf)
- [Thiel's Seven Questions — summary](https://davidcummings.org/2024/11/16/thiels-seven-questions-every-business-must-answer/)

---

## 현재 제품에서 빠진 축 (인지된 한계)

**Team / Founder-Market Fit**: Gompers et al.(2020)에서 VC 47%가 단독 최중요 요소로 꼽은 축이지만, 현재 제품은 아이디어 텍스트만 입력받아 창업자 정보가 없어 평가 불가능. 발표에서 질문 시 답변: "제품을 '아이디어 평가기'에서 '스타트업 평가기'로 확장 시 제출 폼에 YC식 Founder Context 단계를 추가해 FMF 축을 도입할 계획". 로드맵 후보.
