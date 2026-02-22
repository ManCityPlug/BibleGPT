import { Router } from "express";
import { KJV_BOOKS, BOOK_CHAPTER_COUNTS, fetchChapter, searchBible } from "../lib/bible";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/bible/books
router.get("/api/bible/books", requireAuth, (_req, res) => {
  const books = KJV_BOOKS.map((name) => ({
    name,
    chapters: BOOK_CHAPTER_COUNTS[name] ?? 1,
  }));
  res.json({ books });
});

// GET /api/bible/:book/:chapter
router.get("/api/bible/:book/:chapter", requireAuth, async (req, res) => {
  const { book, chapter } = req.params;
  const chapterNum = parseInt(chapter, 10);

  if (!book || isNaN(chapterNum)) {
    res.status(400).json({ error: "Invalid book or chapter" });
    return;
  }

  try {
    const data = await fetchChapter(book, chapterNum);
    res.json(data);
  } catch (err) {
    console.error("Bible fetch error:", err);
    res.status(500).json({ error: "Failed to fetch chapter" });
  }
});

// GET /api/bible/search?q=...
router.get("/api/bible/search", requireAuth, async (req, res) => {
  const q = req.query.q as string;
  if (!q || q.trim().length < 2) {
    res.status(400).json({ error: "Query must be at least 2 characters" });
    return;
  }

  try {
    const verses = await searchBible(q.trim());
    res.json({ verses });
  } catch (err) {
    console.error("Bible search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
