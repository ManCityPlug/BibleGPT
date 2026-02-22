import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { subscriptionApi } from "@/lib/api";
import { colors } from "@/constants/theme";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

function isAccessGranted(status: string | null): boolean {
  return status === "trialing" || status === "active";
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const paywallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    const inAuthGroup   = segments[0] === "(auth)";
    const inOnboarding  = segments[0] === "(onboarding)";
    const inPayment     = segments[0] === "payment";

    if (!session) {
      if (!inAuthGroup) router.replace("/(auth)/login");
      return;
    }

    AsyncStorage.getItem("@biblegpt_onboarding_done").then(async (done) => {
      if (!done) {
        if (!inOnboarding) router.replace("/(onboarding)");
        return;
      }

      const cachedStatus = await AsyncStorage.getItem("@biblegpt_subscription_status");
      if (isAccessGranted(cachedStatus)) {
        if (inAuthGroup || inOnboarding || inPayment) router.replace("/(tabs)");
        return;
      }

      try {
        const { status } = await subscriptionApi.status();
        if (isAccessGranted(status)) {
          await AsyncStorage.setItem("@biblegpt_subscription_status", status ?? "");
          if (inAuthGroup || inOnboarding || inPayment) router.replace("/(tabs)");
          return;
        }

        if (!inPayment) {
          const paywallShown = await AsyncStorage.getItem("@biblegpt_paywall_shown");
          if (!paywallShown) {
            if (inAuthGroup || inOnboarding) router.replace("/(tabs)");
            paywallTimerRef.current = setTimeout(async () => {
              await AsyncStorage.setItem("@biblegpt_paywall_shown", "true");
              router.replace("/payment" as never);
            }, 10000);
          } else {
            router.replace("/payment" as never);
          }
        }
      } catch {
        if (inAuthGroup || inOnboarding) router.replace("/(tabs)");
      }
    });

    return () => {
      if (paywallTimerRef.current) clearTimeout(paywallTimerRef.current);
    };
  }, [session, segments]);

  if (session === undefined) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </GestureHandlerRootView>
  );
}
