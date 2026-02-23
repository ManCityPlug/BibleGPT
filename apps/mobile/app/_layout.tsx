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
  // routeReady stays false until we've fully resolved routing on first load
  const [routeReady, setRouteReady] = useState(false);
  const paywallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeResolvedRef = useRef(false);

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
      setRouteReady(true);
      routeResolvedRef.current = true;
      return;
    }

    AsyncStorage.getItem("@biblegpt_onboarding_done").then(async (done) => {
      if (!done) {
        if (!inOnboarding) router.replace("/(onboarding)");
        setRouteReady(true);
        routeResolvedRef.current = true;
        return;
      }

      const cachedStatus = await AsyncStorage.getItem("@biblegpt_subscription_status");
      if (isAccessGranted(cachedStatus)) {
        if (inAuthGroup || inOnboarding || inPayment) router.replace("/(tabs)");
        setRouteReady(true);
        routeResolvedRef.current = true;
        return;
      }

      try {
        const { status } = await subscriptionApi.status();
        if (isAccessGranted(status)) {
          await AsyncStorage.setItem("@biblegpt_subscription_status", status ?? "");
          if (inAuthGroup || inOnboarding || inPayment) router.replace("/(tabs)");
          setRouteReady(true);
          routeResolvedRef.current = true;
          return;
        }

        if (!inPayment) {
          const paywallShown = await AsyncStorage.getItem("@biblegpt_paywall_shown");
          if (!paywallShown) {
            if (inAuthGroup || inOnboarding) router.replace("/(tabs)");
            setRouteReady(true);
            routeResolvedRef.current = true;
            paywallTimerRef.current = setTimeout(async () => {
              await AsyncStorage.setItem("@biblegpt_paywall_shown", "true");
              router.replace("/payment" as never);
            }, 10000);
          } else {
            router.replace("/payment" as never);
            setRouteReady(true);
            routeResolvedRef.current = true;
          }
        } else {
          setRouteReady(true);
          routeResolvedRef.current = true;
        }
      } catch {
        if (inAuthGroup || inOnboarding) router.replace("/(tabs)");
        setRouteReady(true);
        routeResolvedRef.current = true;
      }
    });

    return () => {
      if (paywallTimerRef.current) clearTimeout(paywallTimerRef.current);
    };
  // Only re-run when session changes, NOT on segment changes after first resolve
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Show spinner until session is known AND routing is resolved
  if (session === undefined || !routeReady) {
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
