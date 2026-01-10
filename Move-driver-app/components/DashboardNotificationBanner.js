// DashboardNotificationBanner.js
// In-app banner notification for driver dashboard
import React, { useEffect, useRef } from "react";
import { Animated, View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function DashboardNotificationBanner({
  visible,
  notification,
  onPress,
  onHide,
  duration = 4000,
}) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const hideTimeout = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide && onHide());
      }, duration);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [visible, duration, onHide, translateY]);

  if (!visible || !notification) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}> 
      <TouchableOpacity style={styles.touch} activeOpacity={0.85} onPress={onPress}>
        <Ionicons name="notifications" size={24} color="#f59e0b" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{notification.title || "Notification"}</Text>
          <Text style={styles.message} numberOfLines={2}>{notification.message || ""}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    zIndex: 9999,
    backgroundColor: "#23272F",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  touch: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 2,
  },
  message: {
    color: "#aeb9cc",
    fontWeight: "600",
    fontSize: 13,
  },
});
