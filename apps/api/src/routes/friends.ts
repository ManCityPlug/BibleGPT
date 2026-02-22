import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/friends
router.get("/api/friends", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const friends = await prisma.friend.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, name: true, avatarUrl: true, email: true } },
      userB: { select: { id: true, name: true, avatarUrl: true, email: true } },
    },
  });

  const friendList = friends.map((f) =>
    f.userAId === userId ? f.userB : f.userA
  );
  res.json({ friends: friendList });
});

// GET /api/friends/requests
router.get("/api/friends/requests", requireAuth, async (req, res) => {
  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: req.user!.id, status: "pending" },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });
  res.json({ requests });
});

// POST /api/friends/requests — send request
router.post("/api/friends/requests", requireAuth, async (req, res) => {
  const { receiverId } = req.body as { receiverId: string };
  if (!receiverId) { res.status(400).json({ error: "receiverId required" }); return; }
  if (receiverId === req.user!.id) {
    res.status(400).json({ error: "Cannot friend yourself" }); return;
  }

  const existing = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: req.user!.id, receiverId } },
  });
  if (existing) { res.json({ request: existing }); return; }

  const request = await prisma.friendRequest.create({
    data: { senderId: req.user!.id, receiverId, status: "pending" },
  });
  res.status(201).json({ request });
});

// PATCH /api/friends/requests/:id — accept or decline
router.patch("/api/friends/requests/:id", requireAuth, async (req, res) => {
  const { action } = req.body as { action: "accept" | "decline" };
  if (!["accept", "decline"].includes(action)) {
    res.status(400).json({ error: "action must be accept or decline" }); return;
  }

  const request = await prisma.friendRequest.findFirst({
    where: { id: req.params.id, receiverId: req.user!.id, status: "pending" },
  });
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  if (action === "accept") {
    const [, updated] = await prisma.$transaction([
      prisma.friend.create({
        data: { userAId: request.senderId, userBId: request.receiverId },
      }),
      prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "accepted" },
      }),
    ]);
    res.json({ request: updated });
  } else {
    const updated = await prisma.friendRequest.update({
      where: { id: request.id },
      data: { status: "declined" },
    });
    res.json({ request: updated });
  }
});

// DELETE /api/friends/:userId — remove friend
router.delete("/api/friends/:userId", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const targetId = req.params.userId;

  await prisma.friend.deleteMany({
    where: {
      OR: [
        { userAId: userId, userBId: targetId },
        { userAId: targetId, userBId: userId },
      ],
    },
  });
  res.json({ success: true });
});

// GET /api/friends/search?q=
router.get("/api/friends/search", requireAuth, async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    res.status(400).json({ error: "Query too short" }); return;
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: req.user!.id } },
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: { id: true, name: true, avatarUrl: true, email: true },
    take: 20,
  });
  res.json({ users });
});

export default router;
