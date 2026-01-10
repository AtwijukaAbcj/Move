// DashboardOnlineToggle.js
// Online/Offline toggle card for the driver dashboard
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardOnlineToggle({ driver, toggleOnline }) {
  return (
    <TouchableOpacity
      style={{ marginTop: 16, borderRadius: 20, overflow: "hidden" }}
      onPress={toggleOnline}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={driver?.is_online ? ["#0d4f4f", "#0a3d3d"] : ["#1a2744", "#0f1a2e"]}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: driver?.is_online ? "rgba(94, 198, 198, 0.15)" : "rgba(107, 114, 128, 0.15)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: driver?.is_online ? "rgba(94, 198, 198, 0.4)" : "rgba(107, 114, 128, 0.3)" }}>
            <Ionicons name="power" size={32} color={driver?.is_online ? "#5EC6C6" : "#6b7280"} />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>
              {driver?.is_online ? "You're Online" : "You're Offline"}
            </Text>
            <Text style={{ color: "#6b7280", fontWeight: "600", marginTop: 4, fontSize: 13 }}>
              {driver?.is_online ? "Receiving ride requests" : "Tap to start earning"}
            </Text>
          </View>
        </View>
        <View style={{ paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: driver?.is_online ? "#5EC6C6" : "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: driver?.is_online ? "#5EC6C6" : "rgba(255,255,255,0.1)" }}>
          <Text style={{ color: driver?.is_online ? "#0a0f1a" : "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 1 }}>
            {driver?.is_online ? "ONLINE" : "GO LIVE"}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
