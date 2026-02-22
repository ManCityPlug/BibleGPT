import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { bibleApi } from "@/lib/api";
import type { BibleBook } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";

export default function BibleScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bibleApi.books().then(({ books }) => setBooks(books)).finally(() => setLoading(false));
  }, []);

  const OT_END = 39;
  const filtered = books.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  const ot = filtered.slice(0, OT_END);
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
        />
      </View>

      <FlatList
        data={[
          { type: "section", label: "OLD TESTAMENT" },
          ...ot.map((b) => ({ type: "book", ...b })),
          { type: "section", label: "NEW TESTAMENT" },
          ...nt.map((b) => ({ type: "book", ...b })),
        ]}
        keyExtractor={(item, i) => `${item.type}-${i}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === "section") {
            return <Text style={styles.sectionLabel}>{(item as { label: string }).label}</Text>;
          }
          return <BookItem item={item as BibleBook} />;
        }}
      />
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
