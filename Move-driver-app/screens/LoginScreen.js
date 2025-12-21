import React, { useState } from "react";
import { saveToken } from '../utils/storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!phoneOrEmail.trim() || !password.trim()) {
      Alert.alert("Missing info", "Enter your login details.");
      return;
    }

    let loginPayload = { password };
    if (phoneOrEmail.match(/^[0-9+]+$/)) {
      loginPayload.phone = phoneOrEmail;
    } else if (phoneOrEmail.includes("@")) {
      loginPayload.email = phoneOrEmail;
    } else {
      Alert.alert("Invalid input", "Enter a valid phone number or email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://192.168.1.31:8000/api/corporate/driver/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        await saveToken('userId', String(data.id));
        navigation.replace("Dashboard");
      } else if (res.status === 403 && data.error === 'OTP not verified') {
        // Redirect to OTP verification screen with phone/email
        navigation.navigate("OtpVerification", { phone: data.phone, email: data.email });
      } else {
        Alert.alert("Login failed", data.error || "Try again.");
      }
    } catch (e) {
      Alert.alert("Login failed", "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Driver Login</Text>

        <Text style={styles.label}>Phone or Email</Text>
        <TextInput
          value={phoneOrEmail}
          onChangeText={setPhoneOrEmail}
          placeholder="Phone / Email"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={true} // ✅ boolean
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={onLogin}
          disabled={loading} // ✅ boolean
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
          <Text style={styles.link}>
            Don’t have an account? <Text style={styles.linkBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 18, backgroundColor: "#0b1220" },
  card: { backgroundColor: "#121b2e", borderRadius: 16, padding: 18 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 14 },
  label: { color: "#b9c2d1", marginTop: 10, marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: "#0f1627",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#24314d",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#2f66ff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
  linkWrap: { marginTop: 14, alignItems: "center" },
  link: { color: "#b9c2d1" },
  linkBold: { color: "#fff", fontWeight: "700" },
});
