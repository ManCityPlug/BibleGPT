"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./bible.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const TRANSLATIONS = [
  { id: "kjv", label: "KJV" },
  { id: "web", label: "WEB" },
  { id: "asv", label: "ASV" },
  { id: "douayrheims", label: "D-R" },
];

const BOOKS: { name: string; chapters: number }[] = [
  { name: "Genesis", chapters: 50 }, { name: "Exodus", chapters: 40 }, { name: "Leviticus", chapters: 27 },
  { name: "Numbers", chapters: 36 }, { name: "Deuteronomy", chapters: 34 }, { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 }, { name: "Ruth", chapters: 4 }, { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 }, { name: "1 Kings", chapters: 22 }, { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 }, { name: "2 Chronicles", chapters: 36 }, { name: "Ezra", chapters: 10 },
  { name: "Nehemiah", chapters: 13 }, { name: "Esther", chapters: 10 }, { name: "Job", chapters: 42 },
  { name: "Psalms", chapters: 150 }, { name: "Proverbs", chapters: 31 }, { name: "Ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", chapters: 8 }, { name: "Isaiah", chapters: 66 }, { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 }, { name: "Ezekiel", chapters: 48 }, { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 }, { name: "Joel", chapters: 3 }, { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 }, { name: "Jonah", chapters: 4 }, { name: "Micah", chapters: 7 },
  { name: "Nahum", chapters: 3 }, { name: "Habakkuk", chapters: 3 }, { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 }, { name: "Zechariah", chapters: 14 }, { name: "Malachi", chapters: 4 },
  { name: "Matthew", chapters: 28 }, { name: "Mark", chapters: 16 }, { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 }, { name: "Acts", chapters: 28 }, { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 }, { name: "2 Corinthians", chapters: 13 }, { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 }, { name: "Philippians", chapters: 4 }, { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 }, { name: "2 Thessalonians", chapters: 3 }, { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 }, { name: "Titus", chapters: 3 }, { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 }, { name: "James", chapters: 5 }, { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 }, { name: "1 John", chapters: 5 }, { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 }, { name: "Jude", chapters: 1 }, { name: "Revelation", chapters: 22 },
];

interface Verse { book_name: string; chapter: number; verse: number; text: string }

export default function BiblePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<{ name: string; chapters: number } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [translation, setTranslation] = useState("kjv");
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/auth/login"); return; }
      setToken(data.session.access_token);
    });
  }, [router]);

  const loadChapter = useCallback(async (book: string, chapter: number, trans = translation) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/bible/${encodeURIComponent(book)}/${chapter}?translation=${trans}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to load chapter");
      const data = await res.json() as { verses: Verse[] };
      setVerses(data.verses ?? []);
      setSelectedChapter(chapter);
    } catch {
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [token, translation]);

  function selectBook(book: { name: string; chapters: number }) {
    setSelectedBook(book);
    setSelectedChapter(null);
    setVerses([]);
  }

  function selectChapter(ch: number) {
    if (!selectedBook) return;
    loadChapter(selectedBook.name, ch);
  }

  function changeTranslation(t: string) {
    setTranslation(t);
    if (selectedBook && selectedChapter) {
      loadChapter(selectedBook.name, selectedChapter, t);
    }
  }

  const filtered = BOOKS.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const ot = filtered.filter((_, i) => BOOKS.indexOf(filtered[i]) < 39 || i < 39);
  const nt = filtered.filter((_, i) => BOOKS.indexOf(filtered[i]) >= 39 || i >= 39);

  const otBooks = BOOKS.slice(0, 39).filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const ntBooks = BOOKS.slice(39).filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.logo}>✝ BibleGPT</Link>
        <div className={styles.navLinks}>
          <Link href="/bible" className={styles.navActive}>Bible</Link>
          <Link href="/ai">AI Chat</Link>
          <Link href="/account">Account</Link>
        </div>
      </nav>

      <div className={styles.layout}>
        {/* Books Sidebar */}
        <aside className={`${styles.sidebar} ${selectedBook ? styles.sidebarHidden : ""}`}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Holy Bible</h2>
            <input
              className={styles.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search books..."
            />
          </div>
          <div className={styles.bookList}>
            {otBooks.length > 0 && (
              <>
                <div className={styles.testament}>OLD TESTAMENT</div>
                {otBooks.map(book => (
                  <button
                    key={book.name}
                    className={`${styles.bookBtn} ${selectedBook?.name === book.name ? styles.bookBtnActive : ""}`}
                    onClick={() => selectBook(book)}
                  >
                    <span>{book.name}</span>
                    <span className={styles.chapCount}>{book.chapters} ch</span>
                  </button>
                ))}
              </>
            )}
            {ntBooks.length > 0 && (
              <>
                <div className={styles.testament}>NEW TESTAMENT</div>
                {ntBooks.map(book => (
                  <button
                    key={book.name}
                    className={`${styles.bookBtn} ${selectedBook?.name === book.name ? styles.bookBtnActive : ""}`}
                    onClick={() => selectBook(book)}
                  >
                    <span>{book.name}</span>
                    <span className={styles.chapCount}>{book.chapters} ch</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {!selectedBook && (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>📖</div>
              <h2>Select a Book</h2>
              <p>Choose a book from the sidebar to begin reading</p>
            </div>
          )}

          {selectedBook && !selectedChapter && (
            <div className={styles.chapterView}>
              <button className={styles.backBtn} onClick={() => setSelectedBook(null)}>← Books</button>
              <h2 className={styles.bookTitle}>{selectedBook.name}</h2>
              <p className={styles.bookSub}>{selectedBook.chapters} Chapters</p>
              <div className={styles.chapterGrid}>
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button key={ch} className={styles.chapterBtn} onClick={() => selectChapter(ch)}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedBook && selectedChapter !== null && (
            <div className={styles.reader}>
              <div className={styles.readerHeader}>
                <button className={styles.backBtn} onClick={() => setSelectedChapter(null)}>
                  ← {selectedBook.name}
                </button>
                <h2 className={styles.chapterTitle}>
                  {selectedBook.name} {selectedChapter}
                </h2>
                <div className={styles.readerControls}>
                  <div className={styles.translationPills}>
                    {TRANSLATIONS.map(t => (
                      <button
                        key={t.id}
                        className={`${styles.transPill} ${translation === t.id ? styles.transPillActive : ""}`}
                        onClick={() => changeTranslation(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className={styles.fontControls}>
                    <button className={styles.fontBtn} onClick={() => setFontSize(f => Math.max(12, f - 2))}>A−</button>
                    <button className={styles.fontBtn} onClick={() => setFontSize(f => Math.min(24, f + 2))}>A+</button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className={styles.loading}>Loading...</div>
              ) : (
                <div className={styles.verses}>
                  {verses.map(v => (
                    <p key={v.verse} className={styles.verse} style={{ fontSize }}>
                      <sup className={styles.verseNum}>{v.verse}</sup>
                      {v.text}
                    </p>
                  ))}
                </div>
              )}

              <div className={styles.chapterNav}>
                {selectedChapter > 1 && (
                  <button className={styles.navBtn} onClick={() => selectChapter(selectedChapter - 1)}>
                    ← Previous
                  </button>
                )}
                {selectedChapter < selectedBook.chapters && (
                  <button className={`${styles.navBtn} ${styles.navBtnNext}`} onClick={() => selectChapter(selectedChapter + 1)}>
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
