-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Profiles (auto-created on signup)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  role text not null default 'member' check (role in ('executive','manager','member')),
  org_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- KPI Nodes (fractal core)
create table kpi_nodes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  parent_id uuid references kpi_nodes(id) on delete cascade,
  depth smallint not null default 0 check (depth between 0 and 2),
  title text not null,
  description text,
  emoji text default '🎯',
  owner_id uuid references auth.users(id),
  target_value numeric not null default 100,
  current_value numeric not null default 0,
  unit text not null default '%',
  weight numeric not null default 1.0,
  status text not null default 'active' check (status in ('active','at_risk','completed','paused')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  start_date date,
  due_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Progress Logs
create table progress_logs (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references kpi_nodes(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  previous_value numeric not null,
  new_value numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references kpi_nodes(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Chat Messages
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  context_node_id uuid references kpi_nodes(id),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_kpi_nodes_org on kpi_nodes(org_id);
create index idx_kpi_nodes_parent on kpi_nodes(parent_id);
create index idx_kpi_nodes_owner on kpi_nodes(owner_id);
create index idx_progress_logs_node on progress_logs(node_id);
create index idx_comments_node on comments(node_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Updated_at trigger
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger kpi_nodes_updated
  before update on kpi_nodes
  for each row execute function update_timestamp();

-- Contribution path function (recursive CTE)
create or replace function get_contribution_path(node_uuid uuid)
returns table(
  node_id uuid, title text, depth smallint,
  progress numeric, weight numeric, cumulative_impact numeric
) as $$
with recursive path as (
  select id, title, depth, current_value, target_value, weight, parent_id,
         case when target_value > 0 then (current_value / target_value * 100) else 0 end as progress,
         1.0::numeric as cumulative
  from kpi_nodes where id = node_uuid
  union all
  select k.id, k.title, k.depth, k.current_value, k.target_value, k.weight, k.parent_id,
         case when k.target_value > 0 then (k.current_value / k.target_value * 100) else 0 end,
         p.cumulative * p.weight
  from kpi_nodes k join path p on k.id = p.parent_id
)
select id, title, depth, progress, weight, cumulative from path;
$$ language sql stable;

-- RLS
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table kpi_nodes enable row level security;
alter table progress_logs enable row level security;
alter table comments enable row level security;
alter table chat_messages enable row level security;

-- Simple RLS: users can access their org data
create policy "org_member" on organizations for all using (
  id in (select org_id from profiles where id = auth.uid())
  or owner_id = auth.uid()
);

create policy "profile_own" on profiles for all using (id = auth.uid());
create policy "profile_read_org" on profiles for select using (
  org_id in (select org_id from profiles where id = auth.uid())
);

create policy "kpi_org" on kpi_nodes for all using (
  org_id in (select org_id from profiles where id = auth.uid())
);

create policy "progress_org" on progress_logs for all using (
  node_id in (select id from kpi_nodes where org_id in (select org_id from profiles where id = auth.uid()))
);

create policy "comments_org" on comments for all using (
  node_id in (select id from kpi_nodes where org_id in (select org_id from profiles where id = auth.uid()))
);

create policy "chat_own" on chat_messages for all using (user_id = auth.uid());
