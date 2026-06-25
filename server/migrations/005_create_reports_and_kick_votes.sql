-- Webapp moderation: user reports + vote-to-kick ballots.
-- Run once in the Supabase SQL editor.

-- ── Reports ──────────────────────────────────────────────────────────────────
-- One row per report (a user can be reported many times, by many people). No FKs
-- on reporter/reportee so a report can name either a webapp_users id or a native
-- profiles id (rosters mix both). event_id is kept for context.
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete set null,
  reporter_id uuid not null,   -- who filed the report
  reportee_id uuid not null,   -- who is being reported
  reason      text not null,
  created_at  timestamptz not null default now()
);
create index if not exists reports_reportee_idx on public.reports(reportee_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_event_idx    on public.reports(event_id);
alter table public.reports enable row level security;

-- ── Vote-to-kick ballots (public activities only) ────────────────────────────
-- One ballot per (event, voter, target). Majority (> 50% of approved members)
-- removes the target from the outing.
create table if not exists public.webapp_kick_votes (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  voter_id   uuid not null,   -- webapp_users.id casting the vote
  target_id  uuid not null,   -- webapp_users.id being voted out
  created_at timestamptz not null default now(),
  unique (event_id, voter_id, target_id)
);
create index if not exists webapp_kick_votes_event_idx
  on public.webapp_kick_votes(event_id);
create index if not exists webapp_kick_votes_target_idx
  on public.webapp_kick_votes(event_id, target_id);
alter table public.webapp_kick_votes enable row level security;

-- ── Removed members can't rejoin ─────────────────────────────────────────────
-- We reuse webapp_event_members.status with a new value 'kicked'. The column is
-- free-text (no CHECK), so no schema change is needed. For reference the values
-- are now: 'approved' | 'pending' | 'rejected' | 'kicked'.
-- If you previously added a CHECK constraint on status, widen it:
--   alter table public.webapp_event_members drop constraint if exists webapp_event_members_status_check;
--   alter table public.webapp_event_members
--     add constraint webapp_event_members_status_check
--     check (status in ('approved','pending','rejected','kicked'));
