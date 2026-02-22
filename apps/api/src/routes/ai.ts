import { Router } from "express";
import { prisma } from "../lib/prisma";
import { streamBibleChat, MessageParam } from "../lib/claude";
import { requireAuth, requireSubscription } from "../middleware/auth";

const router = Router();

// GET /api/ai/conversations
router.get("/api/ai/conversations", requireAuth, requireSubscription, async (req, res) => {
  const conversations = await prisma.aIConversation.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  res.json({ conversations });
});

// POST /api/ai/conversations
router.post("/api/ai/conversations", requireAuth, requireSubscription, async (req, res) => {
  const convo = await prisma.aIConversation.create({
    data: {
      userId: req.user!.id,
      title: req.body.title ?? "New Conversation",
      messages: [],
    },
  });
  res.status(201).json({ conversation: convo });
});

// GET /api/ai/conversations/:id
router.get("/api/ai/conversations/:id", requireAuth, requireSubscription, async (req, res) => {
  const convo = await prisma.aIConversation.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ conversation: convo });
});

// DELETE /api/ai/conversations/:id
router.delete("/api/ai/conversations/:id", requireAuth, requireSubscription, async (req, res) => {
  const convo = await prisma.aIConversation.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }
  await prisma.aIConversation.delete({ where: { id: convo.id } });
  res.json({ success: true });
});

/**
 * POST /api/ai/conversations/:id/messages
 * SSE streaming endpoint — sends Claude's response token by token.
 */
router.post(
  "/api/ai/conversations/:id/messages",
  requireAuth,
  requireSubscription,
  async (req, res) => {
    const convo = await prisma.aIConversation.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
    });
    if (!convo) { res.status(404).json({ error: "Not found" }); return; }

    const { content } = req.body as { content: string };
    if (!content?.trim()) {
      res.status(400).json({ error: "content required" });
      return;
    }

    // Append user message
    const history = (convo.messages as MessageParam[]) ?? [];
    history.push({ role: "user", content });

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const assistantContent = await streamBibleChat(history, res);

      history.push({ role: "assistant", content: assistantContent });

      // Persist updated conversation
      const title =
        convo.title === "New Conversation" && history.length <= 2
          ? content.slice(0, 60)
          : convo.title;

      await prisma.aIConversation.update({
        where: { id: convo.id },
        data: { messages: history, title },
      });
    } catch (err) {
      console.error("AI stream error:", err);
      res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
    } finally {
      res.end();
    }
  }
);

export default router;
