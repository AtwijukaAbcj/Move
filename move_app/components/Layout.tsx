import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import React from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#0b1220' }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -65 : 0}
      >
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Provider>
  );
};

export default Layout;
