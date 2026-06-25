import express from "express";
import dotenv from "dotenv";
import topicsRouter from "./src/routes/topics.ts";
import communitiesRouter from "./src/routes/communities.ts";
import eventsRouter from "./src/routes/events.ts";
import notificationsRouter from "./src/routes/notifications.ts";
import contactRouter from "./src/routes/contact.ts";
import pushTokensRouter from "./src/routes/push-tokens.ts";
import profileRouter from "./src/routes/profile.ts";
import friendsRouter from "./src/routes/friends.ts";
import authRouter from "./src/routes/auth.ts";
import testimonialsRouter from "./src/routes/testimonials.ts";
import eventTemplatesRouter from "./src/routes/event-templates.ts";
import subccommunitiesRouter from "./src/routes/subcommunities.ts";
import interestsRouter from "./src/routes/interests.ts";
import invitationsRouter from "./src/routes/invitations.ts";
import eventTestimonialsRouter from "./src/routes/event-testimonials.ts";
import waitlistRouter from "./src/routes/waitlist.ts"
import webappRouter from "./src/routes/webapp.ts";

import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();

// We sit behind a TLS-terminating reverse proxy (the API is served over HTTPS),
// so the real client IP arrives in X-Forwarded-For. Trust exactly one hop so the
// rate limiters key on the actual visitor, not the proxy. If you add Cloudflare
// or a second proxy, bump this to match the number of hops.
app.set("trust proxy", 1);

// Security headers (HSTS, no-sniff, frameguard, etc.). This is a cross-origin JSON
// API: CSP is irrelevant (no HTML), and resources are fetched cross-origin, so set
// CORP to cross-origin to avoid any edge-case blocking.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Cap request bodies — nothing we accept is large, and an unbounded body is a
// cheap memory-exhaustion vector.
app.use(express.json({ limit: "100kb" }));

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: ["http://localhost:8081", "http://172.20.10.2", "http://46.62.157.49", "http://localhost:4321", "https://www.hangoutstudios.com", "http://192.168.0.107", "https://soonest.app", "https://www.soonest.app", "http://localhost:3000", "https://web.soonest.app"], // allowed origins (incl. webapp dev :3000 + prod)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// app.use(cors());

// ── Rate limiting ────────────────────────────────────────────────────────────
// Per-IP throttles. CORS preflights (OPTIONS) are never counted so they can't
// exhaust a client's budget. Tune the numbers to real traffic once live.
const ipLimit = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { message },
  });

// Broad backstop across the whole API.
const globalLimiter = ipLimit(60_000, 300, "Too many requests — please slow down.");
// Login / signup: brute-force protection on credentials.
const authLimiter = ipLimit(15 * 60_000, 30, "Too many attempts. Try again in a few minutes.");
// Posting chat messages: anti-spam (GET history is exempt via the method skip below).
const messageLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.method !== "POST",
  message: { message: "You're sending messages too fast." },
});
// Waitlist signups through the backend (note: the marketing site writes to the
// waitlist directly via PostgREST and bypasses this — see SECURITY.md).
const waitlistLimiter = ipLimit(60 * 60_000, 10, "Too many signups from this network.");

app.use(globalLimiter);

app.use((req, res, next) => {
  console.log(
    `➡️  ${req.method} ${req.originalUrl} @ ${new Date().toISOString()}`
  );
  next(); // important: continue to the next middleware / route
});

app.use("/api/topics", topicsRouter);
app.use("/api/communities", communitiesRouter);
app.use("/api/events", eventsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/push-tokens", pushTokensRouter);
app.use("/api/profile", profileRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/event-templates", eventTemplatesRouter);
app.use("/api/subcommunities", subccommunitiesRouter);
app.use("/api/interests", interestsRouter);
app.use("/api/invitations", invitationsRouter);
app.use("/api/event-testimonials", eventTestimonialsRouter);
app.use("/api/waitlist", waitlistLimiter, waitlistRouter);
app.use("/api/webapp/messages", messageLimiter);
app.use("/api/webapp", webappRouter);

app.get("/", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
});
