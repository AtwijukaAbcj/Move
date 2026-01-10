// DashboardRideRequestCard.js
// UI-upgraded ride request card (chips, cleaner layout, better spacing, softer buttons)
// NOTE: uses your existing props + styles, but adds a few local style overrides.

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardRideRequestCard({
  req,
  index,
  cardKey,
  acceptedRideId,
  isUrgent,
  isExpired,
  pulseAnim,
  openGoogleMapsTo,
  acceptRide,
  rejectRide,
  getToken,
  API_BASE,
  styles,
}) {
  const money = useMemo(() => {
    const v = Number(req.fare ?? 0);
    if (Number.isNaN(v)) return "$0";
    return `$${v}`;
  }, [req.fare]);

  const label = useMemo(() => {
    if (req.is_offer) return "New Ride Offer";
    if (req.is_assigned_to_me) return "Assigned to You";
    return "Active Ride";
  }, [req.is_offer, req.is_assigned_to_me]);

  const accent = useMemo(() => {
    if (isExpired) return "#ef4444";
    if (req.is_offer) return "#fbbf24";
    if (req.is_assigned_to_me) return "#10b981";
    return "#5EC6C6";
  }, [isExpired, req.is_offer, req.is_assigned_to_me]);

  const iconName = useMemo(() => {
    if (req.is_offer) return "notifications";
    if (req.is_assigned_to_me) return "checkmark-circle";
    return "car-sport";
  }, [req.is_offer, req.is_assigned_to_me]);

  // ---------- Tiny local UI helpers ----------
  const softShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  });

  const chipBase = {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  };

  const miniBtn = {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  };

  const sectionTitle = (t) => (
    <Text style={[styles.routeLabel, { marginTop: 2 }]}>{t}</Text>
  );

  // ----------------------------
  // Accepted ride UI (4 action buttons)
  // ----------------------------
  if (acceptedRideId === req.id) {
    return (
      <Animated.View
        key={cardKey}
        style={[
          styles.requestCard,
          req.is_offer && styles.offerCard,
          { borderColor: "#10b981", borderWidth: 2 },
          softShadow,
          { paddingTop: 14 },
        ]}
      >
        {/* Top row */}
        <View style={[styles.requestTop, { alignItems: "center" }]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  chipBase,
                  {
                    backgroundColor: "rgba(16,185,129,0.12)",
                    borderColor: "rgba(16,185,129,0.35)",
                    marginRight: 10,
                  },
                ]}
              >
                <Text style={{ color: "#10b981", fontWeight: "900", fontSize: 12 }}>
                  ACCEPTED
                </Text>
              </View>

              <Text style={[styles.requestTitle, { fontSize: 16 }]}>
                Ready to Pick Up
              </Text>
            </View>

            {!!req.distance_to_pickup_km && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <Ionicons name="location" size={14} color="#6b7280" style={{ marginRight: 4 }} />
                <Text style={[styles.distanceText, { fontSize: 12 }]}>
                  {Number(req.distance_to_pickup_km).toFixed(1)} km to pickup
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.farePill, { borderRadius: 14 }]}>
            <Text style={[styles.fareText, { fontSize: 18 }]}>{money}</Text>
          </View>
        </View>

        {/* Route block */}
        <View style={{ marginTop: 12 }}>
          {sectionTitle("Pickup")}
          <Text style={[styles.routeValue, { fontSize: 15 }]} numberOfLines={2}>
            {req.pickup_address}
          </Text>

          <View style={[styles.hr, { marginVertical: 12 }]} />

          {sectionTitle("Destination")}
          <Text style={[styles.routeValue, { fontSize: 15 }]} numberOfLines={2}>
            {req.destination_address}
          </Text>
        </View>

        {/* Action buttons (2 rows, nicer) */}
        <View style={{ marginTop: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[
                miniBtn,
                {
                  backgroundColor: "rgba(16,185,129,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(16,185,129,0.35)",
                },
              ]}
              onPress={() => openGoogleMapsTo(req.pickup_latitude, req.pickup_longitude)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={18} color="#10b981" />
              <Text style={{ color: "#10b981", fontWeight: "900", fontSize: 13 }}>
                Pickup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                miniBtn,
                {
                  backgroundColor: "rgba(94,198,198,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(94,198,198,0.35)",
                },
              ]}
              onPress={async () => {
                try {
                  const userId = await getToken("userId");
                  const res = await fetch(`${API_BASE}/api/corporate/ride/${req.id}/start/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ driver_id: userId }),
                  });
                  if (res.ok) Alert.alert("Ride Started", "You have started the ride.");
                  else Alert.alert("Error", "Failed to start ride.");
                } catch (e) {
                  Alert.alert("Error", "Could not start ride.");
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={18} color="#5EC6C6" />
              <Text style={{ color: "#5EC6C6", fontWeight: "900", fontSize: 13 }}>
                Start
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[
                miniBtn,
                {
                  backgroundColor: "rgba(47,102,255,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(47,102,255,0.35)",
                },
              ]}
              onPress={() => {
                if (req.destination_latitude && req.destination_longitude) {
                  openGoogleMapsTo(req.destination_latitude, req.destination_longitude);
                } else {
                  Alert.alert("No Destination", "No destination coordinates available.");
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="map" size={18} color="#2f66ff" />
              <Text style={{ color: "#2f66ff", fontWeight: "900", fontSize: 13 }}>
                Destination
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                miniBtn,
                {
                  backgroundColor: "rgba(239,68,68,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.35)",
                },
              ]}
              onPress={async () => {
                try {
                  const userId = await getToken("userId");
                  const res = await fetch(`${API_BASE}/api/corporate/ride/${req.id}/end/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ driver_id: userId }),
                  });
                  if (res.ok) Alert.alert("Ride Ended", "You have ended the ride.");
                  else Alert.alert("Error", "Failed to end ride.");
                } catch (e) {
                  Alert.alert("Error", "Could not end ride.");
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="stop" size={18} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 13 }}>
                End
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ----------------------------
  // Offer / Active / Expired cards (cleaner + chips)
  // ----------------------------
  return (
    <Animated.View
      key={cardKey}
      style={[
        styles.requestCard,
        req.is_offer && styles.offerCard,
        isUrgent && styles.urgentCard,
        softShadow,
        { transform: [{ scale: isUrgent && pulseAnim ? pulseAnim : 1 }] },
      ]}
    >
      {/* Top badge row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={[
              chipBase,
              {
                backgroundColor: `${accent}22`,
                borderColor: `${accent}55`,
              },
            ]}
          >
            <Text style={{ color: accent, fontWeight: "900", fontSize: 12 }}>
              {isExpired ? "EXPIRED" : req.is_offer ? "OFFER" : req.is_assigned_to_me ? "ASSIGNED" : "ACTIVE"}
            </Text>
          </View>

          {req.distance_to_pickup_km != null && (
            <View
              style={[
                chipBase,
                {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.10)",
                },
              ]}
            >
              <Text style={{ color: "#aeb9cc", fontWeight: "800", fontSize: 12 }}>
                {Number(req.distance_to_pickup_km).toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.farePill, { borderRadius: 14 }]}>
          <Text style={[styles.fareText, { fontSize: 18 }]}>{money}</Text>
        </View>
      </View>

      {/* Countdown Timer for Offers */}
      {req.is_offer && !isExpired && (
        <View style={[styles.countdownBanner, isUrgent && styles.countdownUrgent, { marginTop: 12 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="time-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.countdownText}>Respond in {req.seconds_remaining ?? 0}s</Text>
          </View>

          <View style={[styles.countdownBar, { marginTop: 8 }]}>
            <View
              style={[
                styles.countdownProgress,
                {
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      ((req.seconds_remaining ?? 0) / Math.max(Number(req.seconds_remaining ?? 20), 20)) * 100
                    )
                  )}%`,
                },
                isUrgent && styles.countdownProgressUrgent,
              ]}
            />
          </View>
        </View>
      )}

      {req.is_offer && isExpired && (
        <View style={[styles.expiredBanner, { marginTop: 12 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="alarm-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.expiredText}>Offer Expired</Text>
          </View>
        </View>
      )}

      {/* Title row */}
      <View style={[styles.requestTop, { marginTop: 14 }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name={iconName} size={18} color={accent} style={{ marginRight: 8 }} />
            <Text style={[styles.requestTitle, { fontSize: 16 }]}>{label}</Text>
          </View>

          {req.customer_name ? (
            <Text style={{ color: "#aeb9cc", marginTop: 6, fontWeight: "700" }} numberOfLines={1}>
              {req.customer_name}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Route block */}
      <View style={{ marginTop: 12 }}>
        {sectionTitle("Pickup")}
        <Text style={[styles.routeValue, { fontSize: 15 }]} numberOfLines={2}>
          {req.pickup_address}
        </Text>

        <View style={[styles.hr, { marginVertical: 12 }]} />

        {sectionTitle("Destination")}
        <Text style={[styles.routeValue, { fontSize: 15 }]} numberOfLines={2}>
          {req.destination_address}
        </Text>

        {(req.distance || req.duration) && (
          <>
            <View style={[styles.hr, { marginVertical: 12 }]} />
            <View style={[styles.tripInfoRow, { gap: 12 }]}>
              {req.distance ? (
                <View style={styles.tripInfoItem}>
                  <Text style={styles.routeLabel}>Trip Distance</Text>
                  <Text style={[styles.routeValue, { fontSize: 14 }]}>{req.distance} km</Text>
                </View>
              ) : null}
              {req.duration ? (
                <View style={styles.tripInfoItem}>
                  <Text style={styles.routeLabel}>Est. Duration</Text>
                  <Text style={[styles.routeValue, { fontSize: 14 }]}>{req.duration}</Text>
                </View>
              ) : null}
            </View>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={[styles.actionsRow, { marginTop: 16 }]}>
        {!isExpired ? (
          <>
            <TouchableOpacity
              style={[
                styles.acceptBtn,
                isUrgent && styles.acceptBtnUrgent,
                { borderRadius: 16, paddingVertical: 14 },
              ]}
              onPress={() => acceptRide(req)}
              activeOpacity={0.9}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <Ionicons
                  name={req.is_offer ? "checkmark" : "navigate"}
                  size={18}
                  color="#0a0f1a"
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.acceptText, { fontSize: 14 }]}>
                  {req.is_offer ? "Accept Ride" : "Accept & Navigate"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rejectBtn, { borderRadius: 16, paddingVertical: 14 }]}
              onPress={() => rejectRide(req)}
              activeOpacity={0.9}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={18} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={[styles.rejectText, { fontSize: 14 }]}>Decline</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.expiredActions}>
            <Text style={styles.expiredActionText}>This offer has expired. Waiting for new offers...</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
