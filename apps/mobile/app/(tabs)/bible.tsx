import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { bibleApi } from "@/lib/api";
import type { BibleBook } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { BOOK_CHAPTER_COUNTS } from "@/constants/bible";

const FALLBACK_BOOKS: BibleBook[] = Object.entries(BOOK_CHAPTER_COUNTS).map(
  ([name, chapters]) => ({ name, chapters })
);

export default function BibleScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    bibleApi
      .books()
      .then(({ books: fetched }) => {
        setBooks(fetched && fetched.length > 0 ? fetched : FALLBACK_BOOKS);
      })
      .catch(() => {
        setBooks(FALLBACK_BOOKS);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const OT_END = 39;
  const allBooks = books.length > 0 ? books : FALLBACK_BOOKS;
  const filtered = allBooks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  const ot = filtered.slice(0, Math.min(OT_END, filtered.length));
  const nt = filtered.slice(OT_END);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  function BookItem({ item }: { item: BibleBook }) {
    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() => router.push(`/bible/${encodeURIComponent(item.name)}/1` as never)}
      >
        <Text style={styles.bookName}>{item.name}</Text>
        <Text style={styles.chapterCount}>{item.chapters} ch</Text>
      </TouchableOpacity>
    );
  }

  type ListItem =
    | { type: "section"; label: string }
    | { type: "book"; name: string; chapters: number };

  const listData: ListItem[] = [
    { type: "section", label: "OLD TESTAMENT" },
    ...ot.map((b): ListItem => ({ type: "book", ...b })),
    ...(nt.length > 0
      ? [
          { type: "section" as const, label: "NEW TESTAMENT" },
          ...nt.map((b): ListItem => ({ type: "book", ...b })),
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Holy Bible</Text>
        <Text style={styles.subtitle}>King James Version</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search books..."
          placeholderTextColor={colors.textTertiary}
          clearButtonMode="while-editing"
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>No books found</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => `${item.type}-${i}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.type === "section") {
              return <Text style={styles.sectionLabel}>{(item as { label: string }).label}</Text>;
            }
            return <BookItem item={item as BibleBook} />;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing["4xl"], paddingBottom: spacing.base },
  title: { fontSize: typography["2xl"], fontWeight: "700", color: colors.text },
  subtitle: { fontSize: typography.sm, color: colors.gold, fontWeight: "600", marginTop: spacing.xs },
  searchBar: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  searchInput: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: typography.base, color: colors.text,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing["4xl"] },
  sectionLabel: {
    fontSize: typography.xs, fontWeight: "700", color: colors.gold,
    letterSpacing: 1.5, marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  bookItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  bookName: { fontSize: typography.base, color: colors.text, fontWeight: "500" },
  chapterCount: { fontSize: typography.xs, color: colors.textTertiary },
});
