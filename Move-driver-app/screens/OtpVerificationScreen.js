import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";


export default function OtpVerificationScreen({ route, navigation }) {
  const phone = route?.params?.phone || "";
  const email = route?.params?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [useEmail, setUseEmail] = useState(!!email);

  const onVerify = async () => {
    if (otp.trim().length < 4) {
      Alert.alert("Invalid OTP", `Enter the code sent to your ${useEmail ? 'email' : 'phone'}.`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://192.168.1.31:8000/api/corporate/driver/verify-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(useEmail ? { email } : { phone }),
          otp_code: otp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        navigation.replace("Dashboard");
      } else {
        Alert.alert("Verification failed", data.error || "Please try again.");
      }
    } catch (e) {
      Alert.alert("Verification failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    try {
      const res = await fetch("http://192.168.1.31:8000/api/corporate/driver/resend-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(useEmail ? { email } : { phone }),
        }),
      });
      if (res.ok) {
        Alert.alert("OTP sent", `A new code was sent to ${useEmail ? email : phone}.`);
      } else {
        Alert.alert("Error", "Failed to resend OTP. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Verify {useEmail ? 'Email' : 'Phone'}</Text>
          <Text style={styles.subtitle}>
            Enter the OTP sent to <Text style={styles.bold}>{useEmail ? email : phone || "your contact"}</Text>
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
            {email ? (
              <TouchableOpacity onPress={() => setUseEmail(false)} style={{ marginRight: 10 }}>
                <Text style={{ color: useEmail ? '#b9c2d1' : '#2f66ff', fontWeight: useEmail ? '400' : '700' }}>Phone</Text>
              </TouchableOpacity>
            ) : null}
            {email ? (
              <TouchableOpacity onPress={() => setUseEmail(true)}>
                <Text style={{ color: useEmail ? '#2f66ff' : '#b9c2d1', fontWeight: useEmail ? '700' : '400' }}>Email</Text>
              </TouchableOpacity>
            ) : null}
          </View>

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
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Verify</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onResend} style={styles.linkWrap}>
            <Text style={styles.link}>Resend code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
