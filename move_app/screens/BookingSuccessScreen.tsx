import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const THEME = {
  primary: "#35736E",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [driverStatus, setDriverStatus] = useState<"searching" | "found">("searching");
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    // Simulate driver matching
    const timer = setTimeout(() => {
      setDriverStatus("found");
      setDriver({
        name: "John Smith",
        rating: 4.8,
        vehicle: "Toyota Camry",
        licensePlate: "GH-1234-20",
        eta: "3 mins",
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
        <TouchableOpacity
          onPress={() => router.push("/home")}
          style={styles.closeBtn}
          activeOpacity={0.9}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={80} color="#2ecc71" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your ride has been successfully booked
          </Text>
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BOOKING DETAILS</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={THEME.aqua} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>{params.pickup}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Ionicons name="navigate" size={20} color={THEME.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue}>{params.destination}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{params.distance} km</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{params.duration} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fare</Text>
              <Text style={[styles.infoValue, { color: THEME.aqua }]}>
                ${params.fare}
              </Text>
            </View>
          </View>
        </View>

        {/* Driver Status */}
        {driverStatus === "searching" ? (
          <View style={styles.card}>
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color={THEME.aqua} />
              <Text style={styles.searchingText}>Finding a driver for you...</Text>
              <Text style={styles.searchingSubtext}>
                This usually takes less than a minute
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>YOUR DRIVER</Text>
            
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{driver?.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFA726" />
                  <Text style={styles.ratingText}>{driver?.rating}</Text>
                </View>
              </View>
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>{driver?.eta}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport" size={24} color={THEME.aqua} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleLabel}>Vehicle</Text>
                <Text style={styles.vehicleValue}>{driver?.vehicle}</Text>
              </View>
              <View>
                <Text style={styles.plateLabel}>Plate Number</Text>
                <Text style={styles.plateValue}>{driver?.licensePlate}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.callBtn} activeOpacity={0.9}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.callBtnText}>Call Driver</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.messageBtn} activeOpacity={0.9}>
                <Ionicons name="chatbubble" size={20} color={THEME.aqua} />
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PAYMENT</Text>
          
          <View style={styles.paymentRow}>
            <Ionicons
              name={params.paymentMethod === "card" ? "card" : "phone-portrait"}
              size={20}
              color={THEME.aqua}
            />
            <Text style={styles.paymentMethod}>
              {params.paymentMethod === "card" ? "Credit Card" : "Mobile Money"}
            </Text>
            <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
          </View>
        </View>

        {/* Booking ID */}
        <View style={styles.bookingIdCard}>
          <Text style={styles.bookingIdLabel}>Booking ID</Text>
          <Text style={styles.bookingId}>
            {params.bookingId || "#MOVE-" + Math.floor(Math.random() * 100000)}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackBtn}
          activeOpacity={0.9}
          onPress={() => router.push("/rides")}
        >
          <Ionicons name="navigate" size={20} color={THEME.ink} />
          <Text style={styles.trackBtnText}>Track Your Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.9}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.dark },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 16,
    backgroundColor: THEME.dark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  content: { flex: 1 },

  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(46,204,113,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  successSubtitle: {
    color: "#9AA4B2",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#2D313A",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailLabel: {
    color: "#9AA4B2",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 12,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    color: "#9AA4B2",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  searchingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  searchingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 16,
    marginBottom: 8,
  },
  searchingSubtext: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "700",
  },

  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "800",
  },
  etaBadge: {
    backgroundColor: "rgba(94,198,198,0.2)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  etaText: {
    color: THEME.aqua,
    fontSize: 13,
    fontWeight: "900",
  },

  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(94,198,198,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleLabel: {
    color: "#9AA4B2",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  vehicleValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  plateLabel: {
    color: "#9AA4B2",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "right",
  },
  plateValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: THEME.aqua,
    borderRadius: 14,
    paddingVertical: 12,
  },
  callBtnText: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(94,198,198,0.2)",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.aqua,
  },
  messageBtnText: {
    color: THEME.aqua,
    fontSize: 14,
    fontWeight: "900",
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentMethod: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  bookingIdCard: {
    backgroundColor: "rgba(94,198,198,0.1)",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.2)",
  },
  bookingIdLabel: {
    color: "#9AA4B2",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  bookingId: {
    color: THEME.aqua,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },

  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: THEME.dark,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: THEME.aqua,
    borderRadius: 18,
    paddingVertical: 16,
  },
  trackBtnText: {
    color: THEME.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  homeBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    paddingVertical: 16,
  },
  homeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
