-- ============================================================
-- TryFlow — 학부생 데모 프로젝트 4개 시드 데이터
-- 실행 전: add_fields.sql → comments.sql → 이 파일 순서로 실행
-- user_id는 auth.users 첫 번째 유저를 자동으로 가져와요
-- ============================================================

DO $$
DECLARE
  demo_uid uuid;
BEGIN
  SELECT id INTO demo_uid FROM auth.users ORDER BY created_at LIMIT 1;

  IF demo_uid IS NULL THEN
    RAISE EXCEPTION 'No user found. Please sign in first, then re-run this script.';
  END IF;

INSERT INTO experiments
  (user_id, slug, product_name, description, status,
   category, maker_name,
   hero_title, hero_subtitle, cta_text,
   pricing_tiers, features, total_visitors)
VALUES

-- ── 1. StudyMate — EdTech ─────────────────────────────────
(
  demo_uid,
  'studymate',
  'StudyMate',
  'AI가 내 약점을 분석해 최적의 시험 준비 플랜을 짜주는 학습 도우미 앱',
  'RUNNING',
  'EdTech',
  '김민준 · 컴퓨터공학과 3학년',
  'AI가 짜주는 나만의 시험 플랜',
  '시험 일정을 입력하면 AI가 약점 분석 후 최적 학습 루틴을 자동 설계해드려요. 더 이상 감으로 공부하지 마세요.',
  '무료로 시작하기',
  '[
    {"name":"Free","price":"0","description":"기본 플랜 설정 + 일정 관리","popular":false},
    {"name":"Pro","price":"8","description":"AI 약점 분석 + 맞춤 문제 추천","popular":true},
    {"name":"Team","price":"20","description":"그룹 스터디 + 강사 대시보드","popular":false}
  ]',
  '[
    {"id":"ai-plan","name":"AI 학습 플랜","description":"시험 날짜와 현재 수준 입력 시 자동 플랜 생성"},
    {"id":"weakness","name":"약점 분석","description":"오답 패턴을 분석해 취약 개념 자동 파악"},
    {"id":"quiz","name":"맞춤 문제 은행","description":"내 수준에 맞는 문제를 AI가 매일 추천"},
    {"id":"group","name":"그룹 스터디","description":"친구와 함께 목표 공유 및 진도 체크"}
  ]',
  247
),

-- ── 2. FreshBox — FoodTech ───────────────────────────────
(
  demo_uid,
  'freshbox',
  'FreshBox',
  '지역 농부와 직거래로 신선한 제철 농산물을 매주 집 앞까지 배달해드리는 구독 서비스',
  'RUNNING',
  'FoodTech',
  '이서연 · 경영학과 4학년',
  '동네 농부의 제철 채소, 매주 문앞에',
  '중간 유통 없이 지역 농부와 직거래. 수확 당일 포장해서 다음날 문앞에 도착해요. 레시피도 함께 보내드려요.',
  '첫 박스 받아보기',
  '[
    {"name":"Lite","price":"19","description":"2인 기준 채소 박스 (5~6종)","popular":false},
    {"name":"Standard","price":"35","description":"3~4인 채소+과일 혼합 (8~10종)","popular":true},
    {"name":"Premium","price":"55","description":"4~5인 유기농 프리미엄 (12종+)","popular":false}
  ]',
  '[
    {"id":"seasonal","name":"제철 큐레이션","description":"그 주에 가장 맛있는 작물을 전문가가 선별"},
    {"id":"recipe","name":"레시피 카드","description":"박스에 맞는 주간 레시피 3종 동봉"},
    {"id":"farmer","name":"생산자 스토리","description":"어느 농장에서 왔는지 QR로 확인 가능"},
    {"id":"skip","name":"배송 스킵","description":"여행·바쁜 주는 미리 스킵 가능"}
  ]',
  189
),

-- ── 3. FlowFit — HealthTech ──────────────────────────────
(
  demo_uid,
  'flowfit',
  'FlowFit',
  '체형과 목표를 분석해 매일 달라지는 홈트 루틴을 만들어주는 AI 퍼스널 트레이너',
  'RUNNING',
  'HealthTech',
  '박지호 · 체육교육과 3학년',
  'AI 트레이너가 매일 새로운 루틴을',
  '체형 사진 한 장이면 충분해요. AI가 체형을 분석하고 목표(다이어트·근력·유연성)에 맞는 루틴을 매일 새로 짜드려요.',
  '무료로 분석받기',
  '[
    {"name":"Free","price":"0","description":"기본 루틴 3종 + 영상 가이드","popular":false},
    {"name":"Plus","price":"6","description":"AI 맞춤 루틴 + 진도 분석","popular":true},
    {"name":"Coach","price":"15","description":"1:1 전문 코치 주 1회 피드백","popular":false}
  ]',
  '[
    {"id":"body-scan","name":"AI 체형 분석","description":"사진으로 체형 타입과 불균형 파악"},
    {"id":"daily","name":"매일 새 루틴","description":"지루하지 않게 매일 다른 운동 구성"},
    {"id":"video","name":"영상 가이드","description":"동작별 정확한 자세 영상 제공"},
    {"id":"coach","name":"1:1 코칭","description":"실제 전문 트레이너의 주간 피드백"}
  ]',
  312
),

-- ── 4. NeighborHub — Community ───────────────────────────
(
  demo_uid,
  'neighborhub',
  'NeighborHub',
  '동네 이웃과 재능을 교환하고 필요한 도움을 쉽게 구하는 하이퍼로컬 커뮤니티 플랫폼',
  'RUNNING',
  'Community',
  '최예진 · 사회학과 2학년',
  '이웃과 재능을 나눠요',
  '영어 과외가 필요하면 김밥 만들기를 가르쳐주는 이웃과 맞교환하세요. 돈 없이도 서로 돕는 동네가 될 수 있어요.',
  '동네 탐색하기',
  '[
    {"name":"Free","price":"0","description":"재능 등록 3개 + 이웃 채팅","popular":false},
    {"name":"Verified","price":"4","description":"신뢰 배지 + 무제한 등록","popular":true},
    {"name":"Pro","price":"12","description":"우선 노출 + 동네 이벤트 주최","popular":false}
  ]',
  '[
    {"id":"talent","name":"재능 등록","description":"내가 잘하는 것, 필요한 것 자유롭게 등록"},
    {"id":"match","name":"AI 매칭","description":"서로 필요한 재능을 가진 이웃 자동 연결"},
    {"id":"trust","name":"신뢰 점수","description":"거래 후 상호 평가로 신뢰도 쌓기"},
    {"id":"event","name":"동네 이벤트","description":"이웃들과 함께하는 소규모 오프라인 모임"}
  ]',
  156
);

END $$;
