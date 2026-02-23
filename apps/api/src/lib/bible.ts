/**
 * Bible utilities — fetches KJV data from bible-api.com
 * Free, no auth required, no license needed (KJV is public domain)
 */

const BIBLE_API_BASE = "https://bible-api.com";

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapterResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
}

export const KJV_BOOKS = [
  // Old Testament
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
  // New Testament
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation",
];

export const BOOK_CHAPTER_COUNTS: Record<string, number> = {
  "Genesis": 50, "Exodus": 40, "Leviticus": 27, "Numbers": 36, "Deuteronomy": 34,
  "Joshua": 24, "Judges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  "Ezra": 10, "Nehemiah": 13, "Esther": 10, "Job": 42, "Psalms": 150, "Proverbs": 31,
  "Ecclesiastes": 12, "Song of Solomon": 8, "Isaiah": 66, "Jeremiah": 52,
  "Lamentations": 5, "Ezekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3, "Amos": 9,
  "Obadiah": 1, "Jonah": 4, "Micah": 7, "Nahum": 3, "Habakkuk": 3, "Zephaniah": 3,
  "Haggai": 2, "Zechariah": 14, "Malachi": 4,
  "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21, "Acts": 28,
  "Romans": 16, "1 Corinthians": 16, "2 Corinthians": 13, "Galatians": 6, "Ephesians": 6,
  "Philippians": 4, "Colossians": 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, "Titus": 3, "Philemon": 1, "Hebrews": 13,
  "James": 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1, "3 John": 1,
  "Jude": 1, "Revelation": 22,
};

export const SUPPORTED_TRANSLATIONS: Record<string, string> = {
  kjv: "King James Version",
  web: "World English Bible",
  asv: "American Standard Version",
  douayrheims: "Douay-Rheims",
};

const VALID_TRANSLATIONS = new Set(Object.keys(SUPPORTED_TRANSLATIONS));

export function resolveTranslation(t?: string): string {
  return t && VALID_TRANSLATIONS.has(t) ? t : "kjv";
}

export async function fetchChapter(
  book: string,
  chapter: number,
  translation = "kjv"
): Promise<BibleChapterResponse> {
  const query = encodeURIComponent(`${book} ${chapter}`);
  const t = resolveTranslation(translation);
  const res = await fetch(`${BIBLE_API_BASE}/${query}?translation=${t}&verse_numbers=true`);
  if (!res.ok) throw new Error(`Bible API error: ${res.status}`);
  return res.json() as Promise<BibleChapterResponse>;
}

export async function searchBible(query: string, translation = "kjv"): Promise<BibleVerse[]> {
  const t = resolveTranslation(translation);
  const res = await fetch(
    `${BIBLE_API_BASE}/${encodeURIComponent(query)}?translation=${t}`
  );
  if (!res.ok) return [];
  const data = (await res.json()) as BibleChapterResponse;
  return data.verses ?? [];
}
