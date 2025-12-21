import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { getToken } from "../utils/storage";

// Helper component (MUST be outside the screen component)
function DocPicker({ label, value, onPick }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity style={styles.pickBtn} onPress={onPick} activeOpacity={0.85}>
        <Text style={styles.pickText}>{value ? value.name : `Pick ${label}`}</Text>
      </TouchableOpacity>

      {value ? (
        <Text style={styles.metaText}>
          {value.mimeType ? `${value.mimeType}, ` : ""}
          {typeof value.size === "number" ? `${(value.size / 1024).toFixed(0)} KB` : ""}
        </Text>
      ) : null}
    </View>
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

  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);

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

    setUploading(true);

    try {
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
      navigation.replace("Dashboard");
    } catch (e) {
      Alert.alert("Upload failed", "Network/server error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Verification Documents</Text>

      <View style={styles.card}>
        <Text style={styles.help}>Please upload all required documents for verification:</Text>

        <DocPicker
          label="Driver's License"
          value={docs.drivers_license}
          onPick={() => pickDocument("drivers_license")}
        />
        <DocPicker
          label="Car Ownership"
          value={docs.car_ownership}
          onPick={() => pickDocument("car_ownership")}
        />
        <DocPicker
          label="Car Image 1"
          value={docs.car_image_1}
          onPick={() => pickDocument("car_image_1", "image/*")}
        />
        <DocPicker
          label="Car Image 2"
          value={docs.car_image_2}
          onPick={() => pickDocument("car_image_2", "image/*")}
        />
        <DocPicker
          label="Inspection Report"
          value={docs.inspection_report}
          onPick={() => pickDocument("inspection_report")}
        />

        <TouchableOpacity
          style={[styles.uploadBtn, (uploading || tokenLoading) ? styles.buttonDisabled : null]}
          onPress={uploadAll}
          disabled={uploading || tokenLoading}
          activeOpacity={0.85}
        >
          {uploading || tokenLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.uploadText}>Upload All</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skip} onPress={() => navigation.replace("Dashboard")} activeOpacity={0.85}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#0b1220", padding: 18 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 14, textAlign: "center" },
  card: { backgroundColor: "#121b2e", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#24314d" },
  help: { color: "#b9c2d1", marginBottom: 14, lineHeight: 18 },

  label: { color: "#b9c2d1", marginBottom: 6, fontSize: 13 },

  pickBtn: {
    backgroundColor: "#0f1627",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24314d",
  },
  pickText: { color: "#fff", fontWeight: "700" },
  metaText: { color: "#b9c2d1", marginTop: 6, fontSize: 13 },

  uploadBtn: { backgroundColor: "#2f66ff", paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  uploadText: { color: "#fff", fontWeight: "700" },

  skip: { alignItems: "center", marginTop: 14 },
  skipText: { color: "#b9c2d1" },
});
