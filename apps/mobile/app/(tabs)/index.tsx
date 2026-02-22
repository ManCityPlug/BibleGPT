import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { devotionalsApi, accountApi } from "@/lib/api";
import type { Devotional, UserProfile } from "@/lib/api";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [devRes, profRes] = await Promise.allSettled([
        devotionalsApi.today(),
        accountApi.get(),
      ]);
      if (devRes.status === "fulfilled") setDevotional(devRes.value.devotional);
      if (profRes.status === "fulfilled") setProfile(profRes.value.user);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}{profile?.name ? `, ${profile.name}` : ""} 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
        </View>
        {profile?.streak && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{profile.streak.currentStreak}</Text>
          </View>
        )}
      </View>

      {/* Today's Devotional */}
      {devotional && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TODAY'S DEVOTIONAL</Text>
          <Text style={styles.devTitle}>{devotional.title}</Text>
          <View style={styles.verseBadge}>
            <Text style={styles.verseRef}>{devotional.verse}</Text>
          </View>
          <Text style={styles.verseText}>"{devotional.verseText}"</Text>
          <Text style={styles.devContent} numberOfLines={4}>{devotional.content}</Text>
          <TouchableOpacity style={styles.readButton}>
            <Text style={styles.readButtonText}>Read Full Devotional →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity style={styles.quickItem} onPress={() => router.push("/(tabs)/bible")}>
          <Text style={styles.quickIcon}>📖</Text>
          <Text style={styles.quickLabel}>Read Bible</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickItem} onPress={() => router.push("/ai")}>
          <Text style={styles.quickIcon}>🤖</Text>
          <Text style={styles.quickLabel}>Ask BibleGPT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickItem} onPress={() => router.push("/(tabs)/journal")}>
          <Text style={styles.quickIcon}>✍️</Text>
          <Text style={styles.quickLabel}>Journal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickItem} onPress={() => router.push("/(tabs)/community")}>
          <Text style={styles.quickIcon}>🙏</Text>
          <Text style={styles.quickLabel}>Community</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing["4xl"] },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  greeting: { fontSize: typography.xl, fontWeight: "700", color: colors.text },
  date: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.xs },
  streakBadge: {
    backgroundColor: colors.goldBg, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    borderWidth: 1, borderColor: colors.gold,
  },
  streakFire: { fontSize: typography.md },
  streakCount: { fontSize: typography.md, fontWeight: "700", color: colors.text },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl,
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  sectionLabel: { fontSize: typography.xs, fontWeight: "700", color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.md },
  devTitle: { fontSize: typography.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  verseBadge: {
    alignSelf: "flex-start", backgroundColor: colors.primaryBg,
    borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  verseRef: { fontSize: typography.sm, fontWeight: "600", color: colors.primary },
  verseText: { fontSize: typography.base, color: colors.text, fontStyle: "italic", lineHeight: typography.base * 1.9, marginBottom: spacing.md },
  devContent: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: typography.sm * 1.7 },
  readButton: { marginTop: spacing.md },
  readButtonText: { color: colors.primary, fontWeight: "600", fontSize: typography.sm },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quickItem: {
    flex: 1, minWidth: "45%", backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.base, alignItems: "center", gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  quickIcon: { fontSize: typography["2xl"] },
  quickLabel: { fontSize: typography.sm, fontWeight: "600", color: colors.text },
});
