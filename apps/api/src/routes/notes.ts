import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/notes?book=&chapter=
router.get("/api/notes", requireAuth, async (req, res) => {
  const { book, chapter } = req.query;
  const where: Record<string, unknown> = { userId: req.user!.id };
  if (book) where.book = book;
  if (chapter) where.chapter = parseInt(chapter as string, 10);

  const notes = await prisma.bibleNote.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  res.json({ notes });
});

// POST /api/notes
router.post("/api/notes", requireAuth, async (req, res) => {
  const { book, chapter, verse, content, highlight } = req.body as {
    book: string;
    chapter: number;
    verse?: number;
    content: string;
    highlight?: string;
  };

  if (!book || !chapter || !content) {
    res.status(400).json({ error: "book, chapter, and content required" });
    return;
  }

  const note = await prisma.bibleNote.create({
    data: { userId: req.user!.id, book, chapter, verse, content, highlight },
  });
  res.status(201).json({ note });
});

// PATCH /api/notes/:id
router.patch("/api/notes/:id", requireAuth, async (req, res) => {
  const note = await prisma.bibleNote.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!note) { res.status(404).json({ error: "Not found" }); return; }

  const updated = await prisma.bibleNote.update({
    where: { id: note.id },
    data: req.body,
  });
  res.json({ note: updated });
});

// DELETE /api/notes/:id
router.delete("/api/notes/:id", requireAuth, async (req, res) => {
  const note = await prisma.bibleNote.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
  });
  if (!note) { res.status(404).json({ error: "Not found" }); return; }

  await prisma.bibleNote.delete({ where: { id: note.id } });
  res.json({ success: true });
});

export default router;
