import React from "react";
import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,

        tabBarActiveTintColor: "#5EC6C6",
        tabBarInactiveTintColor: "rgba(255,255,255,0.65)",

        tabBarStyle: {
          backgroundColor: "#23272F",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 72,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          marginHorizontal: 12,
          marginBottom: Platform.OS === "ios" ? 20 : 12,
          borderRadius: 24,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
          marginTop: 4,
        },

        // subtle "floating" feel
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
          marginVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="service"
        options={{
          title: "Services",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="apps" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
