import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { updateStreak } from "./plans";

const router = Router();

// GET /api/journal
router.get("/api/journal", requireAuth, async (req, res) => {
  const { isPrayer } = req.query;
  const where: Record<string, unknown> = { userId: req.user!.id };
  if (isPrayer !== undefined) where.isPrayer = isPrayer === "true";

  const entries = await prisma.journal.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json({ entries });
});

// POST /api/journal
router.post("/api/journal", requireAuth, async (req, res) => {
  const { title, content, isPrayer } = req.body as {
    title?: string;
    content: string;
    isPrayer?: boolean;
  };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const entry = await prisma.journal.create({
    data: { userId: req.user!.id, title, content, isPrayer: isPrayer ?? false },
  });

  await updateStreak(req.user!.id);
  res.status(201).json({ entry });
});

// PATCH /api/journal/:id
router.patch("/api/journal/:id", requireAuth, async (req, res) => {
  const entry = await prisma.journal.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.journal.update({
    where: { id: entry.id },
    data: req.body,
  });
  res.json({ entry: updated });
});

// DELETE /api/journal/:id
router.delete("/api/journal/:id", requireAuth, async (req, res) => {
  const entry = await prisma.journal.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }
  await prisma.journal.delete({ where: { id: entry.id } });
  res.json({ success: true });
});

// POST /api/journal/:id/mark-answered
router.post("/api/journal/:id/mark-answered", requireAuth, async (req, res) => {
  const entry = await prisma.journal.findFirst({
    where: { id: req.params.id as string as string, userId: req.user!.id, isPrayer: true },
  });
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.journal.update({
    where: { id: entry.id },
    data: { isAnswered: true, answeredAt: new Date() },
  });
  res.json({ entry: updated });
});

// POST /api/journal/:id/share — share to a group
router.post("/api/journal/:id/share", requireAuth, async (req, res) => {
  const { groupId } = req.body as { groupId: string };
  if (!groupId) { res.status(400).json({ error: "groupId required" }); return; }

  const entry = await prisma.journal.findFirst({
    where: { id: req.params.id as string as string, userId: req.user!.id },
  });
  if (!entry) { res.status(404).json({ error: "Not found" }); return; }

  // Check user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user!.id } },
  });
  if (!membership) { res.status(403).json({ error: "Not a group member" }); return; }

  const updated = await prisma.journal.update({
    where: { id: entry.id },
    data: { sharedGroupId: groupId },
  });
  res.json({ entry: updated });
});

export default router;
