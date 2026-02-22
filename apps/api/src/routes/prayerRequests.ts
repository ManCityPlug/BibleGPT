import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/prayer-requests?groupId=
router.get("/api/prayer-requests", requireAuth, async (req, res) => {
  const { groupId } = req.query;
  const where: Record<string, unknown> = {};

  if (groupId) {
    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: groupId as string, userId: req.user!.id } },
    });
    if (!membership) { res.status(403).json({ error: "Not a member" }); return; }
    where.groupId = groupId;
  } else {
    where.userId = req.user!.id;
  }

  const requests = await prisma.prayerRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  res.json({ prayerRequests: requests });
});

// POST /api/prayer-requests
router.post("/api/prayer-requests", requireAuth, async (req, res) => {
  const { content, groupId, isPublic } = req.body as {
    content: string;
    groupId?: string;
    isPublic?: boolean;
  };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const request = await prisma.prayerRequest.create({
    data: {
      userId: req.user!.id,
      content,
      groupId,
      isPublic: isPublic ?? true,
    },
  });
  res.status(201).json({ prayerRequest: request });
});

// PATCH /api/prayer-requests/:id/mark-answered
router.patch("/api/prayer-requests/:id/mark-answered", requireAuth, async (req, res) => {
  const request = await prisma.prayerRequest.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!request) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.prayerRequest.update({
    where: { id: request.id },
    data: { isAnswered: true, answeredAt: new Date() },
  });
  res.json({ prayerRequest: updated });
});

// DELETE /api/prayer-requests/:id
router.delete("/api/prayer-requests/:id", requireAuth, async (req, res) => {
  const request = await prisma.prayerRequest.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!request) { res.status(404).json({ error: "Not found" }); return; }
  await prisma.prayerRequest.delete({ where: { id: request.id } });
  res.json({ success: true });
});

export default router;
