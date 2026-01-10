import React, { useState } from "react";
import * as Notifications from 'expo-notifications';
import { saveToken } from '../utils/storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen({ navigation }) {
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        if (data.full_name) {
          await saveToken('driverName', data.full_name);
        }
        if (data.email) {
          await saveToken('driverEmail', data.email);
        }
        if (data.phone) {
          await saveToken('driverPhone', data.phone);
        }
        if (data.vehicle_number) {
          await saveToken('vehicleNumber', data.vehicle_number);
        }
        // Register and send Expo push token to backend
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus === 'granted') {
            const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
            await fetch(`http://192.168.1.31:8000/api/corporate/driver/${data.id}/save-push-token/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ expo_push_token: expoPushToken }),
            });
          }
        } catch (e) {
          console.log('Failed to register push token:', e);
        }
        navigation.replace("DashboardMain");
      } else if (res.status === 403 && data.error === 'OTP not verified') {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={['#5EC6C6', '#3BA3A3']}
            style={styles.logoContainer}
          >
            <MaterialCommunityIcons name="car-connected" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandName}>Move Driver</Text>
          <Text style={styles.brandTagline}>Start earning on your schedule</Text>
        </View>

        {/* Login Card */}
        <LinearGradient
          colors={['#1a2744', '#0f1a2e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue driving</Text>

          {/* Phone/Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={20} color="#6b7280" />
            </View>
            <TextInput
              value={phoneOrEmail}
              onChangeText={setPhoneOrEmail}
              placeholder="Phone or Email"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
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

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={onLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? ['#4a5568', '#2d3748'] : ['#5EC6C6', '#4BA8A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#0a0f1a" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <TouchableOpacity 
            style={styles.registerBtn}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.85}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerBold}>Register</Text>
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
    justifyContent: "center",
    padding: 24,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
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
  brandName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
  },
  brandTagline: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderRadius: 24,
    padding: 28,
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
  title: { 
    color: "#fff", 
    fontSize: 26, 
    fontWeight: "900", 
    marginBottom: 6 
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: "#5EC6C6",
    fontSize: 13,
    fontWeight: "700",
  },
  loginBtn: {
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
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnGradient: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: "#0a0f1a",
    fontSize: 16,
    fontWeight: "900",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  registerBtn: {
    alignItems: "center",
  },
  registerText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  registerBold: {
    color: "#5EC6C6",
    fontWeight: "800",
  },
});
