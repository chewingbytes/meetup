# Soonest — Security Review & Production Hardening

Pre-launch audit of the **webapp** (`webapp/`), the **API** (`server/`), and the
**marketing site** (`website/`). The Expo app was intentionally **not** modified,
but it is affected by the database (RLS) decisions below — read Stage 3 carefully.

Severity legend: 🔴 critical · 🟠 high · 🟡 medium · 🟢 done / no action.

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | RLS disabled on every table + anon key is public → anyone can read/write the DB directly | 🔴 | **Action required (you)** |
| 2 | No backend auth — API trusted client-supplied user IDs (impersonation / takeover) | 🔴 | ✅ fixed (JWT verification) |
| 3 | Debug endpoints were open when `ADMIN_TOKEN` unset | 🟠 | ✅ fixed (fail-closed) |
| 4 | No rate limiting anywhere | 🟠 | ✅ added |
| 5 | Unbounded chat message input | 🟠 | ✅ capped |
| 6 | Plaintext password written to server logs on signup | 🟠 | ✅ removed |
| 7 | Dependency CVEs (multer, ws, qs, path-to-regexp — all DoS) | 🟡 | `npm audit fix` (you) |
| 8 | No security headers | 🟡 | ✅ helmet added |
| 9 | CORS allowlist includes dev/LAN + plaintext origins | 🟡 | prune for prod (you) |
| 10 | Error responses echo internal messages | 🟡 | noted (see §6) |

---

## 1. 🔴 RLS is disabled — the single most important issue

### Why this is critical
The **anon key is public by design** — it ships inside the webapp JS bundle, the
marketing site (`website/main/src/pages/index.astro`), and `webapp/src/lib/supabase.ts`.
Anyone can read it from their browser. The anon key is **not a secret** and you
**cannot fix this by hiding or rotating it** — a rotated key is just public again.

The *only* thing standing between that public key and your database is **Row Level
Security**. With RLS disabled, anyone who opens dev-tools can talk straight to
PostgREST and bypass your Express backend entirely:

```bash
# Dump every waitlist email:
curl 'https://supabase.hangoutstudios.com/rest/v1/soonest_waitlist?select=email' \
  -H "apikey: <public-anon-key>"

# Dump every user profile (PII):
curl 'https://supabase.hangoutstudios.com/rest/v1/profiles?select=*' -H "apikey: ..."

# Read every private chat message:
curl 'https://supabase.hangoutstudios.com/rest/v1/messages?select=*' -H "apikey: ..."

# Tamper / delete (anon can write too, with RLS off):
curl -X DELETE 'https://supabase.hangoutstudios.com/rest/v1/events?id=eq.<id>' -H "apikey: ..."
```

### The key fact that makes this safe to fix
**The service-role key bypasses RLS completely.** Your Express backend uses the
service-role key (`server/db/supabaseClient.js`), so **enabling RLS does not break
the backend at all.** Enabling RLS only blocks **direct** anon/authenticated access
that isn't covered by a policy. So the plan is: turn RLS on everywhere, then add
back *only* the direct-access policies the clients genuinely need.

### Who accesses the DB directly (not through the backend)
- **Webapp browser** — reads `messages` (chat history + realtime) and uses Realtime
  presence (no table). Everything else (events, users, joins, avatars, reports…)
  already goes through the backend. See `webapp/src/lib/useChat.ts`.
- **Marketing site** — inserts into `soonest_waitlist` with the anon key
  (`Prefer: return=minimal`, so it needs INSERT but not SELECT).
- **Expo app** — reads/writes many tables directly with anon/authenticated. ⚠️ This
  is the unknown; enabling RLS on shared tables (`profiles`, `events`, `messages`,
  `user_events`, `channels`, `communities`, …) **will break the Expo app** unless
  matching policies exist. Do Stage 3 in **staging** first.

---

### Stage 1 — Lock the webapp-only + sensitive tables (do this now, zero Expo impact)

These tables are touched only by the backend (service role) — except the waitlist,
which the site inserts into directly. Enabling RLS with no read policies instantly
stops the worst data exfiltration (waitlist emails, webapp data) with **no app changes**.

```sql
-- Backend-only tables: RLS on, no client policies → anon/authenticated denied,
-- service-role backend keeps working.
alter table public.webapp_users         enable row level security;
alter table public.webapp_event_members enable row level security;
alter table public.webapp_kick_votes    enable row level security;
alter table public.reports              enable row level security;

-- Waitlist: the marketing site inserts with the ANON key, so allow INSERT only —
-- and deliberately NO select/update/delete → nobody can dump the email list.
alter table public.soonest_waitlist enable row level security;
create policy "waitlist anon insert"
  on public.soonest_waitlist for insert to anon
  with check (true);
```

Verify after running: the site's waitlist form still works, and
`curl '.../rest/v1/soonest_waitlist?select=email' -H "apikey: <anon>"` now returns
`[]` / permission denied instead of the list.

### Stage 2 — `messages` (the one table the webapp browser reads directly)

```sql
alter table public.messages enable row level security;

-- The webapp reads chat history and subscribes to new messages with the anon/
-- authenticated key, so allow SELECT. Sends still go only through the backend
-- (service role) → intentionally NO insert/update/delete policy for clients.
create policy "messages selectable by clients"
  on public.messages for select to anon, authenticated
  using (true);
```

Notes:
- Realtime respects RLS — this SELECT policy is what lets the live subscription in
  `useChat.ts` keep receiving new messages. Keep `messages` in the
  `supabase_realtime` publication (it already is).
- ⚠️ This still lets anyone with the anon key read *all* messages. To tighten later:
  move the history fetch to the existing backend endpoint `GET /api/webapp/messages`
  and scope this policy to channel members, e.g.

  ```sql
  -- Tighter (after wiring membership): only members of the channel's event can read.
  create policy "messages for members" on public.messages for select to authenticated
  using (exists (
    select 1 from public.webapp_event_members m
    join public.channels c on c.event_id = m.event_id
    where c.id = messages.channel_id
      and m.webapp_user_id = auth.uid()
      and m.status = 'approved'
  ));
  ```

### Stage 3 — Shared tables used by the Expo app (do in STAGING first)

`profiles`, `events`, `channels`, `user_events`, `communities`, `notifications`,
`friends`, `topics`, `user_interests`, `event_*`, `push_tokens`, `contact_messages`,
`subcommunities`, `event_invitations`, `no_show_records`, `testimonials`, …

**Process (don't guess in prod):**
1. Clone to a staging Supabase project (or a maintenance window).
2. `alter table public.<t> enable row level security;` on each.
3. Run the Expo app **and** webapp against staging; exercise every screen.
4. Watch Postgres logs / API responses for `permission denied` / empty results.
5. Add the minimal policy that unblocks each failure. Common templates:

```sql
-- Public, read-only reference data (anyone may read, only backend writes):
create policy "public read" on public.events for select to anon, authenticated using (true);

-- Owner-scoped rows (each user manages only their own):
create policy "own rows read"   on public.user_events for select to authenticated using (user_id = auth.uid());
create policy "own rows insert" on public.user_events for insert to authenticated with check (user_id = auth.uid());
create policy "own rows update" on public.user_events for update to authenticated using (user_id = auth.uid());
create policy "own rows delete" on public.user_events for delete to authenticated using (user_id = auth.uid());

-- Profiles: world-readable, self-writable:
create policy "profiles read"        on public.profiles for select to anon, authenticated using (true);
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid());
```

Rule of thumb: **SELECT** is usually fine to keep broad; **INSERT/UPDATE/DELETE**
should always be scoped to `auth.uid()` so a logged-in user can't edit other people's
rows. Anything only the backend should do → **no policy** (service role still works).

### Storage
The avatar bucket (`soonest`) is public-read and written by the backend (service
role). Confirm Storage policies allow public **read** of `avatars/*` and that
**writes** are not open to anon. Uploads already go through the backend.

---

## 2. 🔴 No backend authentication (impersonation & takeover)

### The problem
The API uses the **service-role key** and trusts identity fields from the request
**body/query with no verification**. There is no `Authorization` check anywhere in
`server/server.js`. Examples in `server/src/routes/webapp.ts`:

- `POST /api/webapp/messages` takes `user_id` + `username` from the body → **anyone
  can post as anyone** (and to any `channel_id`, with no membership check).
- `GET /api/webapp/messages?channel_id=…` → **read any channel's messages**.
- `DELETE /api/webapp/events/:id?host_id=…` and `POST .../remove`, `.../requests/respond`
  check `organizer_id === host_id` — but `organizer_id` is **returned by
  `GET /api/webapp/events/:id`**, so an attacker reads it and passes it as `host_id`
  → **delete/modify any event, kick anyone**.
- `POST /api/webapp/users` / `createEvent` accept arbitrary ids → create/edit as others.

The webapp already has a real Supabase (Google) session with a JWT — the backend
just never checks it.

### ✅ Fixed — what was implemented
- New middleware `server/src/middleware/auth.ts` (`requireUser`) verifies the
  Supabase access token and sets `req.userId` / `req.userEmail`.
- The webapp client (`webapp/src/lib/api.ts`) now attaches
  `Authorization: Bearer <token>` to every request.
- Every mutating/"my data" webapp route now derives identity from the **token**, not
  the body/query: `users`, `my-activities`, `rail-unread`, `events/join`,
  `events/leave`, `events/joined`, `events/:id/requests(+respond)`, `report`,
  `kick-vote`, `remove`, `DELETE events/:id`, `messages` (GET+POST), `waitlist-status`.
- Chat is membership-gated (`canAccessChannel`): you can only read/post in activities
  you organize or have joined. Message sender id **and** display name are derived
  server-side, so neither can be spoofed.
- Event creation moved off the spoofable shared `POST /api/events` to a new
  authenticated **`POST /api/webapp/events`** (organizer = the verified caller). The
  native route is untouched, so the **Expo app is unaffected**.
- Public reads stay open (map browsing, event detail, channel resolve, avatars).

> Deploy note: this requires redeploying **both** the API and the webapp together —
> an updated webapp sending tokens against the old API is fine, but the new API
> returns 401 to any old client that doesn't send one.

<details><summary>Original remediation notes (for reference)</summary>

1. **Client** — attach the token to every privileged call. In `webapp/src/lib/api.ts`
   `request()`:
   ```ts
   const { data } = await supabase.auth.getSession();
   const token = data.session?.access_token;
   if (token) opts.headers = { ...opts.headers, Authorization: `Bearer ${token}` };
   ```
2. **Server** — add middleware that verifies the JWT and derives the caller id:
   ```ts
   export async function requireUser(req, res, next) {
     const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
     if (!token) return res.status(401).json({ message: "Sign in required" });
     const { data, error } = await supabase.auth.getUser(token); // verifies signature
     if (error || !data?.user) return res.status(401).json({ message: "Invalid session" });
     req.userId = data.user.id;
     next();
   }
   ```
3. Apply `requireUser` to all mutating webapp routes and **use `req.userId`** instead
   of the body's `host_id` / `webapp_user_id` / `user_id` / `organizerId`. Keep public
   GETs (map/event browsing) open. Add a channel-membership check to `POST/GET messages`.
4. The shared native route `POST /api/events` (used by both Expo and the webapp's
   `createEvent`) needs the same treatment — coordinate so the Expo app sends its
   token too, or give the webapp its own `POST /api/webapp/events`.

</details>

---

## 3–10. Smaller findings

- **3 🟠 Debug endpoints** — `debugAllowed()` returned `true` when `ADMIN_TOKEN` was
  unset, exposing `/api/webapp/debug/storage` (leaks config) and
  `/debug/rehost-avatars` (bulk-processing trigger). ✅ Now **fails closed**. **You
  must set `ADMIN_TOKEN` in prod** or these routes stay disabled.
- **4 🟠 Rate limiting** — ✅ added in `server.js` (`express-rate-limit`): a global
  300/min/IP backstop, 30/15min on `/api/auth` (brute force), 20/min on chat sends,
  10/hour on `/api/waitlist`. ⚠️ The marketing site writes the waitlist **directly to
  PostgREST**, bypassing this — protect it with the Stage 1 INSERT policy and/or move
  it behind the backend. Consider also enabling GoTrue's built-in email/OTP limits.
- **5 🟠 Message input** — ✅ text capped at 2000 chars, username at 60, in
  `POST /api/webapp/messages`.
- **6 🟠 Password logging** — ✅ removed the `console.log(req.body)` in
  `auth.ts /signup` that wrote plaintext passwords to logs.
- **7 🟡 Dependency CVEs** — `npm audit` reports DoS issues in `multer`, `ws`, `qs`,
  `path-to-regexp`. Run `npm audit fix` (non-breaking) in a branch and smoke-test the
  app + uploads before deploying.
- **8 🟡 Security headers** — ✅ `helmet()` added (HSTS, no-sniff, frameguard…).
- **9 🟡 CORS** — `server.js` allows several `http://` LAN/dev origins. Prune to just
  the prod origins (`https://soonest.app`, `https://www.soonest.app`,
  `https://web.soonest.app`) for production; `credentials:true` isn't needed since auth
  is token-based, not cookie-based.
- **10 🟡 Error disclosure** — routes return `err.message` to clients, which can leak
  Postgres/internal detail. Low risk, but prefer generic client messages + full detail
  in server logs. (Left as-is to avoid changing error codes the webapp relies on, e.g.
  `ig_taken`, `kicked`.)

### Verified good 🟢
- `.env` is git-ignored and **not** committed; service-role key lives only in server env.
- The anon key is the only Supabase key shipped to clients (correct — once RLS is on).
- All DB access uses the supabase-js query builder (parameterized) — no SQL injection
  found; the waitlist `ilike` pattern is wildcard-escaped.

---

## Production checklist

- [ ] **Enable RLS** — run Stage 1 + Stage 2 now; schedule Stage 3 in staging. *(§1)*
- [x] **Backend JWT auth** — ✅ implemented (§2). Redeploy API + webapp **together**.
- [ ] Set **`ADMIN_TOKEN`** in prod env (debug routes are now fail-closed).
- [ ] Set **`OPENAI_API_KEY`** for moderation (and keep an eye on its cost/limits).
- [ ] `npm audit fix` in `server/` + retest. *(§7)*
- [ ] Prune CORS to prod origins only. *(§9)*
- [ ] Redeploy the API (rate limiting, helmet, debug fix, message caps are server-side).
- [ ] Confirm `app.set("trust proxy", 1)` matches your real proxy depth (Cloudflare/nginx).
- [ ] Don't rely on hiding the anon key — RLS is the control.
