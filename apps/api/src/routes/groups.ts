import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/groups — list groups the user belongs to
router.get("/api/groups", requireAuth, async (req, res) => {
  const memberships = await prisma.groupMember.findMany({
    where: { userId: req.user!.id },
    include: { group: { include: { _count: { select: { members: true } } } } },
  });
  res.json({ groups: memberships.map((m) => ({ ...m.group, role: m.role })) });
});

// POST /api/groups — create a group
router.post("/api/groups", requireAuth, async (req, res) => {
  const { name, description, isPrivate } = req.body as {
    name: string;
    description?: string;
    isPrivate?: boolean;
  };
  if (!name) { res.status(400).json({ error: "name required" }); return; }

  const group = await prisma.group.create({
    data: {
      name,
      description,
      isPrivate: isPrivate ?? false,
      createdById: req.user!.id,
      members: {
        create: { userId: req.user!.id, role: "admin" },
      },
    },
  });
  res.status(201).json({ group });
});

// GET /api/groups/:id
router.get("/api/groups/:id", requireAuth, async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: req.params.id, userId: req.user!.id } },
  });
  if (!membership) { res.status(403).json({ error: "Not a member" }); return; }

  const group = await prisma.group.findUnique({
    where: { id: req.params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      announcements: { orderBy: { createdAt: "desc" }, take: 5 },
      assignments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  res.json({ group });
});

// PATCH /api/groups/:id
router.patch("/api/groups/:id", requireAuth, async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: req.params.id, userId: req.user!.id } },
  });
  if (!membership || membership.role !== "admin") {
    res.status(403).json({ error: "Admin only" }); return;
  }

  const group = await prisma.group.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ group });
});

// DELETE /api/groups/:id
router.delete("/api/groups/:id", requireAuth, async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: req.params.id, userId: req.user!.id } },
  });
  if (!membership || membership.role !== "admin") {
    res.status(403).json({ error: "Admin only" }); return;
  }

  await prisma.group.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// POST /api/groups/:id/members — invite by userId
router.post("/api/groups/:id/members", requireAuth, async (req, res) => {
  const { userId } = req.body as { userId: string };
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  const member = await prisma.groupMember.create({
    data: { groupId: req.params.id, userId, role: "member" },
  });
  res.status(201).json({ member });
});

// DELETE /api/groups/:id/members/:userId
router.delete("/api/groups/:id/members/:userId", requireAuth, async (req, res) => {
  const isAdmin = await prisma.groupMember.findFirst({
    where: { groupId: req.params.id, userId: req.user!.id, role: "admin" },
  });
  const isSelf = req.params.userId === req.user!.id;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId: req.params.id, userId: req.params.userId } },
  });
  res.json({ success: true });
});

// POST /api/groups/:id/announcements
router.post("/api/groups/:id/announcements", requireAuth, async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: req.params.id, userId: req.user!.id } },
  });
  if (!membership || membership.role !== "admin") {
    res.status(403).json({ error: "Admin only" }); return;
  }

  const { content } = req.body as { content: string };
  if (!content) { res.status(400).json({ error: "content required" }); return; }

  const announcement = await prisma.groupAnnouncement.create({
    data: { groupId: req.params.id, authorId: req.user!.id, content },
  });
  res.status(201).json({ announcement });
});

// POST /api/groups/:id/assignments
router.post("/api/groups/:id/assignments", requireAuth, async (req, res) => {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: req.params.id, userId: req.user!.id } },
  });
  if (!membership || membership.role !== "admin") {
    res.status(403).json({ error: "Admin only" }); return;
  }

  const { passage, dueDate, notes } = req.body as {
    passage: string;
    dueDate?: string;
    notes?: string;
  };
  if (!passage) { res.status(400).json({ error: "passage required" }); return; }

  const assignment = await prisma.groupReadingAssignment.create({
    data: {
      groupId: req.params.id,
      passage,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes,
    },
  });
  res.status(201).json({ assignment });
});

export default router;
