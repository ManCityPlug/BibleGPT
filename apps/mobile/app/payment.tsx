import { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { subscriptionApi } from "@/lib/api";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

const MONTHLY_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_MONTHLY ?? "price_monthly";
const YEARLY_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_YEARLY ?? "price_yearly";

export default function PaymentScreen() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const priceId = selectedPlan === "monthly" ? MONTHLY_PRICE_ID : YEARLY_PRICE_ID;
      const { setupIntentClientSecret, customerId } = await subscriptionApi.create(priceId);

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "BibleGPT Pro",
        customerId,
        setupIntentClientSecret,
        allowsDelayedPaymentMethods: false,
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") {
          throw new Error(presentError.message);
        }
        return;
      }

      await AsyncStorage.setItem("@biblegpt_subscription_status", "trialing");
      Alert.alert("Welcome!", "Your 7-day free trial has started. Enjoy BibleGPT Pro!", [
        { text: "Start Reading", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const FEATURES = [
    "Unlimited AI Bible conversations",
    "Full Bible reader with notes & highlights",
    "Community groups & prayer sharing",
    "Reading plans & daily devotionals",
    "Direct messaging with friends",
    "Streak tracking & progress insights",
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>BibleGPT Pro</Text>
        <Text style={styles.subtitle}>Deepen your faith with AI-powered Bible study</Text>
      </View>

      <View style={styles.trialBadge}>
        <Text style={styles.trialText}>✨ 7-Day Free Trial — No charge until trial ends</Text>
      </View>

      {/* Plan selector */}
      <View style={styles.plans}>
        <TouchableOpacity
          style={[styles.plan, selectedPlan === "yearly" && styles.planSelected]}
          onPress={() => setSelectedPlan("yearly")}
        >
          <View style={styles.planHeader}>
            <Text style={[styles.planName, selectedPlan === "yearly" && styles.planNameSelected]}>Yearly</Text>
            <View style={styles.saveBadge}><Text style={styles.saveText}>Save 37%</Text></View>
          </View>
          <Text style={[styles.planPrice, selectedPlan === "yearly" && styles.planPriceSelected]}>$59.99<Text style={styles.planPer}>/year</Text></Text>
          <Text style={[styles.planNote, selectedPlan === "yearly" && styles.planNoteSelected]}>$5.00/month</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.plan, selectedPlan === "monthly" && styles.planSelected]}
          onPress={() => setSelectedPlan("monthly")}
        >
          <Text style={[styles.planName, selectedPlan === "monthly" && styles.planNameSelected]}>Monthly</Text>
          <Text style={[styles.planPrice, selectedPlan === "monthly" && styles.planPriceSelected]}>$7.99<Text style={styles.planPer}>/month</Text></Text>
          <Text style={[styles.planNote, selectedPlan === "monthly" && styles.planNoteSelected]}>Cancel anytime</Text>
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
        onPress={handleSubscribe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.subscribeBtnText}>Start Free Trial →</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.legal}>
        After the 7-day trial, you'll be charged {selectedPlan === "monthly" ? "$7.99/month" : "$59.99/year"}.
        Cancel anytime in your profile.
      </Text>

      <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
        <Text style={styles.skipLink}>Maybe later — explore limited features</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing["4xl"], paddingBottom: spacing["4xl"] },
  header: { marginBottom: spacing.xl },
  title: { fontSize: typography["3xl"], fontWeight: "800", color: colors.text },
  subtitle: { fontSize: typography.base, color: colors.textSecondary, marginTop: spacing.sm },
  trialBadge: { backgroundColor: colors.goldBg, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.gold, alignItems: "center" },
  trialText: { color: colors.text, fontWeight: "700", fontSize: typography.sm },
  plans: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  plan: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, borderWidth: 2, borderColor: colors.border, ...shadows.sm },
  planSelected: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  planHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  planName: { fontSize: typography.md, fontWeight: "700", color: colors.text },
  planNameSelected: { color: colors.primary },
  saveBadge: { backgroundColor: colors.gold, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  saveText: { color: colors.textInverse, fontSize: typography.xs, fontWeight: "700" },
  planPrice: { fontSize: typography["2xl"], fontWeight: "800", color: colors.text },
  planPriceSelected: { color: colors.primary },
  planPer: { fontSize: typography.sm, fontWeight: "400" },
  planNote: { fontSize: typography.xs, color: colors.textTertiary, marginTop: spacing.xs },
  planNoteSelected: { color: colors.primaryLight },
  features: { marginBottom: spacing.xl, gap: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  featureCheck: { color: colors.success, fontWeight: "700", fontSize: typography.md, width: 20 },
  featureText: { fontSize: typography.base, color: colors.text },
  subscribeBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: spacing.lg, alignItems: "center", marginBottom: spacing.base },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { color: colors.textInverse, fontSize: typography.lg, fontWeight: "800" },
  legal: { fontSize: typography.xs, color: colors.textTertiary, textAlign: "center", marginBottom: spacing.md, lineHeight: typography.xs * 1.6 },
  skipLink: { textAlign: "center", color: colors.textSecondary, fontSize: typography.sm, textDecorationLine: "underline" },
});
