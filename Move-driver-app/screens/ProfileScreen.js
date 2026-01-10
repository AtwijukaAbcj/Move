import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { getToken, deleteToken } from "../utils/storage";

const API_BASE = "http://192.168.1.31:8000";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driver, setDriver] = useState({
    name: "",
    email: "",
    phone: "",
    vehicle_number: "",
    vehicle_type: "",
    status: "active",
    rating: 4.8,
    total_trips: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const driverId = await getToken("userId");
      const storedName = await getToken("driverName");
      const storedEmail = await getToken("driverEmail");
      const storedPhone = await getToken("driverPhone");
      const storedVehicle = await getToken("vehicleNumber");
      
      if (!driverId) {
        navigation.replace("Login");
        return;
      }
      const res = await fetch(`${API_BASE}/api/corporate/driver/${driverId}/`);
      if (res.ok) {
        const data = await res.json();
        setDriver({
          ...data,
          name: data.full_name || data.name || storedName || "",
          email: data.email || storedEmail || "",
          phone: data.phone || storedPhone || "",
          vehicle_number: data.vehicle_number || storedVehicle || "",
        });
      } else {
        // Use stored data if API fails
        setDriver(prev => ({ 
          ...prev, 
          name: storedName || prev.name,
          email: storedEmail || prev.email,
          phone: storedPhone || prev.phone,
          vehicle_number: storedVehicle || prev.vehicle_number,
        }));
      }
    } catch (e) {
      console.log("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const driverId = await getToken("userId");
      const res = await fetch(`${API_BASE}/api/corporate/driver/${driverId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: driver.name,
          phone: driver.phone,
          vehicle_number: driver.vehicle_number,
        }),
      });
      if (res.ok) {
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (e) {
      Alert.alert("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await deleteToken("userId");
          await deleteToken("driverName");
          navigation.replace("Login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#5EC6C6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Avatar Section */}
        <LinearGradient
          colors={['#1e3a5f', '#0a0f1a']}
          style={styles.avatarSection}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#5EC6C6', '#4BA8A8']}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                <FontAwesome5 name="user-alt" size={40} color="#5EC6C6" />
              </View>
            </LinearGradient>
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.85}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.driverName}>{driver.name || "Driver"}</Text>
          
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: driver.status === "active" ? "#10b981" : "#f59e0b" }
            ]} />
            <Text style={styles.statusText}>
              {driver.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#fbbf24" />
              <Text style={styles.statValue}>{driver.rating || "4.8"}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="car-sport" size={20} color="#60a5fa" />
              <Text style={styles.statValue}>{driver.total_trips || "0"}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={20} color="#a78bfa" />
              <Text style={styles.statValue}>2024</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Personal Info Section */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="person" size={16} color="#5EC6C6" />
            </View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.formCard}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={driver.name}
                  onChangeText={(val) => setDriver({ ...driver, name: val })}
                  placeholder="Your full name"
                  placeholderTextColor="#4b5563"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <Ionicons name="mail-outline" size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={driver.email}
                  editable={false}
                  placeholder="Email address"
                  placeholderTextColor="#4b5563"
                />
                <Ionicons name="lock-closed" size={14} color="#6b7280" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={driver.phone}
                  onChangeText={(val) => setDriver({ ...driver, phone: val })}
                  placeholder="Phone number"
                  placeholderTextColor="#4b5563"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </LinearGradient>

          {/* Vehicle Info Section */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Ionicons name="car" size={16} color="#fbbf24" />
            </View>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
          </View>

          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.formCard}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <MaterialCommunityIcons name="car-side" size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={driver.vehicle_type || "Standard"}
                  editable={false}
                  placeholder="Vehicle type"
                  placeholderTextColor="#4b5563"
                />
                <Ionicons name="lock-closed" size={14} color="#6b7280" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={18} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  value={driver.vehicle_number}
                  onChangeText={(val) => setDriver({ ...driver, vehicle_number: val })}
                  placeholder="License plate number"
                  placeholderTextColor="#4b5563"
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
              <Ionicons name="flash" size={16} color="#60a5fa" />
            </View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.85}>
              <LinearGradient
                colors={['#1a2744', '#0f1a2e']}
                style={styles.actionCardGradient}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                  <Ionicons name="document" size={22} color="#a78bfa" />
                </View>
                <Text style={styles.actionText}>Documents</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} activeOpacity={0.85}>
              <LinearGradient
                colors={['#1a2744', '#0f1a2e']}
                style={styles.actionCardGradient}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#10b981" />
                </View>
                <Text style={styles.actionText}>Verification</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Settings")}
            >
              <LinearGradient
                colors={['#1a2744', '#0f1a2e']}
                style={styles.actionCardGradient}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                  <Ionicons name="settings" size={22} color="#fbbf24" />
                </View>
                <Text style={styles.actionText}>Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={saving ? ['#4a5568', '#2d3748'] : ['#5EC6C6', '#4BA8A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save" size={18} color="#0a0f1a" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0f1a" },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0a0f1a",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#5EC6C6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatarInner: {
    flex: 1,
    borderRadius: 51,
    backgroundColor: '#0a0f1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#5EC6C6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0a0f1a",
  },
  driverName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: "#10b981",
    fontWeight: "700",
    fontSize: 13,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  content: {
    padding: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(94, 198, 198, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },

  formCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inputDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: "600",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionCardGradient: {
    alignItems: "center",
    paddingVertical: 18,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  saveBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
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
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  saveBtnText: {
    color: "#0a0f1a",
    fontWeight: "900",
    fontSize: 16,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    gap: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "800",
    fontSize: 15,
  },
});
