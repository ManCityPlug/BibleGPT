import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { devotionalsApi, accountApi } from "@/lib/api";
import type { Devotional, UserProfile } from "@/lib/api";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

const FALLBACK_VERSE = {
  text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  ref: "John 3:16",
};

const QUICK_ACTIONS = [
  { icon: "📖", label: "Read Bible",    route: "/(tabs)/bible",     bg: "#FDF6E3", border: "#C9A84C", iconBg: "#C9A84C" },
  { icon: "🤖", label: "Ask BibleGPT", route: "/ai",               bg: "#F0EBFA", border: "#7B5EA7", iconBg: "#7B5EA7" },
  { icon: "✍️", label: "Journal",       route: "/(tabs)/journal",   bg: "#EBF5EE", border: "#4A7C59", iconBg: "#4A7C59" },
  { icon: "🙏", label: "Community",    route: "/(tabs)/community", bg: "#EAF0FB", border: "#4A6FA7", iconBg: "#4A6FA7" },
] as const;

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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const verseText = devotional?.verseText ?? FALLBACK_VERSE.text;
  const verseRef  = devotional?.verse      ?? FALLBACK_VERSE.ref;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.logo}>✝</Text>
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}{profile?.name ? `, ${profile.name}` : ""}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
          </View>
          {profile?.streak && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <View>
                <Text style={styles.streakCount}>{profile.streak.currentStreak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Verse Hero Card ── */}
        <View style={styles.verseCard}>
          {/* Decorative cross/quote */}
          <Text style={styles.verseDecor}>"</Text>
          <View style={styles.verseDayBadge}>
            <Text style={styles.verseDayText}>✦  VERSE OF THE DAY</Text>
          </View>
          <Text style={styles.verseText}>{verseText}</Text>
          <View style={styles.verseRefRow}>
            <View style={styles.verseRefBadge}>
              <Text style={styles.verseRefText}>— {verseRef}</Text>
            </View>
          </View>
          {devotional && (
            <TouchableOpacity style={styles.devButton}>
              <Text style={styles.devButtonText}>Read today's devotional →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.quickCard, { backgroundColor: item.bg, borderColor: item.border }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: item.iconBg }]}>
                <Text style={styles.quickIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Today's Devotional preview (if loaded) ── */}
        {devotional && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>TODAY'S DEVOTIONAL</Text>
            <View style={styles.devCard}>
              <Text style={styles.devTitle}>{devotional.title}</Text>
              <Text style={styles.devContent} numberOfLines={3}>{devotional.content}</Text>
              <View style={styles.devFooter}>
                <TouchableOpacity style={styles.devReadBtn}>
                  <Text style={styles.devReadText}>Continue reading</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ── Bottom padding for tab bar ── */}
        <View style={{ height: spacing["2xl"] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  center:   { flex: 1, justifyContent: "center", alignItems: "center" },
  logo:     { fontSize: 48, color: colors.primary },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    marginBottom: spacing.xl,
  },
  greeting: { fontSize: typography.xl, fontWeight: "800", color: colors.text },
  date:     { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2 },
  streakBadge: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    backgroundColor: colors.goldBg, borderRadius: radius.xl,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1.5, borderColor: colors.gold,
  },
  streakFire:  { fontSize: 22 },
  streakCount: { fontSize: typography.md, fontWeight: "800", color: colors.text, lineHeight: 20 },
  streakLabel: { fontSize: typography.xs, color: colors.textTertiary, lineHeight: 14 },

  // Verse hero card
  verseCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing["2xl"],
    overflow: "hidden",
    ...shadows.lg,
  },
  verseDecor: {
    position: "absolute", top: -10, left: 16,
    fontSize: 120, color: "rgba(255,255,255,0.07)", fontWeight: "900",
    lineHeight: 130,
  },
  verseDayBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,168,76,0.25)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: "rgba(201,168,76,0.5)",
  },
  verseDayText: { fontSize: typography.xs, fontWeight: "700", color: colors.goldLight, letterSpacing: 1.2 },
  verseText: {
    fontSize: typography.md, color: "#FAF7F2",
    lineHeight: typography.md * 1.8, fontStyle: "italic",
    marginBottom: spacing.lg,
  },
  verseRefRow:  { flexDirection: "row" },
  verseRefBadge: {
    backgroundColor: "rgba(201,168,76,0.2)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  verseRefText: { fontSize: typography.sm, fontWeight: "700", color: colors.goldLight },
  devButton:    { marginTop: spacing.md },
  devButtonText: { color: "rgba(250,247,242,0.65)", fontSize: typography.sm, fontWeight: "600" },

  // Section label
  sectionLabel: {
    fontSize: typography.xs, fontWeight: "700",
    color: colors.textTertiary, letterSpacing: 1.2,
    marginBottom: spacing.md,
  },

  // Quick actions
  quickGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: spacing.md, marginBottom: spacing.xl,
  },
  quickCard: {
    flex: 1, minWidth: "45%",
    borderRadius: radius.xl, padding: spacing.lg,
    alignItems: "center", gap: spacing.sm,
    borderWidth: 1.5,
    ...shadows.sm,
  },
  quickIconWrap: {
    width: 52, height: 52,
    borderRadius: radius.lg,
    alignItems: "center", justifyContent: "center",
  },
  quickIcon:  { fontSize: 26 },
  quickLabel: { fontSize: typography.sm, fontWeight: "700", color: colors.text, textAlign: "center" },

  // Devotional card
  devCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },
  devTitle:   { fontSize: typography.lg, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  devContent: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: typography.sm * 1.7 },
  devFooter:  { marginTop: spacing.md, alignItems: "flex-start" },
  devReadBtn: {
    backgroundColor: colors.primaryBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  devReadText: { color: colors.primary, fontWeight: "700", fontSize: typography.sm },
});
