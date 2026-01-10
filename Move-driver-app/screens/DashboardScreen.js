// DashboardScreen.js
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
  Animated,
  Vibration,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { getToken } from "../utils/storage";
import DashboardHeader from "../components/DashboardHeader";
import DashboardStats from "../components/DashboardStats";
import DashboardOnlineToggle from "../components/DashboardOnlineToggle";
import DashboardMapView from "../components/DashboardMapView";
import DashboardRideRequestCard from "../components/DashboardRideRequestCard";
import DashboardNotificationModal from "../components/DashboardNotificationModal";
import DashboardNotificationBanner from "../components/DashboardNotificationBanner";

export default function DashboardScreen({ navigation }) {
    // Notification banner state
    const [showNotificationBanner, setShowNotificationBanner] = useState(false);
    const [bannerNotification, setBannerNotification] = useState(null);
  const API_BASE = "http://192.168.1.31:8000";

  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [driver, setDriver] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);

  // Track accepted ride
  const [acceptedRideId, setAcceptedRideId] = useState(null);

  // Map / location
  const [driverLocation, setDriverLocation] = useState(null);
  const mapRef = useRef(null);

  // Countdown timers for offers
  const [offerCountdowns, setOfferCountdowns] = useState({});
  const [offerMaxSeconds, setOfferMaxSeconds] = useState({}); // used for progress width
  const countdownIntervalRef = useRef(null);

  // Pulse animation for urgent offers
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Optional placeholders (wire later)
  const [todayTrips] = useState(0);
  const [todayEarnings] = useState(0);

  // Polling
  const pollingRef = useRef(null);

  // Online time tracking
  const onlineSinceRef = useRef(null);
  const [onlineMinutes, setOnlineMinutes] = useState(0);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  // Location tracking refs
  const locationSubscriptionRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // -----------------------------
  // Helpers
  // -----------------------------
  const openGoogleMapsTo = useCallback((lat, lng) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  }, []);

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }
  }, []);

  const updateLocationToBackend = useCallback(
    async (latitude, longitude) => {
      try {
        const userId = await getToken("userId");
        if (!userId) return;

        const response = await fetch(`${API_BASE}/api/corporate/driver/${userId}/location/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude }),
        });

        if (response.ok) {
          console.log("Location updated successfully:", latitude, longitude);
        } else {
          console.log("Failed to update location:", response.status);
        }
      } catch (error) {
        console.log("Error updating location:", error);
      }
    },
    [API_BASE]
  );

  const requestLocationAndUpdate = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "Please enable location access to go online and receive ride requests.",
          [{ text: "OK" }]
        );
        setLocationPermissionGranted(false);
        return null;
      }

      setLocationPermissionGranted(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      setDriverLocation({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      await updateLocationToBackend(latitude, longitude);

      return { latitude, longitude };
    } catch (error) {
      console.log("Error getting location:", error);
      Alert.alert("Location Error", "Could not get your current location. Please try again.");
      return null;
    }
  }, [updateLocationToBackend]);

  const startLocationTracking = useCallback(async () => {
    // Stop existing subscription if any
    stopLocationTracking();

    // Start watching location
    locationSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // every 10s
        distanceInterval: 10, // or 10 meters
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        setDriverLocation({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    );

    // Update backend every 30 seconds
    locationUpdateIntervalRef.current = setInterval(() => {
      (async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await updateLocationToBackend(location.coords.latitude, location.coords.longitude);
        } catch (error) {
          console.log("Periodic location update error:", error);
        }
      })();
    }, 30000);
  }, [stopLocationTracking, updateLocationToBackend]);

  const fetchNotifications = useCallback(async () => {
    try {
      const userId = await getToken("userId");
      if (!userId) return;

      const res = await fetch(
        `${API_BASE}/api/corporate/driver/${userId}/notifications/?unread_only=true`
      );

      if (!res.ok) return;

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];


      // Show first unread as banner and modal
      if (list.length > 0) {
        const notification = list[0];
        setBannerNotification(notification);
        setShowNotificationBanner(true);
        setCurrentNotification(notification);
        setShowNotificationModal(true);
        Vibration.vibrate([0, 500, 200, 500]);

        // mark as read (batch)
        await fetch(`${API_BASE}/api/corporate/driver/${userId}/notifications/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_ids: [notification.id] }),
        });
      }

      setNotifications(list);
    } catch (error) {
      console.log("Error fetching notifications:", error);
    }
  }, [API_BASE]);

  const fetchDriverStatus = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      const userId = await getToken("userId");
      if (!userId) {
        if (!silent) setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/status/`, {
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          setIsApproved(!!data.is_approved);
          setDriver(data);

          // online time tracking
          if (data.is_online) {
            if (!onlineSinceRef.current) onlineSinceRef.current = Date.now();
          } else {
            onlineSinceRef.current = null;
            setOnlineMinutes(0);
          }
        } else {
          console.log("Failed to fetch driver status:", res.status);
        }
      } catch (e) {
        console.log("Error fetching driver status:", e);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [API_BASE]
  );

  const fetchRideRequests = useCallback(async () => {
    try {
      const userId = await getToken("userId");
      if (!userId) return;

      const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/ride-requests/`);
      if (!res.ok) return;

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setRideRequests(list);
    } catch (e) {
      // silent
    }
  }, [API_BASE]);

  // -----------------------------
  // Mount / Unmount
  // -----------------------------
  useEffect(() => {
    fetchDriverStatus(false);
    requestLocationAndUpdate();

    return () => {
      stopLocationTracking();
      clearPolling();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start/stop location tracking based on online status
  useEffect(() => {
    if (driver?.is_online && isApproved) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [driver?.is_online, isApproved, startLocationTracking, stopLocationTracking]);

  // Poll ride requests + notifications when online
  useEffect(() => {
    clearPolling();

    if (isApproved && driver?.is_online) {
      // immediate fetch
      fetchRideRequests();
      fetchNotifications();

      pollingRef.current = setInterval(() => {
        fetchRideRequests();
        fetchNotifications();
      }, 5000);
    } else {
      setRideRequests([]);
      setAcceptedRideId(null);
    }

    return clearPolling;
  }, [isApproved, driver?.is_online, fetchRideRequests, fetchNotifications, clearPolling]);

  // Update online minutes every 1 minute while online
  useEffect(() => {
    let t = null;

    if (driver?.is_online && onlineSinceRef.current) {
      const tick = () => {
        const diffMs = Date.now() - onlineSinceRef.current;
        const mins = Math.floor(diffMs / 60000);
        setOnlineMinutes(mins);
      };

      tick();
      t = setInterval(tick, 15000); // update every 15s for smoother UX
    } else {
      setOnlineMinutes(0);
    }

    return () => {
      if (t) clearInterval(t);
    };
  }, [driver?.is_online]);

  // Urgent pulse animation when any offer <=10s
  useEffect(() => {
    const hasUrgentOffer = rideRequests.some(
      (req) => req.is_offer && (offerCountdowns[req.id] ?? req.seconds_remaining ?? 0) <= 10
    );

    if (hasUrgentOffer) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [rideRequests, offerCountdowns, pulseAnim]);

  // Offer countdown logic
  useEffect(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Initialize max seconds (for progress) + countdowns from current server data
    const initCountdowns = {};
    const initMax = {};

    rideRequests.forEach((req) => {
      if (req.is_offer) {
        const sec = Number(req.seconds_remaining ?? 0);
        if (sec > 0) {
          initCountdowns[req.id] = sec;
          initMax[req.id] = Math.max(sec, 20); // fallback max for progress
        }
      }
    });

    setOfferCountdowns(initCountdowns);
    setOfferMaxSeconds((prev) => ({ ...prev, ...initMax }));

    // Tick down
    countdownIntervalRef.current = setInterval(() => {
      setOfferCountdowns((prev) => {
        const next = { ...prev };
        let changed = false;

        Object.keys(next).forEach((idStr) => {
          const id = Number(idStr);
          const v = next[id];
          if (typeof v === "number" && v > 0) {
            next[id] = v - 1;
            changed = true;
          }
          if (next[id] <= 0) {
            next[id] = 0;
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [rideRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDriverStatus(true);
    await requestLocationAndUpdate();
    await fetchRideRequests();
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchDriverStatus, requestLocationAndUpdate, fetchRideRequests, fetchNotifications]);

  const toggleOnline = useCallback(async () => {
    const newStatus = !driver?.is_online;

    // If going online, first get location
    if (newStatus) {
      const location = await requestLocationAndUpdate();
      if (!location) {
        Alert.alert(
          "Location Required",
          "You need to enable location access to go online and receive ride requests."
        );
        return;
      }
    }

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
      const response = await fetch(`${API_BASE}/api/corporate/driver/${userId}/set-online/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: newStatus }),
      });

      if (!response.ok) {
        let msg = "Failed to update status";
        try {
          const data = await response.json();
          msg = data.message || msg;
        } catch {}
        Alert.alert("Error", msg);
        setDriver((d) => ({ ...(d || {}), is_online: !newStatus }));
      }
    } catch (error) {
      console.log("Error toggling online status:", error);
      setDriver((d) => ({ ...(d || {}), is_online: !newStatus }));
    }
  }, [driver?.is_online, requestLocationAndUpdate, API_BASE]);

  const statusLabel = useMemo(() => {
    if (!isApproved) return "Pending Approval";
    return driver?.is_online ? "Online" : "Offline";
  }, [isApproved, driver?.is_online]);

  // -----------------------------
  // Actions: Accept / Reject
  // -----------------------------
  const acceptRide = useCallback(
    async (req) => {
      try {
        const userId = await getToken("userId");
        if (!userId) return;

        const body = req.offer_id ? { offer_id: req.offer_id } : { ride_request_id: req.id };

        const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/accept-ride/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          setAcceptedRideId(req.id);
          // navigate to pickup if coordinates exist
          if (req.pickup_latitude && req.pickup_longitude) {
            openGoogleMapsTo(req.pickup_latitude, req.pickup_longitude);
          }
          // refresh list
          fetchRideRequests();
        } else {
          // offer might have expired, refresh list
          fetchRideRequests();
        }
      } catch (e) {
        console.log("Error accepting ride:", e);
        Alert.alert("Error", "Could not accept ride. Please try again.");
      }
    },
    [API_BASE, openGoogleMapsTo, fetchRideRequests]
  );

  const rejectRide = useCallback(
    async (req) => {
      try {
        const userId = await getToken("userId");
        if (!userId) return;

        const body = req.offer_id ? { offer_id: req.offer_id } : { ride_request_id: req.id };

        const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/reject-ride/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          setRideRequests((prev) => prev.filter((r) => r.id !== req.id));
        } else {
          fetchRideRequests();
        }
      } catch (e) {
        console.log("Error rejecting ride:", e);
      }
    },
    [API_BASE, fetchRideRequests]
  );

  // -----------------------------
  // Render loading
  // -----------------------------
  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5EC6C6" />
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------
  // NOT APPROVED VIEW
  // -----------------------------
  if (!isApproved) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
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
      </SafeAreaView>
    );
  }

  // -----------------------------
  // APPROVED VIEW
  // -----------------------------
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Notification Banner */}
      <DashboardNotificationBanner
        visible={showNotificationBanner}
        notification={bannerNotification}
        onPress={() => {
          setShowNotificationModal(true);
          setShowNotificationBanner(false);
        }}
        onHide={() => setShowNotificationBanner(false)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5EC6C6" />}
      >
        {/* Premium Header */}
        <DashboardHeader
          driver={driver}
          notifications={notifications}
          setCurrentNotification={setCurrentNotification}
          setShowNotificationModal={setShowNotificationModal}
          navigation={navigation}
          statusLabel={statusLabel}
        />

        {/* Enhanced Stats Cards */}
        <DashboardStats
          todayEarnings={todayEarnings}
          todayTrips={todayTrips}
          onlineMinutes={onlineMinutes}
          driver={driver}
        />

        {/* Premium Online Toggle */}
        <DashboardOnlineToggle driver={driver} toggleOnline={toggleOnline} />

        {/* Map View */}
        <DashboardMapView
          driver={driver}
          driverLocation={driverLocation}
          rideRequests={rideRequests}
          mapRef={mapRef}
          styles={styles}
        />

        {/* Requests */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIcon, { backgroundColor: "rgba(251, 191, 36, 0.15)" }]}>
              <Ionicons name="flash" size={16} color="#fbbf24" />
            </View>
            <Text style={styles.sectionTitle}>Ride Requests</Text>
          </View>
          {rideRequests.length > 0 && (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>{rideRequests.length}</Text>
            </View>
          )}
        </View>

        {!driver?.is_online ? (
          <LinearGradient
            colors={["#1a2744", "#0f1a2e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconContainer}>
              <Ionicons name="moon" size={40} color="#6b7280" />
            </View>
            <Text style={styles.emptyTitle}>You're Offline</Text>
            <Text style={styles.emptySub}>
              Go online to start receiving ride requests from nearby customers.
            </Text>
          </LinearGradient>
        ) : rideRequests.length === 0 ? (
          <LinearGradient
            colors={["#1a2744", "#0f1a2e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconContainer}>
              <ActivityIndicator size="large" color="#5EC6C6" />
            </View>
            <Text style={styles.emptyTitle}>Searching for Rides...</Text>
            <Text style={styles.emptySub}>
              Stay online. New ride requests will appear here automatically.
            </Text>
          </LinearGradient>
        ) : (
          rideRequests.map((req, index) => {
            const countdown = offerCountdowns[req.id] ?? req.seconds_remaining ?? 0;
            const maxSec = offerMaxSeconds[req.id] ?? Math.max(Number(req.seconds_remaining ?? 20), 20);
            const isUrgent = req.is_offer && countdown <= 10 && countdown > 0;
            const isExpired = req.is_offer && countdown <= 0;
            const cardKey = `card-${req.id ?? "x"}-${index}`;
            return (
              <DashboardRideRequestCard
                key={cardKey}
                req={req}
                index={index}
                cardKey={cardKey}
                acceptedRideId={acceptedRideId}
                isUrgent={isUrgent}
                isExpired={isExpired}
                pulseAnim={pulseAnim}
                openGoogleMapsTo={openGoogleMapsTo}
                acceptRide={acceptRide}
                rejectRide={rejectRide}
                getToken={getToken}
                API_BASE={API_BASE}
                styles={styles}
              />
            );
          })
        )}

        <View style={{ height: 14 }} />
      </ScrollView>

      {/* Notification Modal */}
      <DashboardNotificationModal
        showNotificationModal={showNotificationModal}
        setShowNotificationModal={setShowNotificationModal}
        currentNotification={currentNotification}
        setCurrentNotification={setCurrentNotification}
        onRefresh={onRefresh}
        styles={styles}
      />
    </SafeAreaView>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  // Screen / Layout
  screen: { flex: 1, backgroundColor: "#0a0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0f1a" },
  shell: { padding: 18 },

  headerSub: { color: "#aeb9cc", marginTop: 6, fontWeight: "600" },
  statusRow: { marginTop: 12 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { color: "#fff", fontWeight: "800" },

  // Premium Header
  header: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatarContainer: { position: "relative" },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "900" },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0a0f1a",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicatorInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10b981" },
  welcomeText: { marginLeft: 14 },
  greeting: { color: "#6b7280", fontSize: 13, fontWeight: "600", marginBottom: 2 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },

  headerActions: { flexDirection: "row", gap: 8 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 16,
    padding: 16,
  },
  ratingItem: { alignItems: "center", flex: 1 },
  ratingValue: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 6 },
  ratingLabel: { color: "#6b7280", fontSize: 11, fontWeight: "600", marginTop: 2 },
  ratingDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.1)" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

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
  primaryBtn: { backgroundColor: "#2f66ff", paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  linkBtn: { marginTop: 12, alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#aeb9cc", fontWeight: "800" },

  // Enhanced Stats Grid
  statsGrid: { flexDirection: "row", gap: 10, marginTop: 16 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#6b7280", fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" },

  // Premium Online Toggle Card
  onlineCard: {
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  onlineCardActive: {
    ...Platform.select({
      ios: { shadowColor: "#5EC6C6", shadowOpacity: 0.3 },
    }),
  },
  onlineCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18 },
  onlineLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  powerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(107, 114, 128, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(107, 114, 128, 0.3)",
  },
  powerButtonActive: { backgroundColor: "rgba(94, 198, 198, 0.15)", borderColor: "rgba(94, 198, 198, 0.4)" },
  onlineTextContainer: { marginLeft: 16, flex: 1 },
  onlineTitle: { color: "#fff", fontWeight: "900", fontSize: 17 },
  onlineSub: { color: "#6b7280", fontWeight: "600", marginTop: 4, fontSize: 13 },
  onlineToggle: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  onlineToggleActive: { backgroundColor: "#5EC6C6", borderColor: "#5EC6C6" },
  onlineToggleText: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 1 },
  onlineToggleTextActive: { color: "#0a0f1a" },

  // Section Headers
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 14 },
  sectionTitleContainer: { flexDirection: "row", alignItems: "center" },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(94, 198, 198, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 17 },
  sectionSubtitle: { color: "#5EC6C6", fontSize: 12, fontWeight: "700" },
  requestBadge: { backgroundColor: "#ef4444", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  requestBadgeText: { color: "#fff", fontSize: 12, fontWeight: "900" },

  // Map
  mapContainer: {
    height: 300,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  map: { width: "100%", height: "100%" },
  mapOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(11, 18, 32, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Enhanced Empty state
  emptyState: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 18, textAlign: "center" },
  emptySub: { color: "#6b7280", fontWeight: "600", marginTop: 8, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },

  // Enhanced Request card
  requestCard: {
    backgroundColor: "#0f1724",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  offerCard: { borderColor: "#5EC6C6", borderWidth: 2, backgroundColor: "#0a1520" },
  urgentCard: { borderColor: "#ef4444", backgroundColor: "#1a0f14" },

  // Countdown timer
  countdownBanner: {
    backgroundColor: "rgba(94, 198, 198, 0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(94, 198, 198, 0.3)",
  },
  countdownUrgent: { backgroundColor: "rgba(255, 107, 107, 0.15)", borderColor: "rgba(255, 107, 107, 0.3)" },
  countdownText: { color: "#fff", fontWeight: "900", fontSize: 16, textAlign: "center", marginBottom: 8 },
  countdownBar: { height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  countdownProgress: { height: "100%", backgroundColor: "#5EC6C6", borderRadius: 3 },
  countdownProgressUrgent: { backgroundColor: "#ff6b6b" },

  expiredBanner: {
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    alignItems: "center",
  },
  expiredText: { color: "#ff6b6b", fontWeight: "900", fontSize: 14 },
  expiredActions: { flex: 1, alignItems: "center", padding: 8 },
  expiredActionText: { color: "#aeb9cc", fontWeight: "600", textAlign: "center" },

  requestTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  requestTitle: { color: "#fff", fontWeight: "900", fontSize: 15 },
  distanceText: { color: "#5EC6C6", fontWeight: "700", fontSize: 12, marginTop: 4 },

  farePill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  fareText: { color: "#10b981", fontWeight: "900", fontSize: 18 },

  routeLabel: { color: "#6b7280", fontWeight: "700", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  routeValue: { color: "#fff", fontWeight: "700", marginTop: 4, fontSize: 14, lineHeight: 20 },

  tripInfoRow: { flexDirection: "row", gap: 16 },
  tripInfoItem: { flex: 1 },

  hr: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 12 },

  actionsRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  acceptBtn: {
    flex: 2,
    backgroundColor: "#5EC6C6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#5EC6C6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  acceptBtnUrgent: { backgroundColor: "#10b981" },
  acceptText: { color: "#0a0f1a", fontWeight: "600", fontSize: 12 },
  rejectBtn: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  rejectText: { color: "#ef4444", fontWeight: "900", fontSize: 14 },

  // Notification Modal
  notificationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notificationModalContent: {
    backgroundColor: "#1a2438",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  notificationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  notificationTitle: { color: "#fff", fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: 12 },
  notificationMessage: { color: "#aeb9cc", fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  notificationDismissBtn: { backgroundColor: "#2f66ff", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, width: "100%", alignItems: "center" },
  notificationDismissBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
