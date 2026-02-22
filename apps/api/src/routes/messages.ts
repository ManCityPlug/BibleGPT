import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}

// GET /api/messages — list DM conversations (unique conversationIds)
router.get("/api/messages", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  // Get all conversations where user has sent or received messages
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { conversationId: { contains: userId } },
        { senderId: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    distinct: ["conversationId"],
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  // Attach other user info
  const conversations = await Promise.all(
    messages.map(async (m) => {
      const [idA, idB] = m.conversationId.split("_");
      const otherId = idA === userId ? idB : idA;
      const other = await prisma.user.findUnique({
        where: { id: otherId },
        select: { id: true, name: true, avatarUrl: true },
      });
      const unread = await prisma.directMessage.count({
        where: { conversationId: m.conversationId, isRead: false, senderId: { not: userId } },
      });
      return { conversationId: m.conversationId, lastMessage: m, other, unread };
    })
  );

  res.json({ conversations });
});

// GET /api/messages/:conversationId
router.get("/api/messages/:conversationId", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { conversationId } = req.params;

  // Verify user is part of this conversation
  if (!conversationId.includes(userId)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10), 100);
  const cursor = req.query.cursor as string | undefined;

  const messages = await prisma.directMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Mark received messages as read
  await prisma.directMessage.updateMany({
    where: { conversationId, isRead: false, senderId: { not: userId } },
    data: { isRead: true },
  });

  res.json({
    messages: messages.reverse(),
    nextCursor: messages.length === limit ? messages[0].id : null,
  });
});

// POST /api/messages/:receiverId — send a DM
router.post("/api/messages/:receiverId", requireAuth, async (req, res) => {
  const { receiverId } = req.params;
  const { content } = req.body as { content: string };
  if (!content?.trim()) { res.status(400).json({ error: "content required" }); return; }
  if (receiverId === req.user!.id) {
    res.status(400).json({ error: "Cannot message yourself" }); return;
  }

  const conversationId = getConversationId(req.user!.id, receiverId);

  const message = await prisma.directMessage.create({
    data: { conversationId, senderId: req.user!.id, content },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  res.status(201).json({ message });
});

export default router;
