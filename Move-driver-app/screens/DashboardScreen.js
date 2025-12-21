import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          Your account is created. Next step: upload documents for verification.
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Status: Pending Verification</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("DocumentUpload")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Upload Verification Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.replace("Login")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, justifyContent: "center", backgroundColor: "#0b1220" },
  card: { backgroundColor: "#121b2e", borderRadius: 16, padding: 18 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#b9c2d1", marginTop: 6, marginBottom: 14 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#0f1627",
    borderWidth: 1,
    borderColor: "#24314d",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 14,
  },
  badgeText: { color: "#b9c2d1" },
  button: {
    backgroundColor: "#2f66ff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { marginTop: 12, paddingVertical: 10, alignItems: "center" },
  secondaryText: { color: "#b9c2d1" },
});
