import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { plansApi } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";

const PLANS = [
  { id: "365", label: "Through the Bible in a Year", desc: "Read the entire Bible in 365 days", days: 365 },
  { id: "90", label: "90-Day Bible", desc: "Cover the whole Bible in 3 months", days: 90 },
  { id: "60", label: "New Testament in 60 Days", desc: "Focus on the New Testament", days: 60 },
  { id: "30", label: "30-Day Psalms & Proverbs", desc: "Wisdom literature in one month", days: 30 },
  { id: "none", label: "No plan for now", desc: "Browse freely and explore", days: 0 },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      if (selectedPlan !== "none") {
        // Fetch real plan IDs from API, match by duration
        const { plans } = await plansApi.list();
        const match = plans.find((p) => p.durationDays === PLANS.find(pl => pl.id === selectedPlan)?.days);
        if (match) await plansApi.start(match.id);
      }
      await AsyncStorage.setItem("@biblegpt_onboarding_done", "true");
      router.replace("/(tabs)");
    } catch {
      await AsyncStorage.setItem("@biblegpt_onboarding_done", "true");
      router.replace("/(tabs)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BibleGPT</Text>
      <Text style={styles.subtitle}>Pick a reading plan to start your journey</Text>

      <FlatList
        data={PLANS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.base }}
        renderItem={({ item }) => {
          const selected = selectedPlan === item.id;
          return (
            <TouchableOpacity
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => setSelectedPlan(item.id)}
            >
              <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                {item.label}
              </Text>
              <Text style={[styles.cardDesc, selected && styles.cardDescSelected]}>
                {item.desc}
              </Text>
              {item.days > 0 && (
                <Text style={[styles.cardBadge, selected && styles.cardBadgeSelected]}>
                  {item.days} days
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.button, (!selectedPlan || loading) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selectedPlan || loading}
      >
        <Text style={styles.buttonText}>{loading ? "Setting up..." : "Get Started →"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingTop: spacing["4xl"] },
  title: { fontSize: typography["2xl"], fontWeight: "700", color: colors.text },
  subtitle: { fontSize: typography.base, color: colors.textSecondary, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.base,
    borderWidth: 1.5, borderColor: colors.border,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  cardTitle: { fontSize: typography.md, fontWeight: "600", color: colors.text },
  cardTitleSelected: { color: colors.primary },
  cardDesc: { fontSize: typography.sm, color: colors.textSecondary, marginTop: spacing.xs },
  cardDescSelected: { color: colors.primaryLight },
  cardBadge: { fontSize: typography.xs, color: colors.textTertiary, marginTop: spacing.xs },
  cardBadgeSelected: { color: colors.primaryLight },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: "center", marginBottom: spacing["2xl"],
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.textInverse, fontSize: typography.md, fontWeight: "700" },
});
