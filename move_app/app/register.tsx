import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function RegisterOptionsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/register-form")}> 
        <Text style={styles.buttonText}>Register with Email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: "#4285F4" }]} onPress={() => router.push("/register-google")}> 
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  button: {
    backgroundColor: "#2f66ff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    width: 240,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
