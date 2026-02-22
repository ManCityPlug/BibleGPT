import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/plans — list all reading plans
router.get("/api/plans", requireAuth, async (req, res) => {
  const plans = await prisma.readingPlan.findMany({
    where: { isActive: true },
    orderBy: { durationDays: "asc" },
  });

  // Attach user progress if any
  const progress = await prisma.userReadingProgress.findMany({
    where: { userId: req.user!.id },
    select: { planId: true, currentDay: true, completedAt: true, lastReadAt: true },
  });
  const progressMap = Object.fromEntries(progress.map((p) => [p.planId, p]));

  res.json({ plans: plans.map((p) => ({ ...p, progress: progressMap[p.id] ?? null })) });
});

// POST /api/plans/:id/start
router.post("/api/plans/:id/start", requireAuth, async (req, res) => {
  const planId = req.params.id as string;
  const plan = await prisma.readingPlan.findUnique({ where: { id: planId } });
  if (!plan) { res.status(404).json({ error: "Plan not found" }); return; }

  const existing = await prisma.userReadingProgress.findUnique({
    where: { userId_planId: { userId: req.user!.id, planId: plan.id } },
  });

  if (existing) {
    res.json({ progress: existing });
    return;
  }

  const progress = await prisma.userReadingProgress.create({
    data: { userId: req.user!.id, planId: plan.id, currentDay: 1 },
  });
  res.status(201).json({ progress });
});

// POST /api/plans/:id/complete-day
router.post("/api/plans/:id/complete-day", requireAuth, async (req, res) => {
  const planId = req.params.id as string;
  const [progress, plan] = await Promise.all([
    prisma.userReadingProgress.findUnique({
      where: { userId_planId: { userId: req.user!.id, planId } },
    }),
    prisma.readingPlan.findUnique({ where: { id: planId } }),
  ]);
  if (!progress || !plan) { res.status(404).json({ error: "Not enrolled in this plan" }); return; }
  if (progress.completedAt) { res.json({ progress }); return; }

  const nextDay = progress.currentDay + 1;
  const isComplete = nextDay > plan.durationDays;

  const updated = await prisma.userReadingProgress.update({
    where: { id: progress.id },
    data: {
      currentDay: isComplete ? plan.durationDays : nextDay,
      completedAt: isComplete ? new Date() : null,
      lastReadAt: new Date(),
    },
  });

  // Update streak
  await updateStreak(req.user!.id);

  res.json({ progress: updated });
});

async function updateStreak(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  if (!streak) return;

  const now = new Date();
  const lastActivity = streak.lastActivityAt;
  const dayMs = 86_400_000;

  let newCurrent = streak.currentStreak;
  if (!lastActivity) {
    newCurrent = 1;
  } else {
    const diff = now.getTime() - lastActivity.getTime();
    if (diff < dayMs) {
      // Same day — no change
    } else if (diff < 2 * dayMs) {
      newCurrent += 1;
    } else {
      newCurrent = 1;
    }
  }

  await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newCurrent,
      longestStreak: Math.max(newCurrent, streak.longestStreak),
      lastActivityAt: now,
    },
  });
}

export { updateStreak };
export default router;
