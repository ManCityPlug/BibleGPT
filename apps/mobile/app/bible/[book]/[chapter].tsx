import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { bibleApi } from "@/lib/api";
import type { BibleVerse } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { BOOK_CHAPTER_COUNTS } from "@/constants/bible";

const TRANSLATION_KEY = "biblegpt_translation";

const TRANSLATIONS = [
  { id: "kjv",          abbr: "KJV", name: "King James Version" },
  { id: "web",          abbr: "WEB", name: "World English Bible" },
  { id: "asv",          abbr: "ASV", name: "American Standard Version" },
  { id: "douayrheims",  abbr: "D-R", name: "Douay-Rheims" },
] as const;

type TranslationId = (typeof TRANSLATIONS)[number]["id"];

export default function ChapterScreen() {
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter: string }>();
  const router = useRouter();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(17);
  const [translation, setTranslation] = useState<TranslationId>("kjv");

  const bookName = decodeURIComponent(book);
  const chapterNum = parseInt(chapter, 10);
  const totalChapters = BOOK_CHAPTER_COUNTS[bookName] ?? 1;

  // Load saved translation on mount
  useEffect(() => {
    AsyncStorage.getItem(TRANSLATION_KEY).then((saved) => {
      if (saved && TRANSLATIONS.find((t) => t.id === saved)) {
        setTranslation(saved as TranslationId);
      }
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bibleApi.chapter(bookName, chapterNum, translation);
      setVerses(data.verses);
    } finally {
      setLoading(false);
    }
  }, [bookName, chapterNum, translation]);

  useEffect(() => { load(); }, [load]);

  async function selectTranslation(id: TranslationId) {
    setTranslation(id);
    await AsyncStorage.setItem(TRANSLATION_KEY, id);
  }

  function navigate(newChapter: number) {
    router.replace(`/bible/${encodeURIComponent(bookName)}/${newChapter}` as never);
  }

  const currentTranslation = TRANSLATIONS.find((t) => t.id === translation)!;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Books</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBook}>{bookName}</Text>
          <Text style={styles.headerChapter}>Chapter {chapterNum}</Text>
        </View>
        <View style={styles.fontControls}>
          <TouchableOpacity onPress={() => setFontSize((f) => Math.max(13, f - 2))} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFontSize((f) => Math.min(24, f + 2))} style={styles.fontBtn}>
            <Text style={styles.fontBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Translation Selector */}
      <View style={styles.translationBar}>
        {TRANSLATIONS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.translationPill, translation === t.id && styles.translationPillActive]}
            onPress={() => selectTranslation(t.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.translationPillText, translation === t.id && styles.translationPillTextActive]}>
              {t.abbr}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.chapterTitle}>{bookName} {chapterNum}</Text>
          <Text style={styles.translationLabel}>{currentTranslation.name}</Text>
          {verses.map((v) => (
            <TouchableOpacity
              key={v.verse}
              onPress={() => {
                Share.share({ message: `"${v.text.trim()}" — ${bookName} ${chapterNum}:${v.verse} (${currentTranslation.abbr})` });
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.verseText, { fontSize }]}>
                <Text style={styles.verseNum}>{v.verse} </Text>
                {v.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Navigation */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, chapterNum <= 1 && styles.navBtnDisabled]}
          onPress={() => chapterNum > 1 && navigate(chapterNum - 1)}
          disabled={chapterNum <= 1}
        >
          <Text style={styles.navBtnText}>← Prev</Text>
        </TouchableOpacity>

        <Text style={styles.navChapter}>{chapterNum} / {totalChapters}</Text>

        <TouchableOpacity
          style={[styles.navBtn, chapterNum >= totalChapters && styles.navBtnDisabled]}
          onPress={() => chapterNum < totalChapters && navigate(chapterNum + 1)}
          disabled={chapterNum >= totalChapters}
        >
          <Text style={styles.navBtnText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.base, paddingTop: spacing["4xl"], paddingBottom: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { paddingVertical: spacing.sm, minWidth: 60 },
  backText: { color: colors.primary, fontSize: typography.sm, fontWeight: "600" },
  headerCenter: { alignItems: "center" },
  headerBook: { fontSize: typography.md, fontWeight: "700", color: colors.text },
  headerChapter: { fontSize: typography.sm, color: colors.textSecondary },
  fontControls: { flexDirection: "row", gap: spacing.sm },
  fontBtn: {
    backgroundColor: colors.surface, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.border,
  },
  fontBtnText: { color: colors.textSecondary, fontSize: typography.sm, fontWeight: "600" },

  // Translation bar
  translationBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.base,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  translationPill: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
  },
  translationPillActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  translationPillText: {
    fontSize: typography.xs, fontWeight: "700", color: colors.textSecondary,
  },
  translationPillTextActive: { color: "#fff" },

  content: { padding: spacing.xl, paddingBottom: spacing["5xl"] },
  chapterTitle: { fontSize: typography.xl, fontWeight: "700", color: colors.gold, marginBottom: spacing.xs, textAlign: "center" },
  translationLabel: { fontSize: typography.xs, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl },
  verseText: { color: colors.text, lineHeight: typography.base * 1.9, marginBottom: spacing.sm },
  verseNum: { color: colors.primary, fontWeight: "700", fontSize: typography.sm },
  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.xl, paddingVertical: spacing.base,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  navBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: colors.textInverse, fontWeight: "600", fontSize: typography.sm },
  navChapter: { color: colors.textSecondary, fontSize: typography.sm },
});
