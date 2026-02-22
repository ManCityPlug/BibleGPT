import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/lib/api";
import { colors, spacing, typography, radius } from "@/constants/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) { Alert.alert("Error", "Email and password required"); return; }
    if (password.length < 8) { Alert.alert("Error", "Password must be at least 8 characters"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;

      // Create DB user record
      await authApi.register(referralCode || undefined);
      await AsyncStorage.removeItem("@biblegpt_onboarding_done");

      router.replace("/(onboarding)");
    } catch (err) {
      Alert.alert("Registration Failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>✝ BibleGPT</Text>
        <Text style={styles.tagline}>Start your 7-day free trial</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Name (optional)</Text>
          <TextInput
            style={styles.input} value={name} onChangeText={setName}
            placeholder="Your name" placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={colors.textTertiary}
            keyboardType="email-address" autoCapitalize="none" autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input} value={password} onChangeText={setPassword}
            placeholder="Min. 8 characters" placeholderTextColor={colors.textTertiary}
            secureTextEntry
          />

          <Text style={styles.label}>Referral Code (optional)</Text>
          <TextInput
            style={styles.input} value={referralCode} onChangeText={setReferralCode}
            placeholder="e.g. AB12CD34" placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
          />

          <View style={styles.trialBadge}>
            <Text style={styles.trialText}>✓ 7-day free trial — no charge until trial ends</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing["2xl"], paddingVertical: spacing["4xl"] },
  logo: { fontSize: typography["3xl"], fontWeight: "700", color: colors.primary, textAlign: "center" },
  tagline: { fontSize: typography.base, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing["2xl"] },
  form: { gap: spacing.md },
  label: { fontSize: typography.sm, fontWeight: "600", color: colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: typography.base, color: colors.text, backgroundColor: colors.white,
  },
  trialBadge: {
    backgroundColor: colors.goldBg, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.gold,
  },
  trialText: { color: colors.text, fontSize: typography.sm, fontWeight: "600", textAlign: "center" },
  button: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverse, fontSize: typography.md, fontWeight: "700" },
  link: { textAlign: "center", color: colors.textSecondary, fontSize: typography.sm, marginTop: spacing.sm },
  linkBold: { color: colors.primary, fontWeight: "600" },
});
