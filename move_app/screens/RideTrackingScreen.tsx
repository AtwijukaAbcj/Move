import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_STEPS = [
  { key: "driver_assigned", label: "Driver Assigned", icon: "account-check" as const },
  { key: "driver_arrived", label: "Driver Arrived", icon: "map-marker-check" as const },
  { key: "picked_up", label: "Picked Up", icon: "car" as const },
  { key: "in_progress", label: "In Progress", icon: "progress-clock" as const },
  { key: "completed", label: "Completed", icon: "check-circle" as const },
];

const { width, height } = Dimensions.get("window");

interface DriverInfo {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  rating: number;
}

const COLORS = {
  bg: "#0B1220",
  panel: "#101A2E",
  card: "#0F1A2B",
  card2: "#0C1628",
  border: "rgba(255,255,255,0.10)",
  muted: "rgba(255,255,255,0.65)",
  muted2: "rgba(255,255,255,0.45)",
  text: "#FFFFFF",
  brand: "#5EC6C6",
  brand2: "#67D1C8",
  warn: "#FFA726",
  gold: "#FFD700",
  danger: "#FF5D5D",
};

function prettyStatus(s: string) {
  return (s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function statusColor(status: string) {
  if (status === "completed") return "#3DDC84";
  if (status === "driver_arrived") return COLORS.warn;
  if (status === "picked_up" || status === "in_progress") return COLORS.brand;
  return COLORS.brand2;
}

export default function RideTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [rideStatus, setRideStatus] = useState("driver_assigned");
  const [driverLocation, setDriverLocation] = useState({ latitude: 6.5244, longitude: 3.3792 });
  const [pickup, setPickup] = useState({ latitude: 6.5244, longitude: 3.3792 });
  const [destination, setDestination] = useState({ latitude: 6.5344, longitude: 3.3892 });
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mapRef = useRef<MapView | null>(null);

  const statusIndex = useMemo(() => {
    const idx = STATUS_STEPS.findIndex((s) => s.key === rideStatus);
    return idx === -1 ? 0 : idx;
  }, [rideStatus]);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const refreshOnce = async () => {
    if (!params.rideId) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `http://192.168.1.31:8000/api/corporate/bookings/${params.rideId}/tracking/`
      );
      if (res.ok) {
        const data = await res.json();

        if (data.status) setRideStatus(data.status);

        if (data.driver_location?.latitude && data.driver_location?.longitude) {
          setDriverLocation({
            latitude: data.driver_location.latitude,
            longitude: data.driver_location.longitude,
          });
        }

        if (data.pickup?.latitude && data.pickup?.longitude) {
          setPickup({
            latitude: data.pickup.latitude,
            longitude: data.pickup.longitude,
          });
        }

        if (data.destination?.latitude && data.destination?.longitude) {
          setDestination({
            latitude: data.destination.latitude,
            longitude: data.destination.longitude,
          });
        }

        if (data.driver) setDriver(data.driver);
      }
    } catch (e) {
      console.log("Error fetching tracking:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Poll backend for live ride status and driver location
  useEffect(() => {
    if (!params.rideId) return;
    let interval: ReturnType<typeof setInterval>;

    refreshOnce();
    interval = setInterval(refreshOnce, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.rideId]);

  // Fit map when important points change
  useEffect(() => {
    const points = [pickup, driverLocation, destination].filter(Boolean);
    if (!mapRef.current || points.length < 2) return;

    // Give room for the bottom sheet
    mapRef.current.fitToCoordinates(points, {
      edgePadding: {
        top: 120,
        right: 40,
        bottom: 320,
        left: 40,
      },
      animated: true,
    });
  }, [pickup, driverLocation, destination]);

  const callDriver = () => {
    if (!driver?.phone) return;
    Linking.openURL(`tel:${driver.phone}`);
  };

  const messageDriver = () => {
    if (!driver?.phone) return;
    const url = Platform.select({
      ios: `sms:${driver.phone}`,
      android: `sms:${driver.phone}`,
      default: `sms:${driver.phone}`,
    });
    if (url) Linking.openURL(url);
  };

  const centerOnDriver = () => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      450
    );
  };

  const renderStepper = () => {
    return (
      <View style={styles.stepperWrap}>
        {STATUS_STEPS.map((step, i) => {
          const active = i <= statusIndex;
          const isCurrent = i === statusIndex;

          const dotScale = pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.12],
          });

          return (
            <View key={step.key} style={styles.stepItem}>
              <Animated.View
                style={[
                  styles.stepDot,
                  active && styles.stepDotActive,
                  isCurrent && { transform: [{ scale: dotScale }] },
                ]}
              >
                <MaterialCommunityIcons
                  name={step.icon}
                  size={15}
                  color={active ? "#062A2A" : "rgba(255,255,255,0.55)"}
                />
              </Animated.View>

              <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>
                {step.label}
              </Text>

              {i < STATUS_STEPS.length - 1 && (
                <View style={styles.stepLineWrap}>
                  <View style={[styles.stepLine, active && styles.stepLineActive]} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const statusPillColor = statusColor(rideStatus);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["rgba(94,198,198,0.18)", "rgba(11,18,32,0.0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={styles.headerTitle}>Live Ride Tracking</Text>
          <View style={styles.headerSubtitleRow}>
            <View style={[styles.statusPill, { borderColor: statusPillColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusPillColor }]} />
              <Text style={styles.statusPillText}>{prettyStatus(rideStatus)}</Text>
            </View>

            <TouchableOpacity
              onPress={refreshOnce}
              style={[styles.smallBtn, isRefreshing && { opacity: 0.7 }]}
              activeOpacity={0.85}
              disabled={isRefreshing}
            >
              <Ionicons name="refresh" size={16} color={COLORS.text} />
              <Text style={styles.smallBtnText}>{isRefreshing ? "Updating" : "Refresh"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* <TouchableOpacity onPress={() => router.push("/home")} style={styles.iconBtn} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={20} color={COLORS.text} />
        </TouchableOpacity> */}
      </View>

      {/* Stepper */}
      <View style={styles.stepperPanel}>{renderStepper()}</View>

      {/* Map */}
      <View style={styles.mapWrap}>
        <MapView
          ref={(r) => { mapRef.current = r; }}
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          mapPadding={{ top: 140, right: 0, bottom: 320, left: 0 }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          <Marker coordinate={pickup} title="Pickup" pinColor={COLORS.brand} />
          <Marker coordinate={destination} title="Destination" pinColor={COLORS.warn} />
          <Marker coordinate={driverLocation} title="Driver" pinColor={COLORS.brand2} />

          <Polyline coordinates={[pickup, driverLocation, destination]} strokeColor={COLORS.brand} strokeWidth={4} />
        </MapView>

        {/* Floating actions */}
        <View style={styles.fabColumn}>
          <TouchableOpacity style={styles.fab} onPress={centerOnDriver} activeOpacity={0.85}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={callDriver} activeOpacity={0.85} disabled={!driver?.phone}>
            <Ionicons name="call" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={messageDriver} activeOpacity={0.85} disabled={!driver?.phone}>
            <Ionicons name="chatbubbles" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Bottom sheet */}
        <View style={styles.bottomSheet}>
          {rideStatus === "driver_arrived" && (
            <View style={styles.banner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.warn} />
              <Text style={styles.bannerText}>Your driver has arrived at the pickup location.</Text>
            </View>
          )}

          {driver ? (
            <>
              <View style={styles.driverTopRow}>
                <View style={styles.driverAvatar}>
                  <FontAwesome5 name="user-alt" size={22} color={COLORS.brand} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.driverName} numberOfLines={1}>
                    {driver.name}
                  </Text>
                  <View style={styles.driverMetaRow}>
                    <MaterialCommunityIcons name="star" size={16} color={COLORS.gold} />
                    <Text style={styles.driverRating}>{(driver.rating ?? 4.5).toFixed(1)}</Text>
                    <Text style={styles.dotSep}>•</Text>
                    <Text style={styles.driverMetaText}>{driver.vehicle_type || "Standard"}</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={callDriver} style={styles.primaryBtn} activeOpacity={0.85}>
                  <Ionicons name="call" size={18} color="#041B1B" />
                  <Text style={styles.primaryBtnText}>Call</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.plateRow}>
                <View style={styles.plateLeft}>
                  <MaterialCommunityIcons name="car-side" size={18} color={COLORS.brand} />
                  <Text style={styles.plateLabel}>Plate</Text>
                </View>
                <View style={styles.plateBox}>
                  <Text style={styles.plateText}>{driver.vehicle_number || "MOV-0000"}</Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {driver.phone || "—"}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ride Status</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {prettyStatus(rideStatus)}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyDriver}>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: "55%", marginTop: 10 }]} />
                </View>
              </View>
              <Text style={styles.emptyDriverText}>Waiting for driver details…</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: 0,
  },

  header: {
    zIndex: 2,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "android" ? 6 : 2,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  headerSubtitleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },

  statusPillText: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 12,
  },

  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  smallBtnText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  stepperPanel: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },

  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  stepItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepDotActive: {
    backgroundColor: COLORS.brand,
    borderColor: "rgba(94,198,198,0.9)",
  },

  stepLabel: {
    marginLeft: 8,
    color: COLORS.muted2,
    fontSize: 11,
    fontWeight: "800",
    flexShrink: 1,
  },

  stepLabelActive: {
    color: COLORS.text,
  },

  stepLineWrap: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },

  stepLine: {
    height: 3,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  stepLineActive: {
    backgroundColor: "rgba(94,198,198,0.9)",
  },

  mapWrap: {
    flex: 1,
    overflow: "hidden",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    marginHorizontal: 12,
  },

  map: {
    width: "100%",
    height: "100%",
  },

  fabColumn: {
    position: "absolute",
    right: 12,
    top: 16,
    gap: 10,
  },

  fab: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,26,43,0.92)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(15,26,43,0.96)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,167,38,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,167,38,0.35)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  bannerText: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
    flex: 1,
  },

  driverTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(94,198,198,0.14)",
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.35)",
  },

  driverName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  driverMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  driverRating: {
    color: COLORS.gold,
    fontWeight: "900",
    marginLeft: 6,
    fontSize: 13,
  },

  dotSep: {
    color: COLORS.muted2,
    marginHorizontal: 8,
    fontWeight: "900",
  },

  driverMetaText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 13,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.brand,
    marginLeft: 10,
  },

  primaryBtnText: {
    color: "#041B1B",
    fontWeight: "900",
    fontSize: 13,
  },

  plateRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  plateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  plateLabel: {
    color: COLORS.muted,
    fontWeight: "900",
    fontSize: 13,
  },

  plateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.35)",
    paddingVertical: 10,
    borderRadius: 14,
  },

  plateText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  detailsGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },

  detailItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  detailLabel: {
    color: COLORS.muted2,
    fontSize: 12,
    fontWeight: "800",
  },

  detailValue: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },

  emptyDriver: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
  },

  emptyDriverText: {
    marginTop: 12,
    color: COLORS.muted,
    fontWeight: "800",
    textAlign: "center",
  },

  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonLine: {
    height: 12,
    width: "70%",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
