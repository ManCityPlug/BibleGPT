import "dotenv/config";
import express from "express";
import cors from "cors";

// Routes
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import bibleRouter from "./routes/bible";
import notesRouter from "./routes/notes";
import aiRouter from "./routes/ai";
import plansRouter from "./routes/plans";
import devotionalsRouter from "./routes/devotionals";
import journalRouter from "./routes/journal";
import groupsRouter from "./routes/groups";
import groupMessagesRouter from "./routes/groupMessages";
import friendsRouter from "./routes/friends";
import messagesRouter from "./routes/messages";
import subscriptionRouter from "./routes/subscription";
import referralsRouter from "./routes/referrals";
import accountRouter from "./routes/account";
import webhooksRouter from "./routes/webhooks";
import prayerRouter from "./routes/prayerRequests";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── Stripe webhook must receive raw body ──────────────────────────────────────
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

// ── Standard middleware ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000").split(",");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(healthRouter);
app.use(authRouter);
app.use(bibleRouter);
app.use(notesRouter);
app.use(aiRouter);
app.use(plansRouter);
app.use(devotionalsRouter);
app.use(journalRouter);
app.use(groupsRouter);
app.use(groupMessagesRouter);
app.use(friendsRouter);
app.use(messagesRouter);
app.use(subscriptionRouter);
app.use(referralsRouter);
app.use(accountRouter);
app.use(webhooksRouter);
app.use(prayerRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`BibleGPT API running on port ${PORT}`);
});

export default app;
