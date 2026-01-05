import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { getToken } from "../utils/storage";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const API_BASE = "http://192.168.1.31:8000";

  const fetchProfile = async () => {
    try {
      const userId = await getToken("userId");
      if (!userId) {
        navigation.replace("Login");
        return;
      }

      const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/profile/`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setVehicleType(data.vehicle_type || "");
      }
    } catch (e) {
      console.log("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name is required");
      return;
    }

    setSaving(true);
    try {
      const userId = await getToken("userId");
      const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/profile/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          email: email,
          vehicle_type: vehicleType,
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Profile updated successfully");
        setEditing(false);
        fetchProfile();
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setEmail(profile?.email || "");
    setVehicleType(profile?.vehicle_type || "");
    setEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2f66ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
      <Text style={styles.title}>Driver Profile</Text>
      <Text style={styles.subtitle}>Manage your personal information</Text>

      {/* Profile Card */}
      <View style={styles.card}>
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: profile?.is_approved ? "#5EC6C6" : "#f9c404" }]} />
          <Text style={styles.statusText}>
            {profile?.is_approved ? "Verified Driver" : "Pending Approval"}
          </Text>
        </View>

        {/* Form Fields */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor="#5a6477"
          style={[styles.input, !editing && styles.inputDisabled]}
          editable={editing}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          placeholderTextColor="#5a6477"
          keyboardType="phone-pad"
          style={[styles.input, !editing && styles.inputDisabled]}
          editable={editing}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          placeholderTextColor="#5a6477"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, !editing && styles.inputDisabled]}
          editable={editing}
        />

        <Text style={styles.label}>Vehicle Type</Text>
        <TextInput
          value={vehicleType}
          onChangeText={setVehicleType}
          placeholder="e.g. Car, Motorcycle, Truck"
          placeholderTextColor="#5a6477"
          style={[styles.input, !editing && styles.inputDisabled]}
          editable={editing}
        />

        {/* Action Buttons */}
        {!editing ? (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditing(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={handleCancel}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Member Since</Text>
        <Text style={styles.infoValue}>
          {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : "N/A"}
        </Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate("DocumentUpload")}
        activeOpacity={0.85}
      >
        <Text style={styles.actionBtnText}>📄 Manage Documents</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate("Support")}
        activeOpacity={0.85}
      >
        <Text style={styles.actionBtnText}>💬 Contact Support</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.logoutBtn]}
        onPress={() => navigation.replace("Login")}
        activeOpacity={0.85}
      >
        <Text style={[styles.actionBtnText, styles.logoutText]}>🚪 Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b1220" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" },
  
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: "#aeb9cc", fontSize: 14, fontWeight: "600", marginBottom: 16 },

  card: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(94, 198, 198, 0.12)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(94, 198, 198, 0.25)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  statusText: {
    color: "#5EC6C6",
    fontWeight: "800",
    fontSize: 13,
  },

  label: {
    color: "#aeb9cc",
    fontWeight: "800",
    fontSize: 13,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f1627",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#24314d",
    fontWeight: "600",
  },
  inputDisabled: {
    opacity: 0.7,
    backgroundColor: "#0a0f1a",
  },

  editBtn: {
    marginTop: 18,
    backgroundColor: "#2f66ff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#2a3553",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: "#5EC6C6",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#0b1220",
    fontWeight: "900",
    fontSize: 15,
  },

  infoCard: {
    backgroundColor: "#121b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  infoLabel: {
    color: "#aeb9cc",
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 6,
  },
  infoValue: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 12,
  },

  actionBtn: {
    backgroundColor: "#121b2e",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  logoutBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderColor: "rgba(255, 59, 48, 0.25)",
  },
  logoutText: {
    color: "#ff3b30",
  },
});
