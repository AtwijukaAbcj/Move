import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../app/auth-context";

const THEME = {
  primary: "#35736E",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

export default function BookingConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  
  const pickup = params.pickup as string || "Pick up location";
  const destination = params.destination as string || "Destination";
  const rideType = params.selectedRide as string || "standard";
  const rideId = params.rideId as string | undefined;
  const pickupLat = params.pickupLat as string || "";
  const pickupLng = params.pickupLng as string || "";
  const destLat = params.destLat as string || "";
  const destLng = params.destLng as string || "";
  const { token } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [distance, setDistance] = useState("0");
  const [duration, setDuration] = useState("0");
  const [contactPhone, setContactPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Get user details
    if (user) {
      setUserName(user.full_name || user.name || "");
      setUserEmail(user.email || "");
      // Pre-fill phone if available in user object
      if (user.phone) {
        setContactPhone(user.phone);
      }
    }
    // Calculate estimated fare based on ride type
    const baseFares = { standard: 15, xl: 25, premium: 35 };
    const fare = baseFares[rideType as keyof typeof baseFares] || 15;
    setEstimatedFare(fare + Math.random() * 10); // Add random amount for variation
    // Mock distance and duration
    setDistance((3 + Math.random() * 7).toFixed(1));
    setDuration((10 + Math.random() * 20).toFixed(0));

    // Fetch assigned driver info if rideId is present
    const fetchDriver = async () => {
      if (!rideId || !token) return;
      try {
        const response = await fetch(`http://192.168.1.31:8000/provider_service/ride-status/${rideId}/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
          },
        });
        const data = await response.json();
        if (data.driver) {
          setDriver(data.driver);
        }
      } catch (e) {
        console.log("Error fetching driver info", e);
      }
    };
    fetchDriver();
  }, [rideType, user, rideId, token]);

  const getRideInfo = () => {
    const rides = {
      standard: { title: "MOVE Standard", icon: "car-sport", color: "#5EC6C6" },
      xl: { title: "MOVE XL", icon: "car", color: "#FFA726" },
      premium: { title: "MOVE Premium", icon: "car-sport", color: "#9B59B6" },
    };
    return rides[rideType as keyof typeof rides] || rides.standard;
  };

  const rideInfo = getRideInfo();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Your Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mini Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 40.7128,
              longitude: -74.0060,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: 40.7128, longitude: -74.0060 }} pinColor="#5EC6C6" />
            <Marker coordinate={{ latitude: 40.7228, longitude: -73.9960 }} pinColor="#FFA726" />
            <Polyline
              coordinates={[
                { latitude: 40.7128, longitude: -74.0060 },
                { latitude: 40.7228, longitude: -73.9960 },
              ]}
              strokeColor={THEME.aqua}
              strokeWidth={3}
            />
          </MapView>
        </View>

        {/* Route Details */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeValue}>{pickup}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: THEME.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeValue}>{destination}</Text>
            </View>
          </View>
        </View>

        {/* Ride Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Ride</Text>
          <View style={styles.rideInfoRow}>
            <View style={[styles.rideIconBox, { backgroundColor: `${rideInfo.color}20` }]}>
              <Ionicons name={rideInfo.icon as any} size={24} color={rideInfo.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rideTitle}>{rideInfo.title}</Text>
              <View style={styles.rideMetaRow}>
                <Ionicons name="time-outline" size={14} color="#9AA4B2" />
                <Text style={styles.rideMeta}>{duration} min</Text>
                <Ionicons name="navigate-outline" size={14} color="#9AA4B2" style={{ marginLeft: 12 }} />
                <Text style={styles.rideMeta}>{distance} km</Text>
              </View>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.priceValue}>{estimatedFare.toFixed(2)}</Text>
            </View>
          </View>
          {/* Assigned Driver Info */}
          {driver && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Assigned Driver</Text>
              <Text style={{ color: '#9AA4B2', fontWeight: '700', fontSize: 14 }}>Name: {driver.full_name || driver.name}</Text>
              <Text style={{ color: '#9AA4B2', fontWeight: '700', fontSize: 14 }}>Phone: {driver.phone}</Text>
              <Text style={{ color: '#9AA4B2', fontWeight: '700', fontSize: 14 }}>Vehicle: {driver.vehicle_info || 'N/A'}</Text>
              <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 16, marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#23272F', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                Plate: {driver.vehicle_number || 'MOV-0000'}
              </Text>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base fare</Text>
            <Text style={styles.breakdownValue}>${(estimatedFare * 0.6).toFixed(2)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Distance ({distance} km)</Text>
            <Text style={styles.breakdownValue}>${(estimatedFare * 0.3).toFixed(2)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Service fee</Text>
            <Text style={styles.breakdownValue}>${(estimatedFare * 0.1).toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${estimatedFare.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Method Prompt */}

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Phone (Optional)</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#9AA4B2" />
            <TextInput
              style={styles.input}
              placeholder="Enter phone number for this ride"
              placeholderTextColor="#9AA4B2"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.helperText}>Optional: Add a phone number for the driver to reach you for this specific ride</Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.9}
          onPress={() => {
            router.push({
              pathname: "/payment-method",
              params: { 
                pickup, 
                destination, 
                rideType, 
                fare: estimatedFare.toFixed(2),
                distance,
                duration,
                contactPhone,
                pickupLat,
                pickupLng,
                destLat,
                destLng,
              }
            });
          }}
        >
          <Text style={styles.primaryBtnText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color={THEME.ink} />
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

  content: { flex: 1 },

  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  map: { flex: 1 },

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
    textTransform: "uppercase",
  },

  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: THEME.aqua,
    marginTop: 4,
  },
  routeLabel: { color: "#9AA4B2", fontSize: 12, fontWeight: "700", marginBottom: 4 },
  routeValue: { color: "#fff", fontSize: 15, fontWeight: "800" },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 5,
    marginVertical: 6,
  },

  rideInfoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rideIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rideTitle: { color: "#fff", fontSize: 16, fontWeight: "900", marginBottom: 4 },
  rideMetaRow: { flexDirection: "row", alignItems: "center" },
  rideMeta: { color: "#9AA4B2", fontSize: 12, fontWeight: "700", marginLeft: 4 },
  priceBox: { alignItems: "flex-end" },
  currency: { color: THEME.aqua, fontSize: 14, fontWeight: "800" },
  priceValue: { color: THEME.aqua, fontSize: 24, fontWeight: "900" },

  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  breakdownLabel: { color: "#9AA4B2", fontSize: 14, fontWeight: "700" },
  breakdownValue: { color: "#fff", fontSize: 14, fontWeight: "800" },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 12,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "900" },
  totalValue: { color: THEME.aqua, fontSize: 24, fontWeight: "900" },

  paymentPromptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentPromptTitle: { color: "#fff", fontSize: 15, fontWeight: "900", marginBottom: 2 },
  paymentPromptSub: { color: "#9AA4B2", fontSize: 13, fontWeight: "700" },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  infoValue: { color: "#fff", fontSize: 15, fontWeight: "700", flex: 1 },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  helperText: {
    color: "#9AA4B2",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  // Removed duplicate style keys below to fix compile errors
  // breakdownValue, divider, totalRow, totalLabel, totalValue, paymentPromptRow, paymentPromptTitle, paymentPromptSub

  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: THEME.dark,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  primaryBtn: {
    backgroundColor: THEME.aqua,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnText: { color: THEME.ink, fontSize: 16, fontWeight: "900" },
});
