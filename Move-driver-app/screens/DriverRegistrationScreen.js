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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function DriverRegistrationScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpMethod, setOtpMethod] = useState("phone");
  const [showPassword, setShowPassword] = useState(false);

  const onRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }
    
    if (otpMethod === "email" && !email.trim()) {
      Alert.alert("Missing info", "Please enter your email to receive OTP.");
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
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          vehicle_type: vehicleType,
          password,
          otp_method: otpMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        navigation.navigate("OtpVerification", { phone, email, otpMethod });
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#5EC6C6', '#3BA3A3']}
              style={styles.logo}
            >
              <MaterialCommunityIcons name="car-connected" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Join Move Driver</Text>
          <Text style={styles.subtitle}>Start earning on your schedule</Text>
        </View>

        {/* Registration Card */}
        <LinearGradient
          colors={['#1a2744', '#0f1a2e']}
          style={styles.card}
        >
          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={20} color="#6b7280" />
            </View>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
          </View>

          {/* OTP Method Selector */}
          <Text style={styles.label}>Receive OTP via</Text>
          <View style={styles.otpMethodContainer}>
            <TouchableOpacity
              style={[styles.otpMethodButton, otpMethod === "phone" && styles.otpMethodActive]}
              onPress={() => setOtpMethod("phone")}
              activeOpacity={0.85}
            >
              {otpMethod === "phone" ? (
                <LinearGradient
                  colors={['#5EC6C6', '#4BA8A8']}
                  style={styles.otpMethodGradient}
                >
                  <Ionicons name="phone-portrait" size={18} color="#0a0f1a" />
                  <Text style={styles.otpMethodTextActive}>Phone</Text>
                </LinearGradient>
              ) : (
                <View style={styles.otpMethodInner}>
                  <Ionicons name="phone-portrait-outline" size={18} color="#6b7280" />
                  <Text style={styles.otpMethodText}>Phone</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.otpMethodButton, otpMethod === "email" && styles.otpMethodActive]}
              onPress={() => setOtpMethod("email")}
              activeOpacity={0.85}
            >
              {otpMethod === "email" ? (
                <LinearGradient
                  colors={['#5EC6C6', '#4BA8A8']}
                  style={styles.otpMethodGradient}
                >
                  <Ionicons name="mail" size={18} color="#0a0f1a" />
                  <Text style={styles.otpMethodTextActive}>Email</Text>
                </LinearGradient>
              ) : (
                <View style={styles.otpMethodInner}>
                  <Ionicons name="mail-outline" size={18} color="#6b7280" />
                  <Text style={styles.otpMethodText}>Email</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="call-outline" size={20} color="#6b7280" />
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>
            Email {otpMethod === "email" ? "(Required)" : "(Optional)"}
          </Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" />
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="john@email.com"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          {/* Vehicle Type */}
          <Text style={styles.label}>Vehicle Type (Optional)</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="car-outline" size={20} color="#6b7280" />
            </View>
            <TextInput
              value={vehicleType}
              onChangeText={setVehicleType}
              placeholder="Car, Motorcycle, Truck"
              placeholderTextColor="#6b7280"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcceptTerms((prev) => !prev)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxOn]}>
              {acceptTerms && <Ionicons name="checkmark" size={14} color="#0a0f1a" />}
            </View>
            <Text style={styles.checkboxText}>
              I accept the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={onRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? ['#4a5568', '#2d3748'] : ['#5EC6C6', '#4BA8A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.registerBtnText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0a0f1a" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0a0f1a" 
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: '#5EC6C6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  title: { 
    color: "#fff", 
    fontSize: 26, 
    fontWeight: "900",
    marginBottom: 4,
  },
  subtitle: { 
    color: "#6b7280", 
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  label: { 
    color: "#9ca3af", 
    marginTop: 16, 
    marginBottom: 8, 
    fontSize: 13,
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  otpMethodContainer: {
    flexDirection: "row",
    gap: 12,
  },
  otpMethodButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  otpMethodGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  otpMethodInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  otpMethodText: {
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 14,
  },
  otpMethodTextActive: {
    color: "#0a0f1a",
    fontWeight: "800",
    fontSize: 14,
  },
  checkboxRow: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    marginTop: 20,
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    marginRight: 12,
    marginTop: 2,
    backgroundColor: "transparent",
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: { 
    backgroundColor: "#5EC6C6", 
    borderColor: "#5EC6C6" 
  },
  checkboxText: { 
    color: "#9ca3af",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  linkText: {
    color: "#5EC6C6",
    fontWeight: "700",
  },
  registerBtn: {
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: '#5EC6C6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  registerBtnDisabled: { 
    opacity: 0.7 
  },
  registerBtnGradient: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerBtnText: { 
    color: "#0a0f1a", 
    fontWeight: "900",
    fontSize: 16,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  loginBold: {
    color: "#5EC6C6",
    fontWeight: "800",
  },
});
