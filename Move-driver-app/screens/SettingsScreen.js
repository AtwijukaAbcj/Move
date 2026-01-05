import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.text}>Your driver app settings will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  text: { color: "#b9c2d1", fontSize: 16 },
});
