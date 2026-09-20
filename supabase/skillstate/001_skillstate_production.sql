-- SkillState-owned production schema for the existing rrqfhnwnfjlrejbkbnjt project.
-- Review and run this file in the Supabase SQL Editor. It does not alter IITM tables.

create table if not exists public.skillstate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  onboarding_completed boolean not null default false,
  learner_name text,
  learner_stage text,
  field_of_study text,
  weekly_hours integer,
  planning_horizon jsonb,
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skillstate_learner_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state_json jsonb not null,
  schema_version integer not null,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skillstate_generated_careers (
  id uuid primary key default gen_random_uuid(),
  canonical_slug text not null unique,
  display_name text not null,
  career_json jsonb not null,
  graph_json jsonb not null,
  knowledge_version text not null,
  status text not null check (status in ('validated', 'disabled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.skillstate_generated_career_aliases (
  normalized_alias text primary key,
  career_id uuid not null references public.skillstate_generated_careers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.skillstate_ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  model text,
  status text not null check (status in ('started', 'succeeded', 'failed', 'rate-limited')),
  duration_ms integer,
  usage_json jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists skillstate_ai_requests_user_created_idx
  on public.skillstate_ai_requests(user_id, created_at desc);

alter table public.skillstate_profiles enable row level security;
alter table public.skillstate_learner_state enable row level security;
alter table public.skillstate_generated_careers enable row level security;
alter table public.skillstate_generated_career_aliases enable row level security;
alter table public.skillstate_ai_requests enable row level security;

drop policy if exists "skillstate_profiles_select_own" on public.skillstate_profiles;
create policy "skillstate_profiles_select_own"
  on public.skillstate_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "skillstate_profiles_insert_own" on public.skillstate_profiles;
create policy "skillstate_profiles_insert_own"
  on public.skillstate_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "skillstate_profiles_update_own" on public.skillstate_profiles;
create policy "skillstate_profiles_update_own"
  on public.skillstate_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "skillstate_profiles_delete_own" on public.skillstate_profiles;
create policy "skillstate_profiles_delete_own"
  on public.skillstate_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "skillstate_state_select_own" on public.skillstate_learner_state;
create policy "skillstate_state_select_own"
  on public.skillstate_learner_state for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "skillstate_state_insert_own" on public.skillstate_learner_state;
create policy "skillstate_state_insert_own"
  on public.skillstate_learner_state for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "skillstate_state_update_own" on public.skillstate_learner_state;
create policy "skillstate_state_update_own"
  on public.skillstate_learner_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "skillstate_state_delete_own" on public.skillstate_learner_state;
create policy "skillstate_state_delete_own"
  on public.skillstate_learner_state for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "skillstate_generated_careers_read_validated" on public.skillstate_generated_careers;
create policy "skillstate_generated_careers_read_validated"
  on public.skillstate_generated_careers for select to authenticated
  using (status = 'validated');
drop policy if exists "skillstate_generated_aliases_read" on public.skillstate_generated_career_aliases;
create policy "skillstate_generated_aliases_read"
  on public.skillstate_generated_career_aliases for select to authenticated
  using (true);

revoke all on public.skillstate_profiles from anon;
revoke all on public.skillstate_learner_state from anon;
revoke all on public.skillstate_generated_careers from anon;
revoke all on public.skillstate_generated_career_aliases from anon;
revoke all on public.skillstate_ai_requests from anon, authenticated;

grant select, insert, update, delete on public.skillstate_profiles to authenticated;
grant select, insert, update, delete on public.skillstate_learner_state to authenticated;
grant select on public.skillstate_generated_careers to authenticated;
grant select on public.skillstate_generated_career_aliases to authenticated;
grant all on public.skillstate_profiles to service_role;
grant all on public.skillstate_learner_state to service_role;
grant all on public.skillstate_generated_careers to service_role;
grant all on public.skillstate_generated_career_aliases to service_role;
grant all on public.skillstate_ai_requests to service_role;

create or replace function public.skillstate_save_learner_state(
  p_state_json jsonb,
  p_schema_version integer,
  p_expected_revision bigint default null
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
  v_profile jsonb := p_state_json -> 'profile';
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if coalesce(v_profile ->> 'id', '') <> v_user_id::text then
    raise exception 'profile_user_mismatch' using errcode = '42501';
  end if;

  insert into public.skillstate_profiles (
    user_id,
    onboarding_completed,
    learner_name,
    learner_stage,
    field_of_study,
    weekly_hours,
    planning_horizon,
    profile_json,
    updated_at
  ) values (
    v_user_id,
    coalesce((p_state_json ->> 'onboardingCompleted')::boolean, false),
    v_profile ->> 'name',
    v_profile ->> 'stage',
    v_profile ->> 'fieldOfStudy',
    nullif(v_profile ->> 'weeklyHours', '')::integer,
    v_profile -> 'planningHorizon',
    v_profile,
    now()
  )
  on conflict (user_id) do update set
    onboarding_completed = excluded.onboarding_completed,
    learner_name = excluded.learner_name,
    learner_stage = excluded.learner_stage,
    field_of_study = excluded.field_of_study,
    weekly_hours = excluded.weekly_hours,
    planning_horizon = excluded.planning_horizon,
    profile_json = excluded.profile_json,
    updated_at = now();

  insert into public.skillstate_learner_state (
    user_id, state_json, schema_version, revision, updated_at
  ) values (
    v_user_id, p_state_json, p_schema_version, 1, now()
  )
  on conflict (user_id) do update set
    state_json = excluded.state_json,
    schema_version = excluded.schema_version,
    revision = public.skillstate_learner_state.revision + 1,
    updated_at = now()
  where public.skillstate_learner_state.revision = p_expected_revision
  returning revision into v_revision;

  if v_revision is null then
    raise exception 'skillstate_revision_conflict' using errcode = '40001';
  end if;
  return v_revision;
end;
$$;

revoke all on function public.skillstate_save_learner_state(jsonb, integer, bigint) from public, anon;
grant execute on function public.skillstate_save_learner_state(jsonb, integer, bigint) to authenticated;

comment on table public.skillstate_learner_state is
  'Current validated SkillState learner snapshot. Browser access is owner-scoped by RLS.';
comment on table public.skillstate_generated_careers is
  'Shared validated generated destination graphs. Writes are server/service-role only.';
