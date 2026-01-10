// DashboardNotificationModal.js
// Notification modal for the driver dashboard
import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardNotificationModal({
  showNotificationModal,
  setShowNotificationModal,
  currentNotification,
  setCurrentNotification,
  onRefresh,
  styles,
}) {
  return (
    <Modal
      visible={showNotificationModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowNotificationModal(false)}
    >
      <View style={styles.notificationModalOverlay}>
        <View style={styles.notificationModalContent}>
          <View style={styles.notificationIconContainer}>
            <Ionicons name="notifications" size={40} color="#f59e0b" />
          </View>
          <Text style={styles.notificationTitle}>{currentNotification?.title || "Notification"}</Text>
          <Text style={styles.notificationMessage}>{currentNotification?.message || ""}</Text>
          <TouchableOpacity
            style={styles.notificationDismissBtn}
            onPress={() => {
              setShowNotificationModal(false);
              setCurrentNotification(null);
              onRefresh();
            }}
          >
            <Text style={styles.notificationDismissBtnText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
