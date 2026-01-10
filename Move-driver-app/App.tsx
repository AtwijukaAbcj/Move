import React, { useEffect } from "react";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
// Helper to register for push notifications and get Expo token
async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for notifications!');
    return null;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  // Optionally send this token to your backend for storage
  // await fetch('YOUR_BACKEND_URL/api/save-push-token', { method: 'POST', body: JSON.stringify({ token }) });
  return token;
}
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LoginScreen from "./screens/LoginScreen";
import DriverRegistrationScreen from "./screens/DriverRegistrationScreen";
import OtpVerificationScreen from "./screens/OtpVerificationScreen";
import DriverTabs from "./navigation/DriverTabs";
import DocumentUploadScreen from "./screens/DocumentUploadScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerification: { phone?: string } | undefined;
  DashboardMain: undefined;
  DocumentUpload: { token?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();


export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        // TODO: Send token to backend and associate with logged-in user
        console.log('Expo push token:', token);
      }
    });
    // Optionally handle notification responses here
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={DriverRegistrationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OtpVerification"
            component={OtpVerificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DashboardMain"
            component={DriverTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DocumentUpload"
            component={DocumentUploadScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
