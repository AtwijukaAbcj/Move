import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";

export default function OtpVerificationScreen({ route, navigation }) {
  const phone = route?.params?.phone || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const onVerify = async () => {
    if (otp.trim().length < 4) {
      Alert.alert("Invalid OTP", "Enter the code sent to your phone.");
      return;
    }

    try {
      setLoading(true);

      // TODO: Replace with your API call
      // await apiVerifyOtp({ phone, otp });

      navigation.replace("Dashboard");
    } catch (e) {
      Alert.alert("Verification failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    Alert.alert("OTP sent", `A new code was sent to ${phone || "your phone"}.`);
    // TODO: Call resend OTP API
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify Phone</Text>
        <Text style={styles.subtitle}>
          Enter the OTP sent to <Text style={styles.bold}>{phone || "your number"}</Text>
        </Text>

        <TextInput
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter OTP"
          keyboardType="number-pad"
          style={styles.input}
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={onVerify}
          disabled={loading} // ✅ boolean
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onResend} style={styles.linkWrap}>
          <Text style={styles.link}>Resend code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, justifyContent: "center", backgroundColor: "#0b1220" },
  card: { backgroundColor: "#121b2e", borderRadius: 16, padding: 18 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#b9c2d1", marginTop: 6, marginBottom: 14 },
  bold: { color: "#fff", fontWeight: "700" },
  input: {
    backgroundColor: "#0f1627",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#24314d",
    fontSize: 16,
    letterSpacing: 2,
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
});
