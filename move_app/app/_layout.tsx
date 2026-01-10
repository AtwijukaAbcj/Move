import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "react-native-get-random-values";

import { useColorScheme } from "@/hooks/useColorScheme";
import Layout from "@/components/Layout";
import { AuthProvider, useAuth } from "./auth-context"; // ✅ updated path
import RideTrackingScreen from "../screens/RideTrackingScreen";

SplashScreen.preventAutoHideAsync();

function MainStack() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded || loading) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="login" options={{ title: "Login" }} />
            <Stack.Screen name="register" options={{ title: "Register" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="map" />
            <Stack.Screen name="chat" options={{ title: "Chat" }} />
            <Stack.Screen name="ride-tracking" options={{ title: "Track Ride" }} />
            <Stack.Screen name="+not-found" />
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Layout>
        <MainStack />
      </Layout>
    </AuthProvider>
  );
}
