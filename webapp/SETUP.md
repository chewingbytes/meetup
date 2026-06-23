# Soonest Webapp — Setup

A lightweight, mobile-first Next.js web app that mirrors the Expo map experience:
a full-screen clustered activity map, low-friction joining, realtime chat,
"people online now" presence, host-approval gating, and an organizer dashboard.

**Identity & anti-spam:** every participating identity is anchored to a verified
**Google account** (Supabase Auth). A user's `id` *is* their Google auth user id,
and their sole display identity is their **Instagram handle**. Clearing
localStorage/cookies can't mint a fresh identity — they'd need another Google
account — which stops join/create spam. The IG handle is collected first, then
Google sign-in confirms it.

It reuses the **existing backend** (Express API + self-hosted Supabase). The Expo
app is untouched.

---

## 1. Database — run this SQL once (Supabase SQL editor)

Webapp users get their **own tables**, separate from the native app's
`profiles` / `user_events`, so there's no FK conflict.

```sql
-- ── Webapp identities — id IS the Supabase auth (Google) user id ────────────
create table if not exists public.webapp_users (
  id         uuid primary key,            -- = auth.users.id (Google sign-in)
  instagram  text not null,               -- the sole display identity (no names)
  avatar_url text,                        -- pulled from the Google account
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Event membership with an approval status ────────────────────────────────
create table if not exists public.webapp_event_members (
  id             uuid primary key default gen_random_uuid(),
  webapp_user_id uuid not null references public.webapp_users(id) on delete cascade,
  event_id       uuid not null references public.events(id) on delete cascade,
  status         text not null default 'approved',  -- 'approved' | 'pending' | 'rejected'
  joined_at      timestamptz not null default now(),
  unique (webapp_user_id, event_id)
);

create index if not exists webapp_event_members_event_idx
  on public.webapp_event_members(event_id);
create index if not exists webapp_event_members_user_idx
  on public.webapp_event_members(webapp_user_id);

alter table public.webapp_users         enable row level security;
alter table public.webapp_event_members enable row level security;
```

**Already created the older tables?** Migrate them instead:

```sql
alter table public.webapp_users drop column if exists display_name;
alter table public.webapp_users drop column if exists tiktok;
alter table public.webapp_users alter column instagram set not null;
alter table public.webapp_users add column if not exists avatar_url text;
alter table public.webapp_event_members
  add column if not exists status text not null default 'approved';
```

> **If `events.id` is `text` (not `uuid`)**, change `event_id uuid ...` to
> `event_id text ... references public.events(id)`.
>
> The "require host approval" toggle maps to the existing `events.require_approval`
> column — no events schema change needed.

### Chat — two things to know

**1. RLS (reads/writes proxied via backend).** The `messages` table's RLS only
grants the **authenticated** role (the Expo app signs in, so its client carries a
real JWT). Anonymous webapp visitors use the bare `anon` role, which RLS rejects
(a direct insert returns `401`). So the webapp **proxies chat through the backend**
(`GET`/`POST /api/webapp/messages`), which uses the service-role key and bypasses
RLS — no policy change required. Live updates use optimistic send + a light poll,
with the Supabase realtime subscription kept as a free accelerator when anon
`SELECT` is allowed.

**2. Drop the `messages.user_id` foreign key (required).** That column has an FK
(`messages_user_id_fkey`) to `profiles.id`. Anonymous webapp users live in
`webapp_users`, not `profiles`, so their messages would violate the constraint.
Since `messages` already stores a denormalized `username`, dropping the FK is safe
— the native app still renders webapp senders fine (avatar falls back to a colored
initial):

```sql
alter table public.messages drop constraint messages_user_id_fkey;
```

---

## 2. Google OAuth (required for all participation)

Both **joining and creating** require a Google sign-in — this is the anti-spam
anchor (identity = Google account; clearing storage can't mint a new one). Enable
**Google** in **Supabase → Authentication → Providers**, then add the webapp
origin(s) to **URL Configuration → Redirect URLs**:

- `http://localhost:3000`
- your production URL (e.g. `https://web.soonest.app`)

The flow is delayed-friction: users browse the map and fill the whole create/join
form first; the Instagram handle + Google sign-in is the *final* step, and the
in-progress action is resumed automatically after the OAuth redirect.

### Self-hosted Supabase (Docker) — configure GoTrue, not Studio

There's no provider dashboard in self-hosted Supabase; OAuth is set via the
`auth` (GoTrue) service env vars.

**1. Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID*
(Web application). Set the **Authorized redirect URI** to your Supabase API
callback (exact, https, no trailing slash):

```
https://supabase.hangoutstudios.com/auth/v1/callback
```

Configure the OAuth consent screen first if prompted. Copy the **Client ID** and
**Client secret**.

**2. In your Supabase `docker/.env`:**

```env
API_EXTERNAL_URL=https://supabase.hangoutstudios.com   # must be the public API URL
SITE_URL=https://web.soonest.app                       # default post-login redirect
ADDITIONAL_REDIRECT_URLS=http://localhost:3000,https://web.soonest.app
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_SECRET=xxxx
```

**3. In `docker-compose.yml`, add to the `auth` service `environment:` block:**

```yaml
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET}
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/auth/v1/callback
```

(The `auth` service should already map `GOTRUE_SITE_URL: ${SITE_URL}` and
`GOTRUE_URI_ALLOW_LIST: ${ADDITIONAL_REDIRECT_URLS}` — confirm they're present.)

**4. Recreate the services:**

```bash
docker compose up -d auth kong   # or: docker compose down && docker compose up -d
docker compose logs -f auth      # confirm no GoTrue errors on boot
```

**Gotchas**
- `redirect_uri_mismatch` → `API_EXTERNAL_URL` is wrong or the Google redirect URI
  doesn't *exactly* match `…/auth/v1/callback` (https, no trailing slash).
- "provider not enabled" → `GOTRUE_EXTERNAL_GOOGLE_ENABLED` not `true`, or the
  `auth` container wasn't recreated.
- "requested path is invalid" / wrong landing → the webapp origin (it signs in
  with `redirectTo = window.location.origin`) isn't in `ADDITIONAL_REDIRECT_URLS`.
  Globs work too, e.g. `https://web.soonest.app/**`.

---

## 3. Environment

```bash
cd webapp
cp .env.local.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE` | Express API base (default prod server) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public — realtime chat + presence) |
| `OPENAI_API_KEY` | *Server-only.* Optional — enables the OpenAI Moderation pass on activity creation. Omit to use the local word filter only. |

---

## 4. Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the build
```

---

## 5. Deploy the backend changes

The server gained `server/src/routes/webapp.ts` (registered at `/api/webapp` in
`server/server.js`). Redeploy the Express server so the webapp endpoints are live.
CORS already allows `http://localhost:3000` and `https://web.soonest.app` — add
your real production origin in `server/server.js` if different.

---

## Architecture notes

- **Map** — Leaflet + CARTO light basemap (free, no API key, in-app-browser
  friendly) with the same `supercluster` settings as the Expo app
  (`radius: 70, maxZoom: 16, minPoints: 2`) and custom Clay-styled HTML pins.
- **Identity model** — one anonymous identity per device (localStorage + UUID v4)
  drives joining + chat. OAuth is used *only* to gate creation; a host joins their
  own activity like anyone else to chat.
- **Presence** — Supabase Realtime Presence (built in, no custom websocket
  server) on a shared `presence:webapp-global` channel powers "people online now".
- **Joined pins** — persisted server-side; on load we fetch the user's joined
  event ids and render those pins with a green ring.
- **Moderation** — synchronous high-risk word filter (`mentor`, `passive income`,
  `financial freedom`, `wealth`, `crypto`, …) + optional OpenAI Moderation via the
  server route `/api/moderate` (key stays server-side; fails open).
