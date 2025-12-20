import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./screens/LoginScreen";
import DriverRegistrationScreen from "./screens/DriverRegistrationScreen";
import OtpVerificationScreen from "./screens/OtpVerificationScreen";
import DashboardScreen from "./screens/DashboardScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerification: { phone?: string } | undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}   // ✅ boolean
        />
        <Stack.Screen
          name="Register"
          component={DriverRegistrationScreen}
          options={{ title: "Register" }}
        />
        <Stack.Screen
          name="OtpVerification"
          component={OtpVerificationScreen}
          options={{ title: "Verify Phone" }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Dashboard" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
