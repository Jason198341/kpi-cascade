-- Executive reporting & feedback tracking
create table executive_logs (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references kpi_nodes(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  log_type text not null check (log_type in (
    'plan_report', 'mid_report', 'result_report',
    'feedback_1', 'feedback_2', 'feedback_3'
  )),
  done boolean not null default false,
  done_at timestamptz,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per node + user + log_type (upsert pattern)
create unique index idx_exec_log_unique on executive_logs(node_id, user_id, log_type);
create index idx_exec_log_node on executive_logs(node_id);
create index idx_exec_log_user on executive_logs(user_id);

-- Reuse existing update_timestamp trigger function
create trigger executive_logs_updated
  before update on executive_logs
  for each row execute function update_timestamp();

-- RLS: same-org members only
alter table executive_logs enable row level security;

create policy "exec_log_org" on executive_logs for all using (
  node_id in (
    select id from kpi_nodes where org_id in (
      select org_id from public.profiles where id = auth.uid()
    )
  )
);
