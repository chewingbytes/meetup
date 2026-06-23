# Soonest Webapp

The beta web version of Soonest — a frictionless, map-first entry point for the
location-based social activity platform. Mirrors the Expo app experience for easy
showcasing and promotion, on top of the same backend.

```bash
npm install
cp .env.local.example .env.local   # fill in if not using defaults
npm run dev                         # → http://localhost:3000
```

**First time?** Run the DB migration + enable OAuth — see [SETUP.md](./SETUP.md).

### What's inside
- 🗺️ Full-screen clustered activity map (Leaflet + supercluster, Clay-styled pins)
- ⚡ Frictionless joining — no account, identity saved to `localStorage`
- 💬 Realtime activity chat (Supabase realtime, shared with the native app)
- 🟢 "People online now" presence
- 📍 Joined activities highlighted on reload
- 🛡️ OAuth-gated activity creation + anti-scam moderation (word filter + OpenAI)

Built with Next.js (App Router), React, Tailwind CSS, and Lucide icons.
