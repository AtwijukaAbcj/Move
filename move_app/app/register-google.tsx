import { useState } from "react";
import { useAuth } from "./auth-context";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function RegisterGoogleScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  // This is a placeholder for Google OAuth logic
  // Replace with your actual Google sign-in implementation
  const onGoogleRegister = async () => {
    setLoading(true);
    try {
      // Simulate Google OAuth and get user info
      // Replace this with actual Google sign-in logic
      const googleUser = {
        email: "testuser@gmail.com",
        full_name: "Test User",
        google_id: "google123456"
      };
      // Call your backend Google auth endpoint
      const res = await fetch("http://192.168.1.31:8000/api/corporate/customer/google-auth/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googleUser),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await login(data);
        router.replace("/(tabs)");
      } else {
        Alert.alert("Google Auth Failed", data?.error || data?.detail || "Unknown error");
      }
    } catch (e) {
      Alert.alert("Google Auth Failed", "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Continue with Google</Text>
      <TouchableOpacity style={styles.button} onPress={onGoogleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in with Google</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  button: {
    backgroundColor: "#4285F4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    width: 240,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
