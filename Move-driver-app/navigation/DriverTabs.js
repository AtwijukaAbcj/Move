import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import DashboardScreen from "../screens/DashboardScreen";
import TripHistoryScreen from "../screens/TripHistoryScreen";
import EarningsScreen from "../screens/EarningsScreen";
import WalletScreen from "../screens/WalletScreen";
import SupportScreen from "../screens/SupportScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function DriverTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: "#2f66ff",
        tabBarInactiveTintColor: "#8B95A5",
        tabBarStyle: {
          backgroundColor: "#121b2e",
          borderTopColor: "#24314d",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        headerStyle: {
          backgroundColor: "#0b1220",
          borderBottomColor: "#24314d",
          borderBottomWidth: 1,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "900",
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Trips" 
        component={TripHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Earnings" 
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Support" 
        component={SupportScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
