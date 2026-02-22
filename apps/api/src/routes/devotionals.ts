import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/devotionals/today
router.get("/api/devotionals/today", requireAuth, async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const devotional = await prisma.devotional.findFirst({
    where: { date: today },
  });

  if (!devotional) {
    res.status(404).json({ error: "No devotional for today" });
    return;
  }
  res.json({ devotional });
});

// GET /api/devotionals — list recent devotionals
router.get("/api/devotionals", requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit as string ?? "7", 10);
  const devotionals = await prisma.devotional.findMany({
    orderBy: { date: "desc" },
    take: Math.min(limit, 30),
  });
  res.json({ devotionals });
});

// GET /api/devotionals/:id
router.get("/api/devotionals/:id", requireAuth, async (req, res) => {
  const devotional = await prisma.devotional.findUnique({
    where: { id: req.params.id },
  });
  if (!devotional) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ devotional });
});

export default router;
