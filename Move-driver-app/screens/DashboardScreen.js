import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Linking,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { getToken } from "../utils/storage";

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [driver, setDriver] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const mapRef = useRef(null);

  // Optional placeholders (wire later)
  const [todayTrips] = useState(0);
  const [todayEarnings] = useState(0);

  const pollingRef = useRef(null);
  const onlineSinceRef = useRef(null);
  const [onlineMinutes, setOnlineMinutes] = useState(0);

  const API_BASE = "http://192.168.1.31:8000";

  const fetchDriverStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    const userId = await getToken("userId");
    if (!userId) {
      if (!silent) setLoading(false);
      return;
    }

    try {
      const token = await getToken("token");
      const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/status/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setIsApproved(!!data.is_approved);
        setDriver(data);

        // Track online time locally
        if (data.is_online) {
          if (!onlineSinceRef.current) onlineSinceRef.current = Date.now();
        } else {
          onlineSinceRef.current = null;
          setOnlineMinutes(0);
        }
      }
    } catch (e) {
      // optional console.log(e)
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverStatus(false);
    
    // Get driver's current location (mock for now - in production use expo-location)
    setDriverLocation({
      latitude: 0.3476,  // Kampala, Uganda - replace with actual location
      longitude: 32.5825,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  }, []); // Empty dependency array - only run once on mount

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDriverStatus(true);
    setRefreshing(false);
  };

  // Update online minutes while online (local UI feedback)
  useEffect(() => {
    let t = null;
    if (driver?.is_online) {
      t = setInterval(() => {
        if (onlineSinceRef.current) {
          const mins = Math.floor((Date.now() - onlineSinceRef.current) / 60000);
          setOnlineMinutes(mins);
        }
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [driver?.is_online]);

  // Poll ride requests only if approved + online
  useEffect(() => {
    const clearPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    if (isApproved && driver?.is_online) {
      clearPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const userId = await getToken("userId");
          const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/ride-requests/`);
          if (res.ok) {
            const data = await res.json();
            setRideRequests(Array.isArray(data) ? data : []);
          }
        } catch {}
      }, 5000);

      return clearPolling;
    } else {
      setRideRequests([]);
      clearPolling();
    }
  }, [isApproved, driver?.is_online]);

  const toggleOnline = useCallback(async () => {
    const newStatus = !driver?.is_online;

    // optimistic UI
    setDriver((d) => ({ ...(d || {}), is_online: newStatus }));

    if (newStatus) {
      onlineSinceRef.current = Date.now();
      setOnlineMinutes(0);
    } else {
      onlineSinceRef.current = null;
      setOnlineMinutes(0);
    }

    try {
      const userId = await getToken("userId");
      await fetch(`${API_BASE}/api/corporate/driver/${userId}/set-online/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: newStatus }),
      });
    } catch {}
  }, [driver?.is_online]);

  const statusLabel = useMemo(() => {
    if (!isApproved) return "Pending Approval";
    return driver?.is_online ? "Online" : "Offline";
  }, [isApproved, driver?.is_online]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2f66ff" />
      </View>
    );
  }

  // -----------------------------
  // NOT APPROVED VIEW (Redesigned)
  // -----------------------------
  if (!isApproved) {
    return (
      <View style={styles.screen}>
        <View style={styles.shell}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>
            Your account is created. Upload documents to complete verification.
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <View style={[styles.dot, { backgroundColor: "#f9c404" }]} />
              <Text style={styles.statusText}>Status: Pending</Text>
            </View>
          </View>

          <View style={styles.bigCard}>
            <Text style={styles.bigCardTitle}>Next Step</Text>
            <Text style={styles.bigCardSub}>Upload your documents for review and approval.</Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("DocumentUpload")}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Upload / Review Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => navigation.replace("Login")}
              activeOpacity={0.85}
            >
              <Text style={styles.linkText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // -----------------------------
  // APPROVED VIEW (Redesigned)
  // -----------------------------

  const StatChip = ({ label, value }) => (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 18, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2f66ff" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {driver?.full_name || "Driver"} 👋</Text>
        <Text style={styles.headerSub}>You are approved. Go online to start receiving requests.</Text>

        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <View
              style={[
                styles.dot,
                { backgroundColor: driver?.is_online ? "#5EC6C6" : "#b9c2d1" },
              ]}
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>

          <TouchableOpacity style={styles.logoutMini} onPress={() => navigation.replace("Login")} activeOpacity={0.85}>
            <Text style={styles.logoutMiniText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <StatChip label="Today Earnings" value={`$${todayEarnings}`} />
        <StatChip label="Today Trips" value={`${todayTrips}`} />
        <StatChip label="Online Time" value={driver?.is_online ? `${onlineMinutes}m` : `—`} />
      </View>

      {/* Online Hero Toggle */}
      <View style={styles.onlineCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.onlineTitle}>Driver Status</Text>
          <Text style={styles.onlineSub}>
            {driver?.is_online ? "You are visible to riders nearby." : "You’re offline. Go online to receive requests."}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.onlineToggle,
            { backgroundColor: driver?.is_online ? "#5EC6C6" : "#2a3553" },
          ]}
          onPress={toggleOnline}
          activeOpacity={0.9}
        >
          <Text style={[styles.onlineToggleText, { color: driver?.is_online ? "#0b1220" : "#fff" }]}>
            {driver?.is_online ? "ONLINE" : "GO ONLINE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map View */}
      {driver?.is_online && driverLocation && (
        <>
          <Text style={styles.sectionTitle}>📍 Nearby Requests</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={driverLocation}
              showsUserLocation={true}
              showsMyLocationButton={true}
            >
              {/* Driver's current location marker */}
              <Marker
                coordinate={{
                  latitude: driverLocation.latitude,
                  longitude: driverLocation.longitude,
                }}
                title="You are here"
                description="Your current location"
                pinColor="#5EC6C6"
              />

              {/* Ride request markers */}
              {rideRequests.map((req, index) => {
                // Mock coordinates - in production, these come from the API
                const mockLat = driverLocation.latitude + (Math.random() - 0.5) * 0.02;
                const mockLng = driverLocation.longitude + (Math.random() - 0.5) * 0.02;
                
                return (
                  <Marker
                    key={req.id || index}
                    coordinate={{
                      latitude: req.pickup_lat || mockLat,
                      longitude: req.pickup_lng || mockLng,
                    }}
                    title={`Pickup: ${req.pickup_location || 'Request'}`}
                    description={`Fare: ${req.fare_estimate || 'N/A'}`}
                    pinColor="#2f66ff"
                  />
                );
              })}
            </MapView>
            {rideRequests.length === 0 && (
              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>No nearby requests</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Requests */}
      <Text style={styles.sectionTitle}>Incoming Ride Requests</Text>

      {!driver?.is_online ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>You’re offline</Text>
          <Text style={styles.emptySub}>Go online to start receiving ride requests.</Text>
        </View>
      ) : rideRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Waiting for requests…</Text>
          <Text style={styles.emptySub}>Stay online. Requests will appear here automatically.</Text>
        </View>
      ) : (
        rideRequests.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.requestTop}>
              <Text style={styles.requestTitle}>New Request</Text>
              <View style={styles.farePill}>
                <Text style={styles.fareText}>{req.fare_estimate}</Text>
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeValue}>{req.pickup_location}</Text>

              <View style={styles.hr} />

              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeValue}>{req.destination}</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.acceptBtn} 
                onPress={async () => {
                  try {
                    const userId = await getToken("userId");
                    const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/accept-ride/`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ride_request_id: req.id })
                    });
                    if (res.ok) {
                      // Remove from local list
                      setRideRequests(rideRequests.filter(r => r.id !== req.id));
                      
                      // Open navigation to pickup location
                      if (req.pickup_lat && req.pickup_lng) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${req.pickup_lat},${req.pickup_lng}`;
                        Linking.openURL(url);
                      }
                    }
                  } catch (e) {}
                }} 
                activeOpacity={0.9}
              >
                <Text style={styles.acceptText}>Accept & Navigate</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.rejectBtn} 
                onPress={async () => {
                  try {
                    const userId = await getToken("userId");
                    const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/reject-ride/`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ride_request_id: req.id })
                    });
                    if (res.ok) {
                      // Remove from local list
                      setRideRequests(rideRequests.filter(r => r.id !== req.id));
                    }
                  } catch (e) {}
                }} 
                activeOpacity={0.9}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 14 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Screen / Layout
  screen: { flex: 1, backgroundColor: "#0b1220" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" },
  shell: { padding: 18 },

  // Header
  header: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  headerSub: { color: "#aeb9cc", marginTop: 6, fontWeight: "600" },

  statusRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f1627",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dot: { width: 10, height: 10, borderRadius: 999, marginRight: 8 },
  statusText: { color: "#c6d0e3", fontWeight: "800" },

  logoutMini: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  logoutMiniText: { color: "#c6d0e3", fontWeight: "800" },

  // Not approved card
  bigCard: {
    marginTop: 14,
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bigCardTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  bigCardSub: { color: "#aeb9cc", marginTop: 6, marginBottom: 14, fontWeight: "600" },

  primaryBtn: {
    backgroundColor: "#2f66ff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  linkBtn: { marginTop: 12, alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#aeb9cc", fontWeight: "800" },

  // Summary chips
  summary: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    flex: 1,
    backgroundColor: "#121b2e",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  chipLabel: { color: "#aeb9cc", fontWeight: "800", fontSize: 12 },
  chipValue: { color: "#fff", fontWeight: "900", fontSize: 18, marginTop: 6 },

  // Online hero card
  onlineCard: {
    marginTop: 12,
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  onlineTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  onlineSub: { color: "#aeb9cc", fontWeight: "600", marginTop: 6, paddingRight: 6 },

  onlineToggle: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  onlineToggleText: { fontWeight: "900", letterSpacing: 0.5 },

  // Sections
  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 16, marginTop: 16, marginBottom: 10 },

  // Map
  mapContainer: {
    height: 300,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(11, 18, 32, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  // Empty state
  emptyState: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 15 },
  emptySub: { color: "#aeb9cc", fontWeight: "600", marginTop: 6 },

  // Request card
  requestCard: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  requestTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  requestTitle: { color: "#fff", fontWeight: "900", fontSize: 15 },

  farePill: {
    backgroundColor: "rgba(47, 102, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(47, 102, 255, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  fareText: { color: "#cfe0ff", fontWeight: "900" },

  routeLabel: { color: "#aeb9cc", fontWeight: "800", fontSize: 12 },
  routeValue: { color: "#fff", fontWeight: "800", marginTop: 4 },

  hr: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 12 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#5EC6C6",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptText: { color: "#0b1220", fontWeight: "900" },

  rejectBtn: {
    flex: 1,
    backgroundColor: "#2a3553",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  rejectText: { color: "#fff", fontWeight: "900" },
});
