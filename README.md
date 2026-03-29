1. 스타트업 창업자 혹은 출시전 객관적인 시장평가를 원하는 사람
2. 시장 반응 조사 (기능, 가격, 피드백)
3. 경쟁사: optimizely. g    oogle optimize

# TryFlow — Pre-launch Market Validation Platform

> 정식 출시 전, 가상의 랜딩 페이지로 시장 반응을 객관적인 수치로 측정하는 MVP 검증 도구

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 타겟 유저 | 스타트업 창업자, 사이드 프로젝트 개발자, 신규 서비스 출시 예정자 |
| 핵심 목적 | 출시 전 가상 랜딩 페이지 배포 → 유저 반응(클릭률, 체류시간, 이메일) 수치 측정 |
| 경쟁사 | Optimizely, Google Optimize |

---

## 2. 기술 스택

| 레이어 | 기술 |
|--------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Components | Shadcn UI (커스텀) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js |
| Charts | Recharts |

---

## 3. 디자인 시스템 (UI 이미지 분석 기반)

### 컬러 팔레트

```
Primary:     #7C3AED  (Purple-600) — CTA 버튼, 강조 요소, 프로그레스 바
Primary BG:  #F5F3FF  (Purple-50)  — 섹션 배경, 카드 강조 배경
Secondary:   #06B6D4  (Cyan-500)   — 서브 아이콘, 보조 강조
Success:     #10B981  (Emerald-500)— Running 상태, 긍정 지표
Warning:     #F59E0B  (Amber-500)  — Paused 상태
Danger:      #EF4444  (Red-500)    — 하락 지표
Text-H:      #111827  (Gray-900)   — 제목
Text-B:      #6B7280  (Gray-500)   — 본문, 설명
Border:      #E5E7EB  (Gray-200)   — 카드 테두리, 구분선
Background:  #FAFAFA  (Gray-50)    — 전체 배경
```

### 타이포그래피

```
Font Family: Inter (sans-serif)

H1: font-bold, text-4xl~5xl
H2: font-semibold, text-2xl~3xl
H3: font-semibold, text-xl
Body: font-normal, text-sm~base
Label: font-medium, text-xs~sm, tracking-wide, uppercase
```

### 컴포넌트 Round 값

```
Card:         rounded-2xl   (16px)
Button:       rounded-lg    (8px)
Badge/Pill:   rounded-full
Input:        rounded-lg    (8px)
Sidebar item: rounded-xl    (12px)
Avatar:       rounded-full
```

### 간격 (Padding/Spacing)

```
Section vertical:  py-16 ~ py-24
Card inner:        p-6 ~ p-8
Button:            px-6 py-3 (기본), px-4 py-2 (소형)
Sidebar width:     w-56 ~ w-64
Gap between cards: gap-4 ~ gap-6
```

### 주요 컴포넌트 스타일 패턴

- **카드**: `bg-white rounded-2xl border border-gray-200 shadow-sm p-6`
- **Primary 버튼**: `bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-3 font-semibold`
- **Badge (Running)**: `bg-green-100 text-green-700 text-xs font-medium rounded-full px-3 py-1`
- **Badge (Paused)**: `bg-amber-100 text-amber-700 text-xs font-medium rounded-full px-3 py-1`
- **사이드바**: `bg-white border-r border-gray-200 w-60 flex flex-col`

---

## 4. 핵심 기능 요구사항

### A. 유저용 랜딩 페이지 (Public)

- **Hero 섹션**: 창업자가 입력한 서비스 가치 제안 강조
- **Waitlist 등록**: 이메일 수집 폼
- **가격 플랜 선택**: 플랜별 클릭 수 측정 (`data-testid` 부여)
- **기능 선호도 투표**: 기능 카드 클릭 반응 측정
- **이벤트 태깅**: 버튼마다 고유 `data-testid`, `data-event` 속성으로 Analytics 연동 대비

### B. 창업자용 대시보드 (Auth Required)

- **통계 요약**: 총 방문자, 전환율, Winning Variant 카드
- **실험 목록 테이블**: 실험명, 상태(Running/Paused), 방문자 수, 전환율, 날짜
- **실험 성과 상세**: 가격대별 전환율, 클릭률, 유저 행동 분석, 감성 분포 차트
- **AI Insight 카드**: 최적 전략 제안 (텍스트 기반)

### C. 실험 생성 플로우 (4 Step Wizard)

| 단계 | 내용 |
|------|------|
| Step 1 | Basic Info — 제품명, 간단 설명 |
| Step 2 | Pricing — 가격 플랜 설정 |
| Step 3 | Landing — 랜딩 페이지 커스텀 |
| Step 4 | Launch — 배포 및 링크 발급 |

---

## 5. 폴더 구조

```
tryflow/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # 사이드바 포함 대시보드 레이아웃
│   │   ├── dashboard/
│   │   │   └── page.tsx            # 메인 대시보드
│   │   ├── experiments/
│   │   │   ├── page.tsx            # 실험 목록
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # 실험 생성 wizard
│   │   │   └── [id]/
│   │   │       └── page.tsx        # 실험 성과 상세
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── (landing)/
│   │   └── [slug]/
│   │       └── page.tsx            # 공개 랜딩 페이지 (유저 진입)
│   ├── explore/
│   │   └── page.tsx                # Explore Pricing Experiments
│   ├── pricing/
│   │   └── page.tsx                # 플랜 선택 페이지
│   ├── layout.tsx                  # 루트 레이아웃
│   ├── page.tsx                    # 메인 소개 페이지
│   └── globals.css
│
├── components/
│   ├── ui/                         # Shadcn 기반 기본 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx           # 방문자/전환율 요약 카드
│   │   ├── ExperimentsTable.tsx    # 실험 목록 테이블
│   │   ├── WinningVariantCard.tsx  # 우승 변형 강조 카드
│   │   └── AiInsightCard.tsx       # AI 인사이트 카드
│   ├── experiments/
│   │   ├── ExperimentWizard.tsx    # 4단계 생성 폼
│   │   ├── PerformanceChart.tsx    # 전환율 차트
│   │   ├── SentimentDonut.tsx      # 감성 분포 도넛 차트
│   │   └── HeatmapCard.tsx         # 클릭 히트맵 (선택)
│   └── landing/
│       ├── HeroSection.tsx
│       ├── PricingSection.tsx
│       ├── FeatureVoteSection.tsx
│       └── WaitlistForm.tsx
│
├── lib/
│   ├── db.ts                       # Prisma 클라이언트
│   ├── auth.ts                     # NextAuth 설정
│   └── analytics.ts                # 이벤트 트래킹 헬퍼
│
├── prisma/
│   └── schema.prisma
│
└── public/
    └── ...
```

---

## 6. 데이터베이스 스키마 (PostgreSQL + Prisma)

```prisma
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  name        String?
  plan        Plan         @default(BASIC)
  experiments Experiment[]
  createdAt   DateTime     @default(now())
}

model Experiment {
  id             String      @id @default(cuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id])
  slug           String      @unique    // 공개 랜딩 URL
  productName    String
  description    String
  status         ExpStatus   @default(DRAFT)
  pricingTiers   Json        // [{ name, price, features[] }]
  waitlistEmails WaitlistEntry[]
  events         ClickEvent[]
  createdAt      DateTime    @default(now())
}

model WaitlistEntry {
  id           String     @id @default(cuid())
  experimentId String
  experiment   Experiment @relation(fields: [experimentId], references: [id])
  email        String
  createdAt    DateTime   @default(now())
}

model ClickEvent {
  id           String     @id @default(cuid())
  experimentId String
  experiment   Experiment @relation(fields: [experimentId], references: [id])
  eventType    String     // "pricing_click" | "feature_vote" | "waitlist_submit"
  metadata     Json       // { planName, featureId, ... }
  createdAt    DateTime   @default(now())
}

enum Plan {
  BASIC
  PRO
  PREMIUM
}

enum ExpStatus {
  DRAFT
  RUNNING
  PAUSED
  ENDED
}
```

---

## 7. 핵심 API 라우트

```
POST   /api/auth/[...nextauth]       # 인증
POST   /api/experiments              # 실험 생성
GET    /api/experiments              # 실험 목록 조회
GET    /api/experiments/[id]         # 실험 상세
PATCH  /api/experiments/[id]         # 상태 변경 (Running/Paused)
GET    /api/experiments/[id]/stats   # 통계 (방문자, 전환율, 클릭 분포)
POST   /api/track                    # 클릭 이벤트 수집 (public)
POST   /api/waitlist                 # 이메일 등록 (public)
```

---

## 8. 개발 시작

```bash
# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# DATABASE_URL, NEXTAUTH_SECRET 등 입력

# DB 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

---

## 9. 환경 변수

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tryflow"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
```

---

## 10. 단계별 구현 순서

1. **[Step 1]** `prisma/schema.prisma` 작성 + DB 마이그레이션
2. **[Step 2]** 루트 `layout.tsx` + `globals.css` (디자인 시스템 토큰 적용)
3. **[Step 3]** 메인 소개 `page.tsx` (Hero, Features, Pricing 섹션)
4. **[Step 4]** 대시보드 레이아웃 (Sidebar + TopBar)
5. **[Step 5]** 실험 생성 Wizard (4-step form)
6. **[Step 6]** 공개 랜딩 페이지 (`/[slug]`) + 이벤트 트래킹 API
7. **[Step 7]** 통계 차트 (Recharts 기반 전환율, 클릭 분포)
