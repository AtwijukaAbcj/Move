import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

import { useAuth } from "./auth-context";

WebBrowser.maybeCompleteAuthSession();

const THEME = {
  primary: "#2A5F5D",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

const API_BASE = "http://192.168.1.31:8000";

// ✅ fix your API url (you pasted it twice)
const SITE_SETTINGS_URL = `${API_BASE}/api/corporate/site-setting/`;

// ✅ utility: ensure logo becomes a full URL
function resolveUrl(path?: string | null) {
  if (!path) return null;
  if (typeof path !== "string") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  // if backend returns "media/logo.png" without leading slash:
  return `${API_BASE}/${path}`;
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ site setting state
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string>("MOVE");
  const [siteSlogan, setSiteSlogan] = useState<string>("Your journey, simplified");
  const [logoFailed, setLogoFailed] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  // ✅ fetch site settings once
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(SITE_SETTINGS_URL);
        if (!res.ok) throw new Error("Failed to fetch site settings");
        const data = await res.json();

        // Your API may return an object OR a list. Handle both safely.
        const settings = Array.isArray(data) ? data?.[0] : data;

        const logoUrl =
          resolveUrl(settings?.logo) ||
          resolveUrl(settings?.site_logo) ||
          resolveUrl(settings?.logo_url);

        const name = settings?.site_name || settings?.name || "MOVE";
        const slogan = settings?.slogan || settings?.tagline || "Your journey, simplified";

        if (mounted) {
          setSiteLogo(logoUrl);
          setSiteName(name);
          setSiteSlogan(slogan);
        }
      } catch (e) {
        // keep defaults if API fails
        console.log("[SiteSettings] Error:", (e as any)?.message || e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Works in Expo (dev client + EAS + production)
  const redirectUri = AuthSession.makeRedirectUri({
    // scheme: "moveapp", // set this if you configured a custom scheme in app.json
    useProxy: true,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    redirectUri,
    scopes: ["profile", "email"],
    responseType: "token",
  });

  const onLogin = async () => {
    const e = email.trim();
    const p = password.trim();

    if (!e || !p) {
      Alert.alert("Missing fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/corporate/customer/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password: p }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      const token = data?.token || data?.access || data?.key;

      if (res.ok && (data?.id || token)) {
        await login(data);
        router.replace("/(tabs)/home");
        return;
      }

      Alert.alert(
        "Login failed",
        data?.error || data?.detail || data?.message || "Invalid credentials"
      );
    } catch (err: any) {
      Alert.alert("Login failed", err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await promptAsync({ useProxy: true });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      Alert.alert("Error", "Google Sign-In failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  // ✅ Handle Google response
  useEffect(() => {
    (async () => {
      try {
        if (response?.type !== "success") return;

        const accessToken =
          response?.authentication?.accessToken ||
          (response as any)?.params?.access_token;

        if (!accessToken) {
          Alert.alert("Google Sign-In failed", "Missing access token.");
          return;
        }

        const userInfoResponse = await fetch(
          "https://www.googleapis.com/userinfo/v2/me",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const userInfo = await userInfoResponse.json();

        if (!userInfo?.email) {
          Alert.alert("Google Sign-In failed", "Could not read Google profile.");
          return;
        }

        const res = await fetch(`${API_BASE}/api/corporate/customer/google-auth/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userInfo.email,
            name: userInfo.name,
            google_id: userInfo.id,
            picture: userInfo.picture,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          await login(data);
          router.replace("/(tabs)/home");
        } else {
          Alert.alert(
            "Google Sign-In failed",
            data?.error || data?.detail || "Could not sign in with Google"
          );
        }
      } catch (e: any) {
        console.error("Google Sign-In processing error:", e);
        Alert.alert("Error", "Google Sign-In failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, [response]);

  return (
    <LinearGradient colors={[THEME.primary, "#1a4442", "#0f2927"]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Branding (Logo from API) */}
          <View style={styles.brandCard}>
            <View style={styles.brandIcon}>
              {siteLogo && !logoFailed ? (
                <Image
                  source={{ uri: siteLogo }}
                  style={styles.brandLogoImg}
                  resizeMode="contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <Ionicons name="car-sport" size={42} color="#fff" />
              )}
            </View>

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandName}>{siteName || "MOVE"}</Text>
              <Text style={styles.brandTagline}>
                {siteSlogan || "Your journey, simplified"}
              </Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue</Text>

            {/* Email */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Ionicons name="mail-outline" size={20} color={THEME.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9AA4B2"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading && !googleLoading}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={THEME.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9AA4B2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading && !googleLoading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9AA4B2"
                />
              </Pressable>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => Alert.alert("Coming soon", "Password reset feature")}
              activeOpacity={0.7}
              disabled={loading || googleLoading}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onLogin}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={[styles.button, styles.googleButton, (!request || loading) && { opacity: 0.7 }]}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading || !request}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={THEME.primary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/register")}
                activeOpacity={0.7}
                disabled={loading || googleLoading}
              >
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>By continuing, you agree to our Terms & Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },

  // ✅ Brand card (same layout, just supports Image logo now)
  brandCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 40,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  brandIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  brandLogoImg: {
    width: "76%",
    height: "76%",
  },
  brandTextWrap: { flexDirection: "column" },
  brandName: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: 2 },
  brandTagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
    marginTop: 6,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: { fontSize: 28, fontWeight: "900", color: THEME.ink, marginBottom: 8 },
  cardSubtitle: { fontSize: 15, color: "#6B7280", fontWeight: "700", marginBottom: 28 },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  inputIconWrapper: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginRight: 8 },
  input: { flex: 1, fontSize: 16, fontWeight: "700", color: THEME.ink, paddingVertical: 16 },
  eyeButton: { padding: 8 },

  forgotButton: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { color: THEME.primary, fontSize: 14, fontWeight: "900" },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: { backgroundColor: THEME.aqua, marginBottom: 20 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.5 },

  divider: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 16, color: "#9AA4B2", fontSize: 13, fontWeight: "700" },

  googleButton: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E5E7EB", marginBottom: 24 },
  googleButtonText: { color: THEME.ink, fontSize: 16, fontWeight: "900" },

  registerContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  registerText: { color: "#6B7280", fontSize: 15, fontWeight: "700" },
  registerLink: { color: THEME.primary, fontSize: 15, fontWeight: "900" },

  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 32,
    lineHeight: 18,
  },
});
