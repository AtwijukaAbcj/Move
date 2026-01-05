import * as React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from "./auth-context";

WebBrowser.maybeCompleteAuthSession();

const THEME = {
  primary: "#2A5F5D",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

export default function RegisterOptionsScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { authentication } = result;
        
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${authentication?.accessToken}` },
          }
        );
        
        const userInfo = await userInfoResponse.json();
        
        const res = await fetch("http://192.168.1.31:8000/api/corporate/customer/google-auth/", {
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
        }
      }
    } catch (error) {
      console.error('Google Sign-Up Error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[THEME.primary, '#1a4442', '#0f2927']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add" size={48} color="#fff" />
            </View>
            <Text style={styles.brandName}>Join MOVE</Text>
            <Text style={styles.brandTagline}>Create your account to get started</Text>
          </View>

          {/* Registration Options Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign Up</Text>
            <Text style={styles.cardSubtitle}>Choose your registration method</Text>

            {/* Email Registration */}
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => router.push("/register-form")}
              activeOpacity={0.85}
            >
              <Ionicons name="mail-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>Sign up with Email</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity 
              style={[styles.button, styles.googleButton]} 
              onPress={handleGoogleSignUp}
              disabled={googleLoading || !request}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-google" size={22} color="#DB4437" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/login")}
                activeOpacity={0.7}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            By signing up, you agree to our{"\n"}
            Terms of Service & Privacy Policy
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brandName: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
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
  cardTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: THEME.ink,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "700",
    marginBottom: 28,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: THEME.aqua,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
    flex: 1,
    textAlign: "center",
    marginRight: -32,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "700",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  googleButtonText: {
    color: THEME.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "700",
  },
  loginLink: {
    color: THEME.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 32,
    lineHeight: 18,
  },
});
