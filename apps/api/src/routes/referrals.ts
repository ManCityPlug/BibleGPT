import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/referrals — get own referral code + stats
router.get("/api/referrals", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { referralCode: true },
  });

  const referrals = await prisma.referral.findMany({
    where: { referrerId: req.user!.id },
    include: { referee: { select: { name: true, createdAt: true } } },
  });

  const rewarded = referrals.filter((r) => r.rewardGiven).length;

  res.json({
    referralCode: user?.referralCode,
    totalReferrals: referrals.length,
    rewardedReferrals: rewarded,
    referrals,
  });
});

// POST /api/referrals/validate — check if a code is valid
router.post("/api/referrals/validate", async (req, res) => {
  const { code } = req.body as { code: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }

  const user = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true, name: true },
  });

  res.json({ valid: !!user, referrer: user ?? null });
});

// POST /api/referrals/apply — apply a referral code to the current user
router.post("/api/referrals/apply", requireAuth, async (req, res) => {
  const { code } = req.body as { code: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }

  // Check user doesn't already have a referral
  const existing = await prisma.referral.findUnique({
    where: { refereeId: req.user!.id },
  });
  if (existing) { res.status(400).json({ error: "Referral already applied" }); return; }

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
  });
  if (!referrer || referrer.id === req.user!.id) {
    res.status(400).json({ error: "Invalid referral code" }); return;
  }

  const referral = await prisma.referral.create({
    data: { referrerId: referrer.id, refereeId: req.user!.id },
  });

  res.status(201).json({ referral });
});

export default router;
