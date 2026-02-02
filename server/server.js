import express from "express";
import dotenv from "dotenv";
import topicsRouter from "./src/routes/topics.ts";
import communitiesRouter from "./src/routes/communities.ts";
import eventsRouter from "./src/routes/events.ts";
import notificationsRouter from "./src/routes/notifications.ts";
import profileRouter from "./src/routes/profile.ts";
import friendsRouter from "./src/routes/friends.ts";
import authRouter from "./src/routes/auth.ts";
import testimonialsRouter from "./src/routes/testimonials.ts";
import eventTemplatesRouter from "./src/routes/event-templates.ts";
import subccommunitiesRouter from "./src/routes/subcommunities.ts";
import interestsRouter from "./src/routes/interests.ts";
import invitationsRouter from "./src/routes/invitations.ts";
import eventTestimonialsRouter from "./src/routes/event-testimonials.ts";
// import cors from "cors";

dotenv.config();
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 4000;

// app.use(
//   cors({
//     origin: ["http://localhost:8081", "http://46.62.157.49"], // allowed origins
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.use(cors());

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
app.use("/api/profile", profileRouter);
app.use("/api/users", profileRouter); // users/:id handled in profile router
app.use("/api/friends", friendsRouter);
app.use("/api/auth", authRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/event-templates", eventTemplatesRouter);
app.use("/api/subcommunities", subccommunitiesRouter);
app.use("/api/interests", interestsRouter);
app.use("/api/invitations", invitationsRouter);
app.use("/api/event-testimonials", eventTestimonialsRouter);

app.get("/", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
});
