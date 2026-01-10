// DashboardHeader.js
// Header/Profile section for the driver dashboard
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardHeader({ driver, notifications, navigation, setCurrentNotification, setShowNotificationModal }) {
  return (
    <LinearGradient
      colors={driver?.is_online ? ["#164e63", "#0f172a"] : ["#232946", "#121826"]}
      style={{ borderRadius: 24, padding: 20, marginBottom: 6 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ position: "relative" }}>
            <LinearGradient
              colors={driver?.is_online ? ["#164e63", "#0f172a"] : ["#232946", "#121826"]}
              style={{ width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>
                {driver?.full_name?.charAt(0)?.toUpperCase() || "D"}
              </Text>
            </LinearGradient>
            {driver?.is_online && (
              <View style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: "#0a0f1a", justifyContent: "center", alignItems: "center" }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#10b981" }} />
              </View>
            )}
          </View>
          <View style={{ marginLeft: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "600", marginBottom: 2 }}>
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
            </Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>{driver?.full_name || "Driver"}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center", position: "relative" }}
            onPress={() => {
              if (notifications.length > 0) {
                setCurrentNotification(notifications[0]);
                setShowNotificationModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {notifications.length > 0 && <View style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center" }}
            onPress={() => navigation.replace("Login")}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color="#aeb9cc" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
