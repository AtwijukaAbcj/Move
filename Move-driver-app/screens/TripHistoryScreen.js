import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { getToken } from "../utils/storage";

export default function TripHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState([]);

  const API_BASE = "http://192.168.1.31:8000";

  const fetchTrips = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const userId = await getToken("userId");
      if (!userId) return;

      const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/trips/`);
      if (res.ok) {
        const data = await res.json();
        setTrips(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.log("Error fetching trips:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips(true);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2f66ff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 18, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2f66ff" />}
    >
      <Text style={styles.title}>Trip History</Text>
      <Text style={styles.subtitle}>View all your completed trips</Text>

      {trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>Your completed trips will appear here</Text>
        </View>
      ) : (
        trips.map((trip, index) => (
          <TouchableOpacity key={trip.id || index} style={styles.tripCard} activeOpacity={0.9}>
            <View style={styles.tripHeader}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{trip.status || "Completed"}</Text>
              </View>
              <Text style={styles.tripDate}>{trip.date || "Today"}</Text>
            </View>

            <View style={styles.tripRoute}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: "#5EC6C6" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>Pickup</Text>
                  <Text style={styles.routeValue}>{trip.pickup || "N/A"}</Text>
                </View>
              </View>

              <View style={styles.routeLine} />

              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: "#2f66ff" }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLabel}>Destination</Text>
                  <Text style={styles.routeValue}>{trip.destination || "N/A"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tripFooter}>
              <Text style={styles.fareText}>Fare: {trip.fare || "$0.00"}</Text>
              <Text style={styles.durationText}>{trip.duration || "0 min"}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b1220" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" },
  
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: "#aeb9cc", fontSize: 14, fontWeight: "600", marginBottom: 16 },

  emptyState: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginTop: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 18, marginBottom: 8 },
  emptyText: { color: "#aeb9cc", fontWeight: "600", textAlign: "center" },

  tripCard: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statusBadge: {
    backgroundColor: "rgba(94, 198, 198, 0.12)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(94, 198, 198, 0.25)",
  },
  statusText: { color: "#5EC6C6", fontWeight: "800", fontSize: 12 },
  tripDate: { color: "#aeb9cc", fontWeight: "800", fontSize: 12 },

  tripRoute: { marginBottom: 14 },
  routePoint: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 999, marginTop: 4 },
  routeLabel: { color: "#aeb9cc", fontWeight: "800", fontSize: 11, marginBottom: 4 },
  routeValue: { color: "#fff", fontWeight: "800", fontSize: 14 },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 5,
    marginVertical: 4,
  },

  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  fareText: { color: "#5EC6C6", fontWeight: "900", fontSize: 16 },
  durationText: { color: "#aeb9cc", fontWeight: "800", fontSize: 13 },
});
