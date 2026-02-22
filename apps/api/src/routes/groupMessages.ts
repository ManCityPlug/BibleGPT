import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/groups/:id/messages?cursor=&limit=
router.get("/api/groups/:id/messages", requireAuth, async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: req.params.id, userId: req.user!.id } },
  });
  if (!membership) { res.status(403).json({ error: "Not a member" }); return; }

  const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10), 100);
  const cursor = req.query.cursor as string | undefined;

  const messages = await prisma.groupMessage.findMany({
    where: { groupId: req.params.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  res.json({
    messages: messages.reverse(),
    nextCursor: messages.length === limit ? messages[0].id : null,
  });
});

// POST /api/groups/:id/messages
// Supabase Realtime automatically broadcasts DB inserts to subscribers
router.post("/api/groups/:id/messages", requireAuth, async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: req.params.id, userId: req.user!.id } },
  });
  if (!membership) { res.status(403).json({ error: "Not a member" }); return; }

  const { content } = req.body as { content: string };
  if (!content?.trim()) { res.status(400).json({ error: "content required" }); return; }

  const message = await prisma.groupMessage.create({
    data: { groupId: req.params.id, userId: req.user!.id, content },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  res.status(201).json({ message });
});

export default router;
