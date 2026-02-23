import { Router } from "express";
import { prisma } from "../lib/prisma";
import { getUserFromRequest } from "../lib/supabase";
import crypto from "crypto";

const router = Router();

/**
 * POST /api/auth/register
 * Called after Supabase sign-up to create the User row in our DB.
 */
router.post("/api/auth/register", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const { referralCode: incomingCode, name } = req.body as { referralCode?: string; name?: string };

    const existing = await prisma.user.findUnique({ where: { id: user.id } });
    if (existing) {
      res.json({ user: existing });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: name?.trim() || null,
        referralCode,
        streak: { create: {} },
      },
    });

    // Apply referral if provided
    if (incomingCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: incomingCode },
      });
      if (referrer && referrer.id !== user.id) {
        await prisma.referral.create({
          data: { referrerId: referrer.id, refereeId: user.id },
        });
      }
    }

    // Create 7-day trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    await prisma.subscription.create({
      data: { userId: user.id, status: "trialing", trialEndsAt },
    });

    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

export default router;
