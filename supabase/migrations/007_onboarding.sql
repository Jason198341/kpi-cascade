-- 온보딩 필드 추가

-- profiles: 직급/직책 + 온보딩 완료 여부
alter table profiles add column if not exists position_title text;
alter table profiles add column if not exists onboarding_completed boolean not null default false;

-- organizations: 보고 단계 수, 피드백 횟수, 조직도 레벨 정보
alter table organizations add column if not exists report_stages integer not null default 3;
alter table organizations add column if not exists feedback_rounds integer not null default 3;
alter table organizations add column if not exists org_levels jsonb default '[]'::jsonb;
