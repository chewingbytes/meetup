-- Webapp admin / banhammer: ban state on webapp_users.
-- Run once in the Supabase SQL editor.
--
-- A banned webapp user can't join or create activities (enforced server-side),
-- and is removed from every activity they're currently in at ban time. Unbanning
-- only lifts the flag — it does NOT auto-rejoin them to past activities.

alter table public.webapp_users
  add column if not exists banned     boolean not null default false,
  add column if not exists banned_at  timestamptz,
  add column if not exists ban_reason text;

create index if not exists webapp_users_banned_idx on public.webapp_users(banned);
