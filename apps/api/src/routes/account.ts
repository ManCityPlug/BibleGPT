import { Router } from "express";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/account
router.get("/api/account", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      streak: true,
      subscription: { select: { status: true, trialEndsAt: true, currentPeriodEnd: true } },
    },
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ user });
});

// PATCH /api/account
router.patch("/api/account", requireAuth, async (req, res) => {
  const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string };

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, avatarUrl },
  });
  res.json({ user });
});

// DELETE /api/account
router.delete("/api/account", requireAuth, async (req, res) => {
  // Delete from Supabase auth first
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user!.id);
  if (error) {
    res.status(500).json({ error: "Failed to delete auth user" }); return;
  }

  // Cascade delete via Prisma (all relations cascade)
  await prisma.user.delete({ where: { id: req.user!.id } });
  res.json({ success: true });
});

export default router;
