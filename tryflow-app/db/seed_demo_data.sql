-- ============================================================
-- Fastlane — 시연용 mock 데이터 시드 (B 안 + 분쟁/검토 흐름 화면 확인용)
--
-- 이 SQL 한 번 실행하면:
--   1) 가짜 심사위원 2명 (로그인 불가, FK 통과용)
--   2) 대회 2개 (창업 / 에듀테크)
--   3) 출품 8건 (각 대회 4건, AI score 직접 채움 — evaluate API 호출 X)
--   4) 본인 + 가짜 judge 2명 배정
--   5) 심사위원 평가 5건 (다양한 override / accept 패턴)
--   6) 분쟁 결정 2건
--   7) 1건은 reviewClosed (검토 종료된 상태)
--
-- ⚠️ 본인 이메일 확인:
--   아래 v_organizer_email 한 줄만 본인의 Supabase 가입 이메일로 수정.
--   (Org 이름이 'try.wepp@gmail.com's Org' 면 이 값 그대로 OK.)
--
-- 실행: Supabase SQL Editor 새 쿼리에 통째로 붙여넣기 → Run.
-- 재실행 안전: 모두 ON CONFLICT DO NOTHING / DO UPDATE 또는 NOT EXISTS 가드.
-- ============================================================

do $$
declare
  -- ───────────────────────────────────────────────────────────
  -- 1) 본인 이메일 — 여기만 수정!
  -- ───────────────────────────────────────────────────────────
  v_organizer_email constant text := 'try.wepp@gmail.com';

  -- 자동 채워짐
  v_owner uuid;
  v_judge_kim uuid := '00000000-0000-4000-8000-000000000001';
  v_judge_lee uuid := '00000000-0000-4000-8000-000000000002';

  -- competition / proposal ID (고정 — 재실행 시 멱등)
  v_comp_startup uuid := '11111111-1111-4111-8111-111111111111';
  v_comp_edu     uuid := '22222222-2222-4222-8222-222222222222';
  v_p1 uuid := '33333333-3333-4333-8333-333333333301';
  v_p2 uuid := '33333333-3333-4333-8333-333333333302';
  v_p3 uuid := '33333333-3333-4333-8333-333333333303';
  v_p4 uuid := '33333333-3333-4333-8333-333333333304';
  v_p5 uuid := '44444444-4444-4444-8444-444444444401';
  v_p6 uuid := '44444444-4444-4444-8444-444444444402';
  v_p7 uuid := '44444444-4444-4444-8444-444444444403';
  v_p8 uuid := '44444444-4444-4444-8444-444444444404';
begin
  -- ───────────────────────────────────────────────────────────
  -- A) 본인 user_id 조회
  -- ───────────────────────────────────────────────────────────
  select id into v_owner from auth.users where email = v_organizer_email limit 1;
  if v_owner is null then
    raise exception '이메일 % 매칭되는 user 없음. v_organizer_email 을 본인 가입 이메일로 수정 후 다시 실행.', v_organizer_email;
  end if;

  -- ───────────────────────────────────────────────────────────
  -- B) 가짜 심사위원 2명 auth.users 에 삽입 (로그인 불가, FK 통과용)
  -- ───────────────────────────────────────────────────────────
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    ('00000000-0000-0000-0000-000000000000', v_judge_kim, 'authenticated', 'authenticated',
     'demo-judge-kim@fastlane.local', '', now(), '{"provider":"demo"}', '{}',
     now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_judge_lee, 'authenticated', 'authenticated',
     'demo-judge-lee@fastlane.local', '', now(), '{"provider":"demo"}', '{}',
     now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  -- ───────────────────────────────────────────────────────────
  -- C) 대회 2개 — 창업 / 에듀테크
  -- ───────────────────────────────────────────────────────────
  insert into competitions (
    id, user_id, name, organizer, deadline, template, status,
    rubric_status, theme, competition_type
  ) values (
    v_comp_startup, v_owner,
    '2026 모두의 창업경진대회 (봄)',
    '중소벤처기업부 · 창업진흥원',
    now() + interval '14 days',
    '{
      "id": "kosme-2026",
      "name": "모두의 창업경진대회 2026",
      "isBuiltin": false,
      "criteria": [
        {"id":"innovation","name":"혁신성","weight":0.30,"description":"기술·사업모델의 새로움. 기존 시장에 없는 차별점."},
        {"id":"feasibility","name":"사업화 가능성","weight":0.25,"description":"현실적으로 구현 가능한가, 자원 대비 실현 난이도."},
        {"id":"marketability","name":"시장성","weight":0.20,"description":"수요 규모와 성장성. 진입 장벽 대비 기회 크기."},
        {"id":"team","name":"팀 역량","weight":0.15,"description":"수행팀의 전문성, 추진 의지, 보유 역량의 정합성."},
        {"id":"social","name":"사회적 가치","weight":0.10,"description":"공익적 임팩트, ESG, 지역경제 기여도."}
      ]
    }'::jsonb,
    'open', 'ready', '일반 창업 — 다양한 분야 통합', null
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    deadline = excluded.deadline,
    template = excluded.template;

  insert into competitions (
    id, user_id, name, organizer, deadline, template, status,
    rubric_status, theme, competition_type
  ) values (
    v_comp_edu, v_owner,
    '에듀테크 챌린지 2026',
    '한국교육개발원',
    now() + interval '30 days',
    '{
      "id": "edu-2026",
      "name": "에듀테크 6축",
      "isBuiltin": false,
      "criteria": [
        {"id":"pedagogy","name":"교육적 효과","weight":0.30,"description":"학습 목표 달성에 실제로 기여하는가."},
        {"id":"innovation","name":"기술 혁신","weight":0.20,"description":"새로운 기술 활용의 적절성."},
        {"id":"ux","name":"사용자 경험","weight":0.20,"description":"학생/교사의 사용성, 접근성."},
        {"id":"scalability","name":"확장성","weight":0.15,"description":"학교/지역 확장 가능성."},
        {"id":"sustainability","name":"지속가능성","weight":0.15,"description":"운영 모델의 지속 가능성과 단가 구조."}
      ]
    }'::jsonb,
    'open', 'ready', '에듀테크 - 초중등 교육', null
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    deadline = excluded.deadline,
    template = excluded.template;

  -- ───────────────────────────────────────────────────────────
  -- D) 출품 8건 + AI score 직접 채움
  -- ───────────────────────────────────────────────────────────
  -- 창업 대회 4건
  insert into proposals (id, competition_id, submitter_id, title, team, summary, score, evaluation_status) values
    (v_p1, v_comp_startup, null,
     '농촌 고령자용 AI 건강 모니터링', '케어브릿지',
     '고령 1인 가구의 건강을 비접촉 센서와 AI 로 모니터링하고 보호자에게 알림을 보내는 서비스. 농촌 지역 의료 사각지대 해소를 목표.',
     '{"proposalId":"p1","composite":76,"runs":5,"axes":[
        {"criterionId":"innovation","mean":84,"stddev":3.2,"needsReview":false,"reasoning":"비접촉 + 보호자 알림 결합이 기존 솔루션과 차별됨."},
        {"criterionId":"feasibility","mean":71,"stddev":5.1,"needsReview":false},
        {"criterionId":"marketability","mean":78,"stddev":4.4,"needsReview":false},
        {"criterionId":"team","mean":68,"stddev":11.3,"needsReview":true,"reasoning":"팀 백그라운드 정보가 부족해 실행 평가가 흔들림."},
        {"criterionId":"social","mean":92,"stddev":2.1,"needsReview":false}
     ]}'::jsonb,
     'done'),
    (v_p2, v_comp_startup, null,
     '1인 자영업자용 통합 회계 SaaS', '북비',
     'POS·세무·재고를 자동 연동해 영수증 한 장도 안 적게 만드는 1인 사업자 전용 회계 도구.',
     '{"proposalId":"p2","composite":74,"runs":5,"axes":[
        {"criterionId":"innovation","mean":62,"stddev":4.7,"needsReview":false},
        {"criterionId":"feasibility","mean":88,"stddev":2.9,"needsReview":false},
        {"criterionId":"marketability","mean":81,"stddev":3.4,"needsReview":false},
        {"criterionId":"team","mean":75,"stddev":6.2,"needsReview":false},
        {"criterionId":"social","mean":58,"stddev":5.8,"needsReview":false}
     ]}'::jsonb,
     'done'),
    (v_p3, v_comp_startup, null,
     '탄소배출권 자동 정산 플랫폼', '그린레저',
     '중소 제조사가 탄소배출권을 사고 팔 때 발생하는 정산·회계 처리를 자동화. 규제 준수까지 한 번에.',
     '{"proposalId":"p3","composite":71,"runs":5,"axes":[
        {"criterionId":"innovation","mean":73,"stddev":8.6,"needsReview":true,"reasoning":"신선도 있으나 구현 모호성이 점수를 흔듦."},
        {"criterionId":"feasibility","mean":54,"stddev":12.4,"needsReview":true,"reasoning":"규제 변수가 많아 분산이 매우 큼."},
        {"criterionId":"marketability","mean":67,"stddev":9.2,"needsReview":true},
        {"criterionId":"team","mean":71,"stddev":4.8,"needsReview":false},
        {"criterionId":"social","mean":86,"stddev":3.1,"needsReview":false}
     ]}'::jsonb,
     'done'),
    (v_p4, v_comp_startup, null,
     '외국인 유학생 배달 매칭', '딜리버리브릿지',
     '대학 인근 배달 음식을 외국인 유학생 언어로 주문할 수 있게 해주는 매칭 플랫폼.',
     '{"proposalId":"p4","composite":63,"runs":5,"axes":[
        {"criterionId":"innovation","mean":51,"stddev":5.2,"needsReview":false},
        {"criterionId":"feasibility","mean":78,"stddev":3.4,"needsReview":false},
        {"criterionId":"marketability","mean":64,"stddev":4.1,"needsReview":false},
        {"criterionId":"team","mean":58,"stddev":9.7,"needsReview":true,"reasoning":"팀 구성에 대한 정보 누락."},
        {"criterionId":"social","mean":71,"stddev":3.8,"needsReview":false}
     ]}'::jsonb,
     'done')
  on conflict (id) do update set
    competition_id = excluded.competition_id,
    score = excluded.score,
    evaluation_status = excluded.evaluation_status;

  -- 에듀테크 대회 4건
  insert into proposals (id, competition_id, submitter_id, title, team, summary, score, evaluation_status) values
    (v_p5, v_comp_edu, null,
     '초등교사용 AI 수업안 코파일럿', '수업메이트',
     '교과 단원을 입력하면 차시별 수업안과 활동 자료를 자동 생성, 교사 검토 후 보강.',
     '{"proposalId":"p5","composite":82,"runs":5,"axes":[
        {"criterionId":"pedagogy","mean":86,"stddev":2.7,"needsReview":false},
        {"criterionId":"innovation","mean":79,"stddev":4.0,"needsReview":false},
        {"criterionId":"ux","mean":84,"stddev":3.2,"needsReview":false},
        {"criterionId":"scalability","mean":76,"stddev":4.5,"needsReview":false},
        {"criterionId":"sustainability","mean":88,"stddev":2.0,"needsReview":false}
     ]}'::jsonb,
     'done'),
    (v_p6, v_comp_edu, null,
     '학생 발표 영상 자동 피드백', '스피크에듀',
     '학생이 업로드한 발표 영상을 AI 가 분석해 발음·논리·시선처리를 피드백.',
     '{"proposalId":"p6","composite":68,"runs":5,"axes":[
        {"criterionId":"pedagogy","mean":72,"stddev":5.0,"needsReview":false},
        {"criterionId":"innovation","mean":74,"stddev":6.1,"needsReview":false},
        {"criterionId":"ux","mean":58,"stddev":10.2,"needsReview":true,"reasoning":"학생 사용 흐름이 모호함."},
        {"criterionId":"scalability","mean":65,"stddev":4.4,"needsReview":false},
        {"criterionId":"sustainability","mean":62,"stddev":7.1,"needsReview":false}
     ]}'::jsonb,
     'done'),
    (v_p7, v_comp_edu, null,
     '난독 학습자용 적응형 e-Book', '리딩브릿지',
     '난독 성향 학생용 폰트·간격·하이라이트가 적응적으로 조절되는 e-Book 리더기.',
     '{"proposalId":"p7","composite":79,"runs":5,"axes":[
        {"criterionId":"pedagogy","mean":83,"stddev":3.0,"needsReview":false},
        {"criterionId":"innovation","mean":71,"stddev":4.8,"needsReview":false},
        {"criterionId":"ux","mean":87,"stddev":2.5,"needsReview":false},
        {"criterionId":"scalability","mean":68,"stddev":6.0,"needsReview":false},
        {"criterionId":"sustainability","mean":72,"stddev":5.4,"needsReview":false}
     ]}'::jsonb,
     'done'),
    (v_p8, v_comp_edu, null,
     '교실 IoT 출석·집중도 트래커', '클래스아이',
     '교실 IoT 센서로 학생의 자리·집중도를 측정해 교사가 한눈에 파악하도록.',
     '{"proposalId":"p8","composite":55,"runs":5,"axes":[
        {"criterionId":"pedagogy","mean":51,"stddev":8.8,"needsReview":true,"reasoning":"교육적 효과 입증이 약함."},
        {"criterionId":"innovation","mean":60,"stddev":4.2,"needsReview":false},
        {"criterionId":"ux","mean":54,"stddev":5.0,"needsReview":false},
        {"criterionId":"scalability","mean":62,"stddev":6.6,"needsReview":false},
        {"criterionId":"sustainability","mean":48,"stddev":9.4,"needsReview":true,"reasoning":"개인정보 이슈 관련 분산 큼."}
     ]}'::jsonb,
     'done')
  on conflict (id) do update set
    competition_id = excluded.competition_id,
    score = excluded.score,
    evaluation_status = excluded.evaluation_status;

  -- ───────────────────────────────────────────────────────────
  -- E) 심사위원 배정 — 본인 + 가짜 2명, 두 대회 모두
  -- ───────────────────────────────────────────────────────────
  insert into competition_judges (competition_id, judge_id, judge_name, affiliation, scope) values
    (v_comp_startup, v_owner, '주최자(나)', '대회 운영', 'all'),
    (v_comp_startup, v_judge_kim, '김민수', '스파크랩스 파트너', 'all'),
    (v_comp_startup, v_judge_lee, '이지현', '고려대학교 경영학과 교수', 'all'),
    (v_comp_edu, v_owner, '주최자(나)', '대회 운영', 'all'),
    (v_comp_edu, v_judge_kim, '김민수', '스파크랩스 파트너', 'all'),
    (v_comp_edu, v_judge_lee, '이지현', '고려대학교 경영학과 교수', 'all')
  on conflict (competition_id, judge_id) do update set
    judge_name = excluded.judge_name,
    affiliation = excluded.affiliation;

  -- ───────────────────────────────────────────────────────────
  -- F) 심사위원 평가 5건 (다양한 패턴 — 수용 / override / 코멘트)
  -- ───────────────────────────────────────────────────────────
  insert into proposal_reviews (proposal_id, judge_id, judge_name, affiliation, axes, overall_comment, status, submitted_at) values
    (v_p1, v_judge_kim, '김민수', '스파크랩스 파트너',
     '[
       {"criterionId":"innovation","acceptedAiScore":true},
       {"criterionId":"feasibility","acceptedAiScore":false,"overrideScore":65,"comment":"규제 가정이 낙관적."},
       {"criterionId":"marketability","acceptedAiScore":true},
       {"criterionId":"team","acceptedAiScore":false,"overrideScore":72,"comment":"보완 자료 검토 후 상향."},
       {"criterionId":"social","acceptedAiScore":true}
     ]'::jsonb,
     '사회적 가치는 분명. 단 팀 백그라운드 검증이 추가 필요.',
     'submitted', now() - interval '6 hours'),
    (v_p1, v_judge_lee, '이지현', '고려대학교 경영학과 교수',
     '[
       {"criterionId":"innovation","acceptedAiScore":false,"overrideScore":78,"comment":"비접촉 결합은 의외성 약함."},
       {"criterionId":"feasibility","acceptedAiScore":true},
       {"criterionId":"marketability","acceptedAiScore":true},
       {"criterionId":"team","acceptedAiScore":false,"overrideScore":62,"comment":"실행 검증 더 필요."},
       {"criterionId":"social","acceptedAiScore":true}
     ]'::jsonb,
     '본심 검토 권고. 팀 역량 항목은 추가 인터뷰 필요.',
     'submitted', now() - interval '4 hours'),
    (v_p3, v_judge_kim, '김민수', '스파크랩스 파트너',
     '[
       {"criterionId":"innovation","acceptedAiScore":true},
       {"criterionId":"feasibility","acceptedAiScore":false,"overrideScore":65,"comment":"정부 가이드라인 후 실행 가능성 상향."},
       {"criterionId":"marketability","acceptedAiScore":false,"overrideScore":72},
       {"criterionId":"team","acceptedAiScore":true},
       {"criterionId":"social","acceptedAiScore":true}
     ]'::jsonb,
     '규제 환경 변화 반영하면 점수 더 올라갈 출품.',
     'submitted', now() - interval '2 hours'),
    (v_p5, v_judge_kim, '김민수', '스파크랩스 파트너',
     '[
       {"criterionId":"pedagogy","acceptedAiScore":true},
       {"criterionId":"innovation","acceptedAiScore":true},
       {"criterionId":"ux","acceptedAiScore":false,"overrideScore":88,"comment":"실제 시연 데모가 매우 매끄러움."},
       {"criterionId":"scalability","acceptedAiScore":true},
       {"criterionId":"sustainability","acceptedAiScore":true}
     ]'::jsonb,
     '전반적으로 성숙한 출품. 본심 강력 권고.',
     'submitted', now() - interval '8 hours'),
    (v_p5, v_judge_lee, '이지현', '고려대학교 경영학과 교수',
     '[
       {"criterionId":"pedagogy","acceptedAiScore":true},
       {"criterionId":"innovation","acceptedAiScore":true},
       {"criterionId":"ux","acceptedAiScore":true},
       {"criterionId":"scalability","acceptedAiScore":false,"overrideScore":82,"comment":"공공 지자체 도입 사례 가능성 있음."},
       {"criterionId":"sustainability","acceptedAiScore":true}
     ]'::jsonb,
     '교육적 효과 측면에서 가장 신뢰감.',
     'submitted', now() - interval '5 hours')
  on conflict (proposal_id, judge_id) do update set
    axes = excluded.axes,
    overall_comment = excluded.overall_comment,
    submitted_at = excluded.submitted_at;

  -- ───────────────────────────────────────────────────────────
  -- G) 분쟁 결정 2건 (p1 team / p3 feasibility 이미 결정됨)
  -- ───────────────────────────────────────────────────────────
  insert into proposal_dispute_resolutions (
    proposal_id, criterion_id, action, final_score, decided_by, decided_by_name, decided_at, reason
  ) values
    (v_p1, 'team', 'accept_human_avg', 70, v_owner, '주최자(나)',
     now() - interval '3 hours',
     '심사위원 두 분 평균이 합리적. 보완 자료 검토 결과 채택.'),
    (v_p3, 'feasibility', 'manual_override', 65, v_owner, '주최자(나)',
     now() - interval '1 hour',
     '규제 이슈는 분명하나 정부 가이드라인 발표 이후 실행 가능성 상향.')
  on conflict (proposal_id, criterion_id) do update set
    action = excluded.action,
    final_score = excluded.final_score,
    decided_by = excluded.decided_by,
    decided_by_name = excluded.decided_by_name,
    decided_at = excluded.decided_at,
    reason = excluded.reason;

  -- ───────────────────────────────────────────────────────────
  -- H) 검토 종료 1건 (p5 — 모범 완료 사례)
  -- ───────────────────────────────────────────────────────────
  update proposals set
    review_closed_at = now() - interval '30 minutes',
    review_closed_by = v_owner
  where id = v_p5;

  raise notice '=== 시드 완료 ===';
  raise notice 'owner: %', v_owner;
  raise notice '대회 2개, 출품 8건, 심사위원 3명, 평가 5건, 분쟁 결정 2건, 검토 종료 1건.';
end $$;
