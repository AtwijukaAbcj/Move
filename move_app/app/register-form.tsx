import { useState } from "react";
import { useAuth } from "./auth-context";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME = {
  primary: "#2A5F5D",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://192.168.1.31:8000/api/corporate/customer/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email, phone, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.id) {
        const loginRes = await fetch("http://192.168.1.31:8000/api/corporate/customer/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
          await login(loginData);
          router.replace("/(tabs)/home");
        } else {
          Alert.alert("Registration succeeded, but login failed", loginData?.error || loginData?.detail || "Unknown error");
        }
      } else {
        // Handle different error formats
        let errorMessage = "Unknown error";
        if (data.error) {
          errorMessage = data.error;
        } else if (data.email) {
          errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.phone) {
          errorMessage = Array.isArray(data.phone) ? data.phone[0] : data.phone;
        } else if (data.full_name) {
          errorMessage = Array.isArray(data.full_name) ? data.full_name[0] : data.full_name;
        } else if (data.password) {
          errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
        }
        Alert.alert("Registration failed", errorMessage);
      }
    } catch (e) {
      Alert.alert("Registration failed", "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[THEME.primary, '#1a4442', '#0f2927']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                <Ionicons name="create-outline" size={42} color="#fff" />
              </View>
              <Text style={styles.brandName}>Create Account</Text>
              <Text style={styles.brandTagline}>Fill in your details to register</Text>
            </View>

            {/* Registration Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Register</Text>
              <Text style={styles.cardSubtitle}>Create your MOVE account</Text>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="person-outline" size={20} color={THEME.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9AA4B2"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              {/* Email Input */}
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
                  editable={!loading}
                />
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="call-outline" size={20} color={THEME.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#9AA4B2"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={THEME.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor="#9AA4B2"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9AA4B2"
                  />
                </Pressable>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Create Account</Text>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </>
                )}
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
              By creating an account, you agree to our{"\n"}
              Terms of Service & Privacy Policy
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
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
    marginBottom: 32,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  brandName: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
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
    marginBottom: 24,
  },
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
  inputIconWrapper: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: THEME.ink,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 8,
  },
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
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: THEME.aqua,
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
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
    marginTop: 24,
    lineHeight: 18,
  },
});
