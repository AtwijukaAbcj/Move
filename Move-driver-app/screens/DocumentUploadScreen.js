import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { getToken, saveToken } from "../utils/storage";

// Helper component (MUST be outside the screen component)
function DocPicker({ label, value, onPick }) {
  return (
    <TouchableOpacity 
      style={styles.docItem} 
      onPress={onPick} 
      activeOpacity={0.85}
    >
      <View style={styles.docLeft}>
        <View style={[styles.docIcon, value && styles.docIconUploaded]}>
          <Ionicons 
            name={value ? "document-text" : "document-outline"} 
            size={20} 
            color={value ? "#10b981" : "#6b7280"} 
          />
        </View>
        <View>
          <Text style={styles.docLabel}>{label}</Text>
          {value ? (
            <Text style={styles.docFileName} numberOfLines={1}>
              {value.name || "File selected"}
            </Text>
          ) : (
            <Text style={styles.docHint}>Tap to upload</Text>
          )}
        </View>
      </View>
      <Ionicons 
        name={value ? "checkmark-circle" : "add-circle-outline"} 
        size={24} 
        color={value ? "#10b981" : "#5EC6C6"} 
      />
    </TouchableOpacity>
  );
}

export default function DocumentUploadScreen({ navigation }) {
  const [docs, setDocs] = useState({
    drivers_license: null,
    car_ownership: null,
    car_image_1: null,
    car_image_2: null,
    inspection_report: null,
  });
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Load userId ONCE when screen mounts
  useEffect(() => {
    (async () => {
      try {
        const storedUserId = await getToken("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } finally {
        setTokenLoading(false);
      }
    })();
  }, []);

  const pickDocument = async (field, type = "*/*") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type,
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const maxBytes = 10 * 1024 * 1024;
      if (typeof asset.size === "number" && asset.size > maxBytes) {
        Alert.alert("File too large", "Please select a file under 10MB.");
        return;
      }

      setDocs((prev) => ({ ...prev, [field]: asset }));
    } catch (e) {
      Alert.alert("Picker error", "Could not open document picker.");
    }
  };

  const uploadAll = async () => {
    if (tokenLoading) {
      Alert.alert("Please wait", "Loading your session...");
      return;
    }

    if (!userId) {
      Alert.alert("Not logged in", "Missing user ID. Please log in again.");
      return;
    }

    // Required docs check
    const missing = Object.entries(docs)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (missing.length > 0) {
      Alert.alert("Missing documents", "Please upload all required documents.");
      return;
    }

    if (!vehicleNumber.trim()) {
      Alert.alert("Vehicle Number Required", "Please enter your vehicle number plate.");
      return;
    }

    setUploading(true);

    try {
      // First, update vehicle number
      const vehicleRes = await fetch(
        `http://192.168.1.31:8000/api/corporate/driver/${userId}/update-vehicle/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicle_number: vehicleNumber.trim().toUpperCase() }),
        }
      );
      
      if (vehicleRes.ok) {
        await saveToken('vehicleNumber', vehicleNumber.trim().toUpperCase());
      }

      // Upload each document individually
      for (const [key, asset] of Object.entries(docs)) {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("document_type", key);
        formData.append("file", {
          uri: asset.uri,
          name: asset.name || `${key}-${Date.now()}`,
          type: asset.mimeType || "application/octet-stream",
        });

        const res = await fetch(
          "http://192.168.1.31:8000/api/corporate/driver/upload-document/",
          {
            method: "POST",
            body: formData,
          }
        );

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }

        if (!res.ok) {
          Alert.alert(
            "Upload failed",
            data?.detail || data?.error || data?.message || `Failed to upload ${key}`
          );
          setUploading(false);
          return;
        }
      }
      Alert.alert("Success", "Documents uploaded successfully!");
      setSubmitted(true); // <-- NEW
      // navigation.replace("Dashboard"); // Don't navigate away
    } catch (e) {
      Alert.alert("Upload failed", "Network/server error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Document Verification</Text>
            <Text style={styles.subtitle}>Upload your documents to start driving</Text>
          </View>

          {submitted ? (
            <LinearGradient
              colors={['#1a2744', '#0f1a2e']}
              style={styles.card}
            >
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={60} color="#10b981" />
              </View>
              <Text style={styles.successTitle}>Documents Submitted</Text>
              <Text style={styles.successText}>
                Your documents are under review. Please wait for admin approval.
              </Text>
              
              <View style={styles.vehicleInfo}>
                <Ionicons name="car" size={20} color="#5EC6C6" />
                <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
              </View>

              <View style={styles.submittedDocs}>
                <Text style={styles.submittedLabel}>Submitted Documents:</Text>
                {Object.entries(docs).map(([key, value]) => value && (
                  <View key={key} style={styles.submittedItem}>
                    <Ionicons name="document-text" size={16} color="#6b7280" />
                    <Text style={styles.submittedName}>{key.replace(/_/g, ' ')}</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.continueBtn}
                onPress={() => navigation.replace("DashboardMain")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#5EC6C6', '#4BA8A8']}
                  style={styles.continueBtnGradient}
                >
                  <Text style={styles.continueBtnText}>Go to Dashboard</Text>
                  <Ionicons name="arrow-forward" size={18} color="#0a0f1a" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <>
              {/* Vehicle Number Input */}
              <LinearGradient
                colors={['#1a2744', '#0f1a2e']}
                style={styles.card}
              >
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="car" size={18} color="#5EC6C6" />
                  </View>
                  <Text style={styles.sectionTitle}>Vehicle Information</Text>
                </View>
                
                <Text style={styles.inputLabel}>Number Plate</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#6b7280" />
                  <TextInput
                    style={styles.input}
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    placeholder="e.g. ABC 1234"
                    placeholderTextColor="#4b5563"
                    autoCapitalize="characters"
                  />
                </View>
                <Text style={styles.inputHint}>
                  This cannot be changed after verification without adding a new vehicle
                </Text>
              </LinearGradient>

              {/* Documents Upload */}
              <LinearGradient
                colors={['#1a2744', '#0f1a2e']}
                style={styles.card}
              >
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                    <Ionicons name="folder-open" size={18} color="#fbbf24" />
                  </View>
                  <Text style={styles.sectionTitle}>Required Documents</Text>
                </View>

                <DocPicker label="Driver's License" value={docs.drivers_license} onPick={() => pickDocument("drivers_license")} />
                <DocPicker label="Car Ownership" value={docs.car_ownership} onPick={() => pickDocument("car_ownership")} />
                <DocPicker label="Car Image (Front)" value={docs.car_image_1} onPick={() => pickDocument("car_image_1", "image/*")} />
                <DocPicker label="Car Image (Back)" value={docs.car_image_2} onPick={() => pickDocument("car_image_2", "image/*")} />
                <DocPicker label="Inspection Report" value={docs.inspection_report} onPick={() => pickDocument("inspection_report")} />
              </LinearGradient>

              {/* Upload Button */}
              <TouchableOpacity 
                style={[styles.uploadBtn, (uploading || tokenLoading) && styles.uploadBtnDisabled]}
                onPress={uploadAll} 
                disabled={uploading || tokenLoading} 
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={(uploading || tokenLoading) ? ['#4a5568', '#2d3748'] : ['#5EC6C6', '#4BA8A8']}
                  style={styles.uploadBtnGradient}
                >
                  {uploading || tokenLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={20} color="#0a0f1a" />
                      <Text style={styles.uploadBtnText}>Submit for Verification</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.skipBtn}
                onPress={() => navigation.replace("DashboardMain")} 
                activeOpacity={0.85}
              >
                <Text style={styles.skipBtnText}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0f1a" },
  
  header: {
    marginBottom: 20,
  },
  title: { 
    color: "#fff", 
    fontSize: 28, 
    fontWeight: "900", 
    marginBottom: 6 
  },
  subtitle: { 
    color: "#6b7280", 
    fontSize: 15, 
    fontWeight: "600" 
  },

  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(94, 198, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
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
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  inputHint: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },

  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docIconUploaded: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  docLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  docFileName: {
    color: "#10b981",
    fontSize: 12,
    marginTop: 2,
    maxWidth: 180,
  },
  docHint: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },

  uploadBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
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
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  uploadBtnText: {
    color: "#0a0f1a",
    fontWeight: "900",
    fontSize: 16,
  },

  skipBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipBtnText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 14,
  },

  // Success state styles
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: 'center',
    marginBottom: 8,
  },
  successText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(94, 198, 198, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  vehicleNumber: {
    color: "#5EC6C6",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  submittedDocs: {
    marginBottom: 20,
  },
  submittedLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  submittedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  submittedName: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  continueBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  continueBtnText: {
    color: "#0a0f1a",
    fontWeight: "900",
    fontSize: 16,
  },
});
