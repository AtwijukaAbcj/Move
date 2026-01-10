// DashboardMapView.js
// Map view for the driver dashboard
import React from "react";
import { View, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardMapView({ driver, driverLocation, rideRequests, mapRef, styles }) {
  if (!driver?.is_online || !driverLocation) return null;
  return (
    <>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionIcon}>
            <Ionicons name="location" size={16} color="#5EC6C6" />
          </View>
          <Text style={styles.sectionTitle}>Nearby Requests</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Live view</Text>
      </View>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={driverLocation}
          showsUserLocation
          showsMyLocationButton
        >
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="You are here"
            description="Your current location"
            pinColor="#5EC6C6"
          />
          {rideRequests.map((req, index) => {
            const lat = req.pickup_latitude ?? driverLocation.latitude + (Math.random() - 0.5) * 0.02;
            const lng = req.pickup_longitude ?? driverLocation.longitude + (Math.random() - 0.5) * 0.02;
            const markerKey = `marker-${req.id ?? "x"}-${index}`;
            return (
              <Marker
                key={markerKey}
                coordinate={{ latitude: lat, longitude: lng }}
                title={`Pickup: ${req.pickup_address || "Request"}`}
                description={`Fare: $${req.fare || "N/A"}`}
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
  );
}
