import React, { useState } from "react";
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
} from "react-native";

export default function DriverRegistrationScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }
    if (!acceptTerms) {
      Alert.alert("Terms required", "Please accept Terms & Privacy Policy.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://192.168.1.31:8000/api/corporate/driver/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          vehicle_type: vehicleType,
          password,
          otp_method: "phone", // or "email" if you add a toggle
        }),
      });
      const data = await res.json();
      if (res.ok) {
        navigation.navigate("OtpVerification", { phone, email });
      } else {
        Alert.alert("Registration failed", data.error || JSON.stringify(data));
      }
    } catch (e) {
      Alert.alert("Registration failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Driver Account</Text>
        <Text style={styles.subtitle}>Register first, upload documents after login.</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="e.g. John Doe"
          style={styles.input}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. +256 7xx xxx xxx"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. john@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <Text style={styles.label}>Vehicle Type (optional)</Text>
        <TextInput
          value={vehicleType}
          onChangeText={setVehicleType}
          placeholder="Car / Motorcycle / Truck"
          style={styles.input}
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Create password"
          secureTextEntry={true} // ✅ boolean
          style={styles.input}
        />

        {/* simple checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAcceptTerms((prev) => !prev)}
          activeOpacity={0.85}
        >
          <View style={[styles.checkbox, acceptTerms ? styles.checkboxOn : null]} />
          <Text style={styles.checkboxText}>I accept Terms & Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={onRegister}
          disabled={loading} // ✅ boolean
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, justifyContent: "center", backgroundColor: "#0b1220" },
  card: { backgroundColor: "#121b2e", borderRadius: 16, padding: 18 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#b9c2d1", marginTop: 6, marginBottom: 14 },
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
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#3a4a72",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  checkboxOn: { backgroundColor: "#2f66ff", borderColor: "#2f66ff" },
  checkboxText: { color: "#b9c2d1" },
  button: {
    marginTop: 16,
    backgroundColor: "#2f66ff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
