import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Linking } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const STATUS_STEPS = [
  { key: "driver_assigned", label: "Driver Assigned" },
  { key: "driver_arrived", label: "Driver Arrived" },
  { key: "picked_up", label: "Picked Up" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const { width } = Dimensions.get("window");

interface DriverInfo {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  rating: number;
}

export default function RideTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [rideStatus, setRideStatus] = useState("driver_assigned");
  const [driverLocation, setDriverLocation] = useState({ latitude: 6.5244, longitude: 3.3792 });
  const [pickup, setPickup] = useState({ latitude: 6.5244, longitude: 3.3792 });
  const [destination, setDestination] = useState({ latitude: 6.5344, longitude: 3.3892 });
  const [driver, setDriver] = useState<DriverInfo | null>(null);

  // Poll backend for live ride status and driver location
  useEffect(() => {
    if (!params.rideId) return;
    let interval: ReturnType<typeof setInterval>;
    const fetchTracking = async () => {
      try {
        const res = await fetch(`http://192.168.1.31:8000/api/corporate/bookings/${params.rideId}/tracking/`);
        if (res.ok) {
          const data = await res.json();
          // Update status
          if (data.status) setRideStatus(data.status);
          
          // Update driver location
          if (data.driver_location?.latitude && data.driver_location?.longitude) {
            setDriverLocation({
              latitude: data.driver_location.latitude,
              longitude: data.driver_location.longitude,
            });
          }
          
          // Update pickup location
          if (data.pickup?.latitude && data.pickup?.longitude) {
            setPickup({
              latitude: data.pickup.latitude,
              longitude: data.pickup.longitude,
            });
          }
          
          // Update destination
          if (data.destination?.latitude && data.destination?.longitude) {
            setDestination({
              latitude: data.destination.latitude,
              longitude: data.destination.longitude,
            });
          }
          
          // Update driver info
          if (data.driver) {
            setDriver(data.driver);
          }
        }
      } catch (e) {
        console.log("Error fetching tracking:", e);
      }
    };
    fetchTracking();
    interval = setInterval(fetchTracking, 5000);
    return () => clearInterval(interval);
  }, [params.rideId]);

  // Stepper UI
  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {STATUS_STEPS.map((step, i) => {
        const active = STATUS_STEPS.findIndex(s => s.key === rideStatus) >= i;
        return (
          <View key={step.key} style={styles.stepItem}>
            <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
              <Ionicons name="checkmark" size={16} color={active ? "#fff" : "#B0BEC5"} />
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{step.label}</Text>
            {i < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, active && styles.stepLineActive]} />}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#23272F" }}>
      <View style={{ paddingTop: 32, paddingBottom: 12, backgroundColor: "#23272F" }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center" }}>Live Ride Tracking</Text>
        {renderStepper()}
      </View>
      <MapView
        style={{ flex: 1, width }}
        initialRegion={{
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={pickup} title="Pickup" pinColor="#5EC6C6" />
        <Marker coordinate={destination} title="Destination" pinColor="#FFA726" />
        <Marker coordinate={driverLocation} title="Driver" pinColor="#67D1C8" />
        <Polyline
          coordinates={[pickup, driverLocation, destination]}
          strokeColor="#5EC6C6"
          strokeWidth={4}
        />
      </MapView>
      <View style={styles.statusBanner}>
        <Text style={styles.statusText}>Current Status: <Text style={{ fontWeight: "bold" }}>{rideStatus.replace("_", " ").toUpperCase()}</Text></Text>
        {rideStatus === "driver_arrived" && (
          <Text style={styles.arrivedBanner}>🚗 Your driver has arrived at the pickup location!</Text>
        )}
      </View>
      
      {/* Driver Info Card */}
      {driver && (
        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <FontAwesome5 name="user-alt" size={28} color="#5EC6C6" />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{driver.rating?.toFixed(1) || '4.5'}</Text>
                <Text style={styles.vehicleType}>• {driver.vehicle_type || 'Standard'}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => driver.phone && Linking.openURL(`tel:${driver.phone}`)}
            >
              <Ionicons name="call" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Vehicle Number Plate */}
          <View style={styles.plateContainer}>
            <MaterialCommunityIcons name="car-side" size={20} color="#5EC6C6" />
            <View style={styles.plateBox}>
              <Text style={styles.plateText}>{driver.vehicle_number || 'MOV-0000'}</Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={{ marginTop: 18, backgroundColor: '#23272F', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2D313A' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 8 }}>Driver Details</Text>
            <Text style={{ color: '#9AA4B2', fontWeight: '700', fontSize: 14 }}>Name: {driver.name}</Text>
            <Text style={{ color: '#9AA4B2', fontWeight: '700', fontSize: 14 }}>Phone: {driver.phone}</Text>
            <Text style={{ color: '#9AA4B2', fontWeight: '700', fontSize: 14 }}>Vehicle: {driver.vehicle_type || 'Standard'}</Text>
            <Text style={{ color: '#FFD700', fontWeight: '900', fontSize: 16, marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#23272F', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
              Plate: {driver.vehicle_number || 'MOV-0000'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2D313A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#B0BEC5",
  },
  stepCircleActive: {
    backgroundColor: "#5EC6C6",
    borderColor: "#5EC6C6",
  },
  stepLabel: {
    color: "#B0BEC5",
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 6,
  },
  stepLabelActive: {
    color: "#5EC6C6",
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: "#B0BEC5",
    marginHorizontal: 2,
  },
  stepLineActive: {
    backgroundColor: "#5EC6C6",
  },
  statusBanner: {
    padding: 16,
    backgroundColor: "#2D313A",
    borderTopWidth: 1,
    borderTopColor: "#23272F",
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  arrivedBanner: {
    color: "#FFA726",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },
  driverCard: {
    backgroundColor: "#2D313A",
    borderTopWidth: 1,
    borderTopColor: "#3D4149",
    padding: 16,
  },
  driverHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a1e26",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#5EC6C6",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 14,
  },
  driverName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  vehicleType: {
    color: "#B0BEC5",
    fontSize: 14,
    marginLeft: 8,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#5EC6C6",
    alignItems: "center",
    justifyContent: "center",
  },
  plateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#3D4149",
  },
  plateBox: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  plateText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
