import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'in_progress': return '#fbbf24';
      default: return '#5EC6C6';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5EC6C6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5EC6C6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Trip History</Text>
          <Text style={styles.subtitle}>View all your completed trips</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.statCard}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.statCard}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
              <Ionicons name="star" size={18} color="#60a5fa" />
            </View>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </LinearGradient>
        </View>

        {/* Trips List */}
        {trips.length === 0 ? (
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="car-outline" size={48} color="#6b7280" />
            </View>
            <Text style={styles.emptyTitle}>No Trips Yet</Text>
            <Text style={styles.emptyText}>Your completed trips will appear here</Text>
          </LinearGradient>
        ) : (
          trips.map((trip, index) => (
            <TouchableOpacity 
              key={trip.id || index} 
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1a2744', '#0f1a2e']}
                style={styles.tripCard}
              >
                {/* Trip Header */}
                <View style={styles.tripHeader}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(trip.status)}15` }
                  ]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
                      {trip.status || "Completed"}
                    </Text>
                  </View>
                  <Text style={styles.tripDate}>{trip.date || "Today"}</Text>
                </View>

                {/* Trip Route */}
                <View style={styles.tripRoute}>
                  <View style={styles.routePoint}>
                    <View style={styles.routeIconContainer}>
                      <View style={[styles.routeDot, { backgroundColor: "#5EC6C6" }]} />
                      <View style={styles.routeLineVertical} />
                    </View>
                    <View style={styles.routeContent}>
                      <Text style={styles.routeLabel}>PICKUP</Text>
                      <Text style={styles.routeValue}>{trip.pickup || "N/A"}</Text>
                    </View>
                  </View>

                  <View style={styles.routePoint}>
                    <View style={styles.routeIconContainer}>
                      <View style={[styles.routeDot, { backgroundColor: "#2f66ff" }]} />
                    </View>
                    <View style={styles.routeContent}>
                      <Text style={styles.routeLabel}>DROPOFF</Text>
                      <Text style={styles.routeValue}>{trip.destination || "N/A"}</Text>
                    </View>
                  </View>
                </View>

                {/* Trip Footer */}
                <View style={styles.tripFooter}>
                  <View style={styles.tripDetail}>
                    <Ionicons name="cash-outline" size={16} color="#10b981" />
                    <Text style={styles.fareText}>{trip.fare || "$0.00"}</Text>
                  </View>
                  <View style={styles.tripDetail}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.durationText}>{trip.duration || "0 min"}</Text>
                  </View>
                  <View style={styles.tripDetail}>
                    <Ionicons name="navigate-outline" size={16} color="#6b7280" />
                    <Text style={styles.durationText}>{trip.distance || "0 km"}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0f1a" },
  
  header: {
    marginBottom: 20,
  },
  title: { 
    color: "#fff", 
    fontSize: 32, 
    fontWeight: "900", 
    marginBottom: 6 
  },
  subtitle: { 
    color: "#6b7280", 
    fontSize: 15, 
    fontWeight: "600" 
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 2,
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyState: {
    borderRadius: 24,
    padding: 48,
    alignItems: "center",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { 
    color: "#fff", 
    fontWeight: "900", 
    fontSize: 20, 
    marginBottom: 8 
  },
  emptyText: { 
    color: "#6b7280", 
    fontWeight: "600", 
    textAlign: "center",
    fontSize: 14,
  },

  tripCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: { 
    fontWeight: "800", 
    fontSize: 12,
    textTransform: 'capitalize',
  },
  tripDate: { 
    color: "#6b7280", 
    fontWeight: "700", 
    fontSize: 12 
  },

  tripRoute: { 
    marginBottom: 16,
  },
  routePoint: { 
    flexDirection: "row", 
  },
  routeIconContainer: {
    alignItems: 'center',
    marginRight: 14,
  },
  routeDot: { 
    width: 14, 
    height: 14, 
    borderRadius: 7,
  },
  routeLineVertical: {
    width: 2,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  routeContent: {
    flex: 1,
    paddingBottom: 16,
  },
  routeLabel: { 
    color: "#6b7280", 
    fontWeight: "800", 
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4 
  },
  routeValue: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 14,
    lineHeight: 20,
  },

  tripFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    gap: 20,
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareText: { 
    color: "#10b981", 
    fontWeight: "900", 
    fontSize: 16 
  },
  durationText: { 
    color: "#9ca3af", 
    fontWeight: "700", 
    fontSize: 13 
  },
});
