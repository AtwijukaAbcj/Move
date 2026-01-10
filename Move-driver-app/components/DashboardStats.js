// DashboardStats.js
// Stats cards for the driver dashboard
import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

export default function DashboardStats({ todayEarnings, todayTrips, onlineMinutes, driver }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
      <LinearGradient colors={["#1e3a5f", "#152238"]} style={{ flex: 1, borderRadius: 18, padding: 16, alignItems: "center" }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(16, 185, 129, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
          <FontAwesome5 name="dollar-sign" size={18} color="#10b981" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>${todayEarnings}</Text>
        <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" }}>Today's Earnings</Text>
      </LinearGradient>
      <LinearGradient colors={["#1e3a5f", "#152238"]} style={{ flex: 1, borderRadius: 18, padding: 16, alignItems: "center" }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(96, 165, 250, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
          <MaterialCommunityIcons name="road-variant" size={18} color="#60a5fa" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>{todayTrips}</Text>
        <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" }}>Completed Trips</Text>
      </LinearGradient>
      <LinearGradient colors={["#1e3a5f", "#152238"]} style={{ flex: 1, borderRadius: 18, padding: 16, alignItems: "center" }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(167, 139, 250, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
          <Ionicons name="time-outline" size={18} color="#a78bfa" />
        </View>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>{driver?.is_online ? `${onlineMinutes}m` : "—"}</Text>
        <Text style={{ color: "#6b7280", fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" }}>Online Time</Text>
      </LinearGradient>
    </View>
  );
}
