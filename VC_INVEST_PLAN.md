# VC 투자 기능 구현 계획서

> 작성일: 2026-04-10
> 목표: VC/기업이 월 정액권으로 모든 아이디어를 열람하고, 아이디어 제출자에게 Gmail로 연락할 수 있는 시스템

---

## 전체 아키텍처 요약

```
[예비 창업자]                          [VC / 기업 사용자]
     │                                       │
  아이디어 제출 (익명)                   월 정액권 결제 (Stripe)
     │                                       │
     ▼                                       ▼
┌──────────────┐                    ┌──────────────────┐
│ idea_submissions │◄────열람────────│  VC 전용 대시보드    │
│ insight_reports  │                │  (필터/검색/정렬)    │
│ analysis_reports │                └────────┬─────────┘
└──────────────┘                             │
                                      "연락하기" 클릭
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │  Gmail 발송 시스템   │
                                    │  (제출자 이메일로)    │
                                    └──────────────────┘
```

---

## Phase 0: 사전 준비 (DB 스키마 설계)

### 0-1. 유저 프로필 테이블 신설

현재 `auth.users`에만 유저 정보가 있고, 별도 프로필 테이블이 없음.
VC/일반 유저 구분, 구독 상태 등을 관리할 테이블이 필요.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'founder',       -- 'founder' | 'vc' | 'enterprise'
  company_name TEXT,                           -- VC/기업명 (vc, enterprise만)
  company_url TEXT,                            -- 회사 웹사이트
  bio TEXT,                                    -- 소개
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Google 로그인 시 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 0-2. 구독 테이블 신설

```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'pro',            -- 'pro' | 'enterprise'
  status TEXT NOT NULL DEFAULT 'active',       -- 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### 0-3. 연락(컨택) 이력 테이블

```sql
CREATE TABLE contact_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id UUID NOT NULL REFERENCES user_profiles(id),       -- VC
  idea_id TEXT NOT NULL REFERENCES idea_submissions(id),       -- 어떤 아이디어에 대해
  recipient_email TEXT NOT NULL,                               -- 제출자 이메일
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',         -- 'sent' | 'delivered' | 'failed'
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_requests_sender ON contact_requests(sender_id);
CREATE INDEX idx_contact_requests_idea ON contact_requests(idea_id);
```

### 0-4. idea_submissions 테이블 수정

현재 제출자가 익명이라 이메일이 없음. 연락을 받으려면 **제출 시 이메일 동의**가 필요.

```sql
ALTER TABLE idea_submissions ADD COLUMN contact_email TEXT;           -- 연락받을 이메일 (선택)
ALTER TABLE idea_submissions ADD COLUMN allow_contact BOOLEAN DEFAULT false;  -- 연락 허용 여부
```

### 0-5. RLS 정책

```sql
-- user_profiles: 본인만 수정, 읽기는 자유
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- subscriptions: 본인 것만 읽기
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_sub" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- contact_requests: 발신자만 읽기
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_own_contacts" ON contact_requests FOR SELECT USING (auth.uid() = sender_id);

-- idea_submissions: 구독자는 모든 아이디어 열람 가능 (API 레벨에서 체크)
-- 기존 "public read ideas" 정책 유지하되, contact_email은 API에서 필터링
```

---

## Phase 1: Stripe 결제 연동

### 1-1. Stripe 설정

```
필요한 환경변수 (.env.local):
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PRO_PRICE_ID=price_...           # Pro 월 $99
  STRIPE_ENTERPRISE_PRICE_ID=price_...    # Enterprise 월 커스텀
```

### 1-2. 필요한 API 라우트

| 라우트 | 메서드 | 역할 |
|---|---|---|
| `/api/stripe/checkout` | POST | Stripe Checkout 세션 생성 |
| `/api/stripe/webhook` | POST | Stripe 이벤트 수신 (결제 성공/실패/취소) |
| `/api/stripe/portal` | POST | 고객 포털 (구독 관리/취소) |

### 1-3. Checkout 플로우

```
1. VC 유저가 /pricing 페이지에서 "Pro 구독" 클릭
2. POST /api/stripe/checkout → Stripe Checkout 세션 생성
3. Stripe 결제 페이지로 리다이렉트
4. 결제 완료 → Stripe Webhook 수신
5. Webhook에서:
   a. subscriptions 테이블에 INSERT
   b. user_profiles.role = 'vc' 로 UPDATE
6. 유저가 /vc/dashboard 접근 가능해짐
```

### 1-4. Webhook 처리 이벤트

```typescript
// 처리해야 할 Stripe 이벤트:
'checkout.session.completed'     → 구독 생성, role 업데이트
'invoice.paid'                   → current_period_end 갱신
'invoice.payment_failed'         → status = 'past_due'
'customer.subscription.deleted'  → status = 'canceled', role = 'founder'로 복원
'customer.subscription.updated'  → 플랜 변경 반영
```

### 1-5. 구독 상태 확인 미들웨어

```typescript
// middleware.ts 수정
// /vc/* 경로 → 인증 + 구독 active 확인
// 구독 없으면 /pricing 으로 리다이렉트
```

---

## Phase 2: VC 전용 대시보드

### 2-1. 페이지 구조

```
/vc
├── /vc/dashboard          ← 메인: 전체 아이디어 목록 (필터/검색/정렬)
├── /vc/ideas/[id]         ← 아이디어 상세 + 연락하기 버튼
├── /vc/contacts           ← 내가 보낸 연락 이력
└── /vc/settings           ← VC 프로필 편집, 구독 관리
```

### 2-2. VC 대시보드 (`/vc/dashboard`) — 핵심 페이지

**API: `GET /api/vc/ideas`** (구독자 전용)

```typescript
// 요청 파라미터:
{
  category?: string,          // 카테고리 필터
  sort?: 'newest' | 'viability' | 'trending',
  search?: string,            // 키워드 검색
  saturation?: 'Low' | 'Medium' | 'High',
  trend?: 'Rising' | 'Stable' | 'Declining',
  page?: number,
  limit?: number              // 기본 20
}

// 응답:
{
  ideas: [
    {
      id, category, target_user, description, created_at,
      allow_contact,           // 연락 가능 여부
      insight: { viability_score, saturation_level, trend_direction, summary },
      analysis?: { viability_score, summary }   // deep analysis 있으면
    }
  ],
  total: number,
  page: number
}
```

**UI 구성:**

```
┌─────────────────────────────────────────────────────┐
│  🔍 검색바     [카테고리 ▾]  [트렌드 ▾]  [정렬 ▾]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ 아이디어 카드 ──────────────────────────────┐    │
│  │ [SaaS / B2B]              Viability: 82/100  │    │
│  │                           📈 Rising          │    │
│  │ "AI 기반 B2B 리드 스코어링 툴..."              │    │
│  │                                              │    │
│  │ 타겟: 시리즈A 이상 B2B SaaS 기업              │    │
│  │                                              │    │
│  │ [상세 보기]           [💌 연락하기]            │    │
│  └──────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ 아이디어 카드 ──────────────────────────────┐    │
│  │ ...                                          │    │
│  └──────────────────────────────────────────────┘    │
│                                                     │
│  [< 이전]  1  2  3  4  5  [다음 >]                   │
└─────────────────────────────────────────────────────┘
```

### 2-3. 아이디어 상세 (`/vc/ideas/[id]`)

기존 `/ideas/[id]` 페이지를 확장. VC에게만 추가로 보이는 것:
- **연락하기 버튼** (allow_contact가 true인 경우만)
- **유사 아이디어 목록** (같은 카테고리 최근 아이디어)
- **카테고리 트렌드 차트** (시계열)

### 2-4. 연락 이력 (`/vc/contacts`)

| 날짜 | 아이디어 | 카테고리 | 수신자 | 상태 |
|---|---|---|---|---|
| 2026-04-10 | AI 리드 스코어링 | SaaS | m***@gmail.com | 발송됨 |
| 2026-04-09 | 헬스케어 매칭 | Health | j***@gmail.com | 발송됨 |

---

## Phase 3: Gmail 연락 시스템

### 3-1. 두 가지 구현 방식 비교

| 방식 | 장점 | 단점 | 추천 |
|---|---|---|---|
| **A. 서버에서 직접 발송 (Resend/SendGrid)** | 구현 간단, 안정적 | 제출자가 스팸으로 느낄 수 있음 | **MVP 추천** |
| **B. Gmail API 연동** | VC 본인 Gmail에서 발송, 신뢰감 | OAuth 복잡, 발송 한도 | 장기적 |

### 3-2. 방식 A: Resend로 이메일 발송 (MVP 추천)

```
필요한 환경변수:
  RESEND_API_KEY=re_...
  SENDER_EMAIL=noreply@trywepp.com    # Resend에서 인증한 도메인
```

**API: `POST /api/vc/contact`**

```typescript
// 요청:
{
  ideaId: string,
  subject: string,
  message: string
}

// 처리 로직:
1. 인증 확인 (로그인 + 구독 active)
2. idea_submissions에서 allow_contact=true 확인
3. 일일 연락 횟수 제한 확인 (Pro: 10건/일, Enterprise: 무제한)
4. 이메일 발송 (Resend API)
5. contact_requests에 이력 저장
6. 응답 반환
```

**이메일 템플릿:**

```
From: noreply@trywepp.com
Reply-To: {VC의 실제 이메일}
To: {제출자 contact_email}
Subject: [TryWepp] {VC 회사명}에서 당신의 아이디어에 관심을 보냈습니다

──────────────────────────────
{VC 회사명} ({VC 이름})님이
"{아이디어 카테고리}" 분야의 당신의 아이디어에 대해 연락을 보냈습니다.

메시지:
{VC가 작성한 메시지}

──────────────────────────────
이 이메일에 직접 답장하면 {VC의 이메일}로 전달됩니다.

TryWepp에서 발송된 메시지입니다.
연락 수신을 원하지 않으면 TryWepp 설정에서 변경할 수 있습니다.
```

### 3-3. 방식 B: Gmail API 연동 (장기)

```
1. VC가 /vc/settings에서 "Gmail 연결" 클릭
2. Google OAuth로 Gmail send 권한 획득
3. 연락 시 VC 본인의 Gmail 계정에서 직접 발송
4. 장점: VC의 실제 이메일 주소로 발송되어 신뢰감 높음
```

> 이 방식은 Phase 3-2가 안정화된 이후 추가 구현 권장.

---

## Phase 4: 제출 플로우 수정 (아이디어 제출자 측)

### 4-1. 제출 폼에 연락 동의 단계 추가

현재 3단계 → **4단계**로 변경:

```
Step 0: 카테고리 선택        (기존)
Step 1: 타겟 유저 입력        (기존)
Step 2: 아이디어 설명 입력    (기존)
Step 3: 연락 설정 (신규)      ← 추가
  ┌─────────────────────────────────────────┐
  │  투자자/기업으로부터 연락을 받으시겠습니까?  │
  │                                         │
  │  ○ 네, 연락을 받고 싶습니다               │
  │    → 이메일 입력: [____________]          │
  │    (로그인 시 Google 이메일 자동 입력)     │
  │                                         │
  │  ○ 아니요, 익명을 유지하겠습니다           │
  │                                         │
  │  ※ 이메일은 VC/기업 구독자에게만 공개되며   │
  │    직접 노출되지 않습니다.                 │
  └─────────────────────────────────────────┘
```

### 4-2. 제출자 대시보드에 연락 수신 현황 추가

```
/dashboard 에 새 탭 추가: "받은 관심"

┌──────────────────────────────────────────┐
│  [내 아이디어]   [받은 관심 (3)]            │
├──────────────────────────────────────────┤
│                                          │
│  💌 A벤처캐피탈에서 "AI 리드 스코어링"에    │
│     관심을 보냈습니다 — 2시간 전            │
│     [메시지 보기] [답장하기]                │
│                                          │
│  💌 B기업 이노베이션팀에서 ...              │
│                                          │
└──────────────────────────────────────────┘
```

---

## 구현 순서 (권장)

```
Week 1 ─────────────────────────────────────────────
  Phase 0: DB 스키마 마이그레이션
    ├── user_profiles 테이블 + 트리거
    ├── subscriptions 테이블
    ├── contact_requests 테이블
    └── idea_submissions에 contact_email, allow_contact 컬럼 추가

  Phase 4-1: 제출 폼 수정
    └── Step 3 연락 동의 추가 (이메일 수집 시작)

Week 2 ─────────────────────────────────────────────
  Phase 1: Stripe 결제
    ├── Stripe 계정/상품/가격 설정
    ├── /api/stripe/checkout, /api/stripe/webhook, /api/stripe/portal
    ├── /pricing 페이지
    └── middleware에 구독 체크 추가

Week 3 ─────────────────────────────────────────────
  Phase 2: VC 대시보드
    ├── /api/vc/ideas (필터/검색/페이지네이션)
    ├── /vc/dashboard 페이지
    ├── /vc/ideas/[id] 상세 페이지
    └── /vc/settings 프로필 편집

Week 4 ─────────────────────────────────────────────
  Phase 3: 이메일 연락 시스템
    ├── Resend 연동
    ├── /api/vc/contact API
    ├── 이메일 템플릿
    ├── 연락 이력 페이지 (/vc/contacts)
    └── 제출자 대시보드에 "받은 관심" 탭

Week 5 ─────────────────────────────────────────────
  통합 테스트 & 런칭
    ├── Stripe 테스트 결제 → 구독 활성화 → 아이디어 열람 → 연락 발송 E2E 테스트
    ├── 이메일 스팸 방지 (도메인 SPF/DKIM 설정)
    └── 프로덕션 배포
```

---

## 신규 파일 목록

```
tryflow-app/
├── app/
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts         ← Checkout 세션 생성
│   │   │   ├── webhook/route.ts          ← Stripe 이벤트 수신
│   │   │   └── portal/route.ts           ← 고객 포털
│   │   └── vc/
│   │       ├── ideas/route.ts            ← VC용 아이디어 목록 API
│   │       └── contact/route.ts          ← 연락 발송 API
│   ├── pricing/
│   │   └── page.tsx                      ← 구독 플랜 선택 페이지
│   └── vc/
│       ├── layout.tsx                    ← VC 전용 레이아웃 (구독 체크)
│       ├── dashboard/page.tsx            ← 아이디어 탐색 대시보드
│       ├── ideas/[id]/page.tsx           ← 아이디어 상세 + 연락
│       ├── contacts/page.tsx             ← 연락 이력
│       └── settings/page.tsx             ← VC 프로필/구독 관리
├── components/
│   ├── vc/
│   │   ├── IdeaCard.tsx                  ← VC 대시보드용 카드
│   │   ├── ContactModal.tsx              ← 연락 작성 모달
│   │   ├── FilterBar.tsx                 ← 검색/필터 바
│   │   └── SubscriptionBadge.tsx         ← 구독 상태 뱃지
│   └── pricing/
│       └── PricingCard.tsx               ← 플랜 카드 컴포넌트
├── db/
│   └── vc_schema.sql                     ← Phase 0 전체 마이그레이션
├── lib/
│   ├── stripe.ts                         ← Stripe 클라이언트 초기화
│   └── resend.ts                         ← Resend 클라이언트 초기화
└── emails/
    └── contact-template.tsx              ← 연락 이메일 템플릿 (React Email)
```

---

## 추가 설치 패키지

```bash
npm install stripe                  # 결제
npm install resend                  # 이메일 발송
npm install react-email             # 이메일 템플릿 (선택)
npm install @tanstack/react-query   # VC 대시보드 데이터 페칭/캐싱 (선택)
```

---

## 주의사항 & 의사결정 포인트

### 1. 제출자 이메일 노출 범위
- **현재 설계**: contact_email은 DB에 저장되지만, API 응답에서는 마스킹 (`m***@gmail.com`)
- VC가 "연락하기"를 클릭하면 서버에서 직접 이메일 발송 → VC에게 이메일 직접 노출 안 됨
- Reply-To 헤더로 VC 이메일 설정 → 제출자가 답장하면 VC에게 직접 감

### 2. 무료 체험 여부
- 7일 무료 체험(trial) → 전환율 높이는 데 효과적
- Stripe에서 `trial_period_days: 7` 한 줄이면 구현 가능

### 3. 연락 남용 방지
- Pro 구독: 일 10건 제한
- Enterprise: 무제한
- 같은 아이디어에 같은 VC가 중복 연락 불가
- 제출자가 "연락 차단" 할 수 있는 옵트아웃 기능

### 4. 기존 Explore 페이지와의 관계
- `/explore` — 비로그인/무료 유저도 볼 수 있는 **카테고리 트렌드 요약** (기존 유지)
- `/vc/dashboard` — 구독 VC만 볼 수 있는 **개별 아이디어 전체 목록** (신규)
- 차이점: explore는 트렌드만, VC 대시보드는 실제 아이디어 내용 + 연락 기능

### 5. 가격 정책 제안
| 플랜 | 가격 | 포함 |
|---|---|---|
| Free | $0 | 트렌드 리포트만 열람 (개별 아이디어 내용 못 봄) |
| Pro | $99/mo | 전체 아이디어 열람 + 연락 10건/일 |
| Enterprise | $499/mo | 전체 열람 + 무제한 연락 + API 접근 + 커스텀 리포트 |
