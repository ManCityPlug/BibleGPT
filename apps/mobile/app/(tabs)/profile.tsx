import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Share,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { accountApi, referralsApi } from "@/lib/api";
import type { UserProfile } from "@/lib/api";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      accountApi.get().then((r) => setProfile(r.user)),
      referralsApi.get().then((r) => setReferralCode(r.referralCode)),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    await AsyncStorage.multiRemove([
      "@biblegpt_onboarding_done",
      "@biblegpt_subscription_status",
      "@biblegpt_paywall_shown",
    ]);
  }

  function getStatusColor(status?: string | null) {
    if (status === "active" || status === "trialing") return colors.success;
    if (status === "past_due") return colors.warning;
    return colors.error;
  }

  function getStatusLabel(status?: string | null) {
    switch (status) {
      case "trialing": return "Free Trial";
      case "active": return "Active";
      case "past_due": return "Past Due";
      case "canceled": return "Canceled";
      default: return "No Subscription";
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const sub = profile?.subscription;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.name ?? profile?.email ?? "U")[0].toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{profile?.name ?? "Bible Reader"}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>
      </View>

      {/* Streak */}
      {profile?.streak && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>READING STREAK</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakNum}>🔥 {profile.streak.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakNum}>🏆 {profile.streak.longestStreak}</Text>
              <Text style={styles.streakLabel}>Best</Text>
            </View>
          </View>
        </View>
      )}

      {/* Subscription */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>SUBSCRIPTION</Text>
        <View style={styles.subRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(sub?.status) }]} />
          <Text style={styles.statusText}>{getStatusLabel(sub?.status)}</Text>
        </View>
        {sub?.trialEndsAt && sub.status === "trialing" && (
          <Text style={styles.trialNote}>
            Trial ends {new Date(sub.trialEndsAt).toLocaleDateString()}
          </Text>
        )}
        <TouchableOpacity style={styles.manageBtn} onPress={() => router.push("/payment" as never)}>
          <Text style={styles.manageBtnText}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>

      {/* Referral */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>REFER A FRIEND</Text>
        <Text style={styles.refDesc}>Share BibleGPT and earn rewards when friends subscribe</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{referralCode}</Text>
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() =>
            Share.share({
              message: `Join me on BibleGPT — the #1 Bible study app! Use my code ${referralCode} when you sign up for a free bonus. Download: https://biblegpt.net`,
              title: "Join me on BibleGPT",
            })
          }
        >
          <Text style={styles.shareBtnText}>Share Code</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/ai" as never)}>
          <Text style={styles.actionText}>🤖 BibleGPT AI Chat</Text>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/plans" as never)}>
          <Text style={styles.actionText}>📅 Reading Plans</Text>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing["4xl"], paddingBottom: spacing["4xl"] },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.base, marginBottom: spacing.xl },
  avatar: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.primary },
  avatarText: { color: colors.primary, fontSize: typography.xl, fontWeight: "700" },
  name: { fontSize: typography.xl, fontWeight: "700", color: colors.text },
  email: { fontSize: typography.sm, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.base, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  cardLabel: { fontSize: typography.xs, fontWeight: "700", color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.md },
  streakRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  streakItem: { flex: 1, alignItems: "center" },
  streakNum: { fontSize: typography.xl, fontWeight: "700", color: colors.text },
  streakLabel: { fontSize: typography.xs, color: colors.textSecondary, marginTop: spacing.xs },
  streakDivider: { width: 1, height: 40, backgroundColor: colors.border },
  subRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: radius.full },
  statusText: { fontSize: typography.base, fontWeight: "600", color: colors.text },
  trialNote: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.xs },
  manageBtn: { marginTop: spacing.md, backgroundColor: colors.primaryBg, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center" },
  manageBtnText: { color: colors.primary, fontWeight: "600", fontSize: typography.sm },
  refDesc: { fontSize: typography.sm, color: colors.textSecondary, marginBottom: spacing.md },
  codeBox: { backgroundColor: colors.goldBg, borderRadius: radius.md, padding: spacing.base, alignItems: "center", borderWidth: 1, borderColor: colors.gold },
  code: { fontSize: typography.xl, fontWeight: "800", color: colors.text, letterSpacing: 4 },
  shareBtn: { marginTop: spacing.md, backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center" },
  shareBtnText: { color: colors.textInverse, fontWeight: "700", fontSize: typography.sm },
  actions: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, overflow: "hidden" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionText: { fontSize: typography.base, color: colors.text },
  actionArrow: { color: colors.textTertiary },
  logoutBtn: { backgroundColor: colors.errorBg, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: "center", borderWidth: 1, borderColor: colors.error },
  logoutText: { color: colors.error, fontWeight: "700", fontSize: typography.base },
});
