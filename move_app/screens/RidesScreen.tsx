import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../app/auth-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOOGLE_MAPS_API_KEY = "AIzaSyAEIJNjKs7Kxr5DstLl_Slzp5oCk8Ba2l0";
const BASE_URL = "http://192.168.1.31:8000";

export default function RidesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  if (!user) {
    router.replace("/login");
    return null;
  }

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<"pickup" | "destination" | null>(null);
  
  // Active ride state
  const [activeRide, setActiveRide] = useState<any>(null);
  const [checkingActiveRide, setCheckingActiveRide] = useState(true);

  // Check for active rides when screen loads
  useFocusEffect(
    React.useCallback(() => {
      checkForActiveRide();
    }, [])
  );

  const checkForActiveRide = async () => {
    try {
      setCheckingActiveRide(true);
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) {
        setCheckingActiveRide(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/corporate/customer/${customerId}/bookings/`);
      if (response.ok) {
        const bookings = await response.json();
        // Find any ride that is in progress (not completed, cancelled, or pending)
        const activeStatuses = ['driver_assigned', 'driver_arrived', 'in_progress', 'searching_driver'];
        const active = bookings.find((b: any) => activeStatuses.includes(b.status));
        
        if (active) {
          setActiveRide(active);
        } else {
          setActiveRide(null);
        }
      }
    } catch (error) {
      console.error("Error checking active ride:", error);
    } finally {
      setCheckingActiveRide(false);
    }
  };

  useEffect(() => {
    if (params.destination) {
      setDestination(params.destination as string);
    }
  }, [params.destination]);
  const [selectedRide, setSelectedRide] = useState<"standard" | "xl" | "premium">("standard");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [region, setRegion] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const rideOptions = useMemo(
    () => [
      { key: "standard", title: "MOVE Standard", subtitle: "Everyday rides", eta: "3–6 min", price: "—" },
      { key: "xl", title: "MOVE XL", subtitle: "More space", eta: "5–9 min", price: "—" },
      { key: "premium", title: "MOVE Premium", subtitle: "Top comfort", eta: "6–12 min", price: "—" },
    ],
    []
  );

  const canRequest = pickup.trim().length > 0 && destination.trim().length > 0;

  const searchPlaces = async (query: string, type: "pickup" | "destination") => {
    if (!query || query.length < 3) {
      if (type === "pickup") {
        setPickupSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:us`
      );
      const data = await response.json();
      
      if (data.predictions) {
        if (type === "pickup") {
          setPickupSuggestions(data.predictions);
        } else {
          setDestinationSuggestions(data.predictions);
        }
      }
    } catch (error) {
      console.error("Error fetching places:", error);
    }
  };

  const selectSuggestion = async (suggestion: any, type: "pickup" | "destination") => {
    if (type === "pickup") {
      setPickup(suggestion.description);
      setPickupSuggestions([]);
    } else {
      setDestination(suggestion.description);
      setDestinationSuggestions([]);
    }
    setActiveInput(null);

    // Fetch place details to get coordinates
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        if (type === "pickup") {
          setPickupCoords({ lat, lng });
          setRegion({ ...region, latitude: lat, longitude: lng });
        } else {
          setDestinationCoords({ lat, lng });
        }
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeInput === "pickup") {
        searchPlaces(pickup, "pickup");
      } else if (activeInput === "destination") {
        searchPlaces(destination, "destination");
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [pickup, destination, activeInput]);

  // Show loading while checking for active ride
  if (checkingActiveRide) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1F26' }]}>
        <ActivityIndicator size="large" color="#5EC6C6" />
        <Text style={{ color: '#fff', marginTop: 16, fontWeight: '700' }}>Checking ride status...</Text>
      </View>
    );
  }

  // Show active ride card if user has an ongoing ride
  if (activeRide) {
    const statusLabels: Record<string, string> = {
      'searching_driver': 'Searching for driver...',
      'driver_assigned': 'Driver is on the way',
      'driver_arrived': 'Driver has arrived',
      'in_progress': 'Ride in progress',
    };

    const hasDriver = activeRide.driver && activeRide.status !== 'searching_driver';

    return (
      <View style={[styles.container, { backgroundColor: '#1A1F26' }]}>
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.activeRideContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Icon */}
          <View style={[styles.activeRideIcon, hasDriver && { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
            <Ionicons 
              name={hasDriver ? "checkmark-circle" : "car-sport"} 
              size={48} 
              color={hasDriver ? "#4CAF50" : "#5EC6C6"} 
            />
          </View>
          
          <Text style={styles.activeRideTitle}>
            {hasDriver ? 'Driver Accepted!' : 'You have an active ride'}
          </Text>
          <Text style={styles.activeRideStatus}>{statusLabels[activeRide.status] || activeRide.status}</Text>
          
          {/* Driver Card - Show when driver is assigned */}
          {hasDriver && (
            <View style={styles.driverCard}>
              <View style={styles.driverCardHeader}>
                <View style={styles.driverAvatarContainer}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={28} color="#5EC6C6" />
                  </View>
                  <View style={styles.driverOnlineIndicator} />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{activeRide.driver.full_name || 'Your Driver'}</Text>
                  <View style={styles.driverRatingRow}>
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Text style={styles.driverRating}>{activeRide.driver.rating || '5.0'}</Text>
                    <Text style={styles.driverTrips}>• {activeRide.driver.total_trips || 0} trips</Text>
                  </View>
                </View>
                <View style={styles.driverActions}>
                  <TouchableOpacity 
                    style={styles.driverActionBtn}
                    onPress={() => {
                      if (activeRide.driver.phone) {
                        Linking.openURL(`tel:${activeRide.driver.phone}`);
                      }
                    }}
                  >
                    <Ionicons name="call" size={20} color="#5EC6C6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.driverActionBtn}
                    onPress={() => {
                      router.push({
                        pathname: '/chat',
                        params: { 
                          recipientId: activeRide.driver.id,
                          recipientName: activeRide.driver.full_name,
                          bookingId: activeRide.id
                        }
                      });
                    }}
                  >
                    <Ionicons name="chatbubble" size={20} color="#5EC6C6" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Vehicle Info */}
              <View style={styles.vehicleInfo}>
                <Ionicons name="car-sport" size={18} color="#9AA4B2" />
                <Text style={styles.vehicleText}>
                  {activeRide.driver.vehicle_type || 'Standard Vehicle'}
                </Text>
                {/* Vehicle Number Plate */}
                <View style={{ marginLeft: 16, backgroundColor: '#FFD700', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#23272F', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 }}>
                    {activeRide.driver.vehicle_number || 'MOV-0000'}
                  </Text>
                </View>
              </View>

              {/* ETA Badge */}
              <View style={styles.etaBadge}>
                <Ionicons name="time-outline" size={16} color="#5EC6C6" />
                <Text style={styles.etaBadgeText}>Arriving in 3-5 min</Text>
              </View>
            </View>
          )}
          
          <View style={styles.activeRideDetails}>
            <View style={styles.activeRideRow}>
              <Ionicons name="location" size={18} color="#5EC6C6" />
              <Text style={styles.activeRideText} numberOfLines={2}>{activeRide.pickup_location}</Text>
            </View>
            <View style={styles.activeRideDivider} />
            <View style={styles.activeRideRow}>
              <Ionicons name="flag" size={18} color="#FFA726" />
              <Text style={styles.activeRideText} numberOfLines={2}>{activeRide.destination}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.trackRideBtn}
            onPress={() => router.push({ pathname: '/ride-tracking', params: { bookingId: activeRide.id } })}
            activeOpacity={0.9}
          >
            <Ionicons name="navigate" size={20} color="#0f1a19" />
            <Text style={styles.trackRideBtnText}>Track Your Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelRideBtn}
            onPress={() => {
              Alert.alert(
                "Cancel Ride",
                "Are you sure you want to cancel this ride?",
                [
                  { text: "No", style: "cancel" },
                  { 
                    text: "Yes, Cancel", 
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const response = await fetch(`${BASE_URL}/api/corporate/bookings/${activeRide.id}/cancel/`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                        });
                        if (response.ok) {
                          Alert.alert("Cancelled", "Your ride has been cancelled.");
                          setActiveRide(null);
                        } else {
                          Alert.alert("Error", "Failed to cancel ride. Please try again.");
                        }
                      } catch (error) {
                        Alert.alert("Error", "Failed to cancel ride. Please try again.");
                      }
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.9}
          >
            <Ionicons name="close-circle" size={20} color="#FF5252" />
            <Text style={styles.cancelRideBtnText}>Cancel Ride</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => router.push('/home')}
            activeOpacity={0.9}
          >
            <Text style={styles.backHomeBtnText}>Back to Home</Text>
          </TouchableOpacity> */}
          
          {/* Spacer for floating nav */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Floating Bottom Navigation */}
        <View style={styles.floatingNav}>
          <TouchableOpacity 
            style={styles.floatingNavItem} 
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={24} color="rgba(255,255,255,0.65)" />
            <Text style={styles.floatingNavLabel}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.floatingNavItem} 
            onPress={() => router.push('/(tabs)/service')}
            activeOpacity={0.8}
          >
            <Ionicons name="apps-outline" size={24} color="rgba(255,255,255,0.65)" />
            <Text style={styles.floatingNavLabel}>Services</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.floatingNavItem} 
            onPress={() => router.push('/(tabs)/activity')}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={24} color="rgba(255,255,255,0.65)" />
            <Text style={styles.floatingNavLabel}>Activity</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.floatingNavItem} 
            onPress={() => router.push('/(tabs)/account')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={24} color="rgba(255,255,255,0.65)" />
            <Text style={styles.floatingNavLabel}>Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        {/* MAP */}
        <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion}>
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} title="Pickup" />
        </MapView>

        {/* TOP FLOATING HEADER */}
        <View style={styles.topHeader}>
          <TouchableOpacity 
            onPress={() => router.push("/account")} 
            style={styles.circleBtn} 
            activeOpacity={0.9}
          >
            <Ionicons name="person-circle-outline" size={22} color="#0f1a19" />
          </TouchableOpacity>

          <View style={styles.headerPill}>
            <Ionicons name="car-sport-outline" size={16} color="#35736E" />
            <Text style={styles.headerTitle}>Request a ride</Text>
          </View>

          <TouchableOpacity 
            style={styles.circleBtn} 
            activeOpacity={0.9}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#0f1a19" />
          </TouchableOpacity>
        </View>

        {/* BOTTOM SHEET */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* Location inputs */}
          <View style={styles.fieldStack}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: "rgba(94,198,198,0.18)" }]}>
                <Ionicons name="radio-button-on" size={14} color="#5EC6C6" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Pickup location"
                placeholderTextColor="#9AA4B2"
                value={pickup}
                onChangeText={(text) => {
                  setPickup(text);
                  setActiveInput("pickup");
                }}
                onFocus={() => setActiveInput("pickup")}
              />
              <Pressable onPress={() => {
                setPickup("");
                setPickupSuggestions([]);
              }} style={styles.clearBtn}>
                <Ionicons name="close" size={16} color="#9AA4B2" />
              </Pressable>
            </View>

            <View style={styles.connector} />

            <View style={styles.fieldRow}>
              <View style={[styles.fieldIcon, { backgroundColor: "rgba(255,167,38,0.18)" }]}>
                <Ionicons name="location" size={14} color="#FFA726" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Where to?"
                placeholderTextColor="#9AA4B2"
                value={destination}
                onChangeText={(text) => {
                  setDestination(text);
                  setActiveInput("destination");
                }}
                onFocus={() => setActiveInput("destination")}
              />
              <Pressable onPress={() => {
                setDestination("");
                setDestinationSuggestions([]);
              }} style={styles.clearBtn}>
                <Ionicons name="close" size={16} color="#9AA4B2" />
              </Pressable>
            </View>
          </View>

          {/* Suggestions Container - positioned relative to overlay content */}
          <View style={styles.suggestionsWrapper}>
            {/* Pickup Suggestions */}
            {activeInput === "pickup" && pickupSuggestions.length > 0 && (
              <ScrollView 
                style={styles.suggestionsContainer} 
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {pickupSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion, "pickup")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIcon}>
                      <Ionicons name="location-outline" size={18} color="#5EC6C6" />
                    </View>
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionMainText} numberOfLines={1}>
                        {suggestion.structured_formatting?.main_text || suggestion.description}
                      </Text>
                      <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                        {suggestion.structured_formatting?.secondary_text || ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Destination Suggestions */}
            {activeInput === "destination" && destinationSuggestions.length > 0 && (
              <ScrollView 
                style={styles.suggestionsContainer} 
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {destinationSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(suggestion, "destination")}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIcon}>
                      <Ionicons name="location-outline" size={18} color="#FFA726" />
                    </View>
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionMainText} numberOfLines={1}>
                        {suggestion.structured_formatting?.main_text || suggestion.description}
                      </Text>
                      <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                        {suggestion.structured_formatting?.secondary_text || ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
          
          {/* Quick chips - hidden when suggestions are showing */}
          {!(activeInput && (pickupSuggestions.length > 0 || destinationSuggestions.length > 0)) && (
          <View style={styles.chipsRow}>
            {/* Most recent shortcuts, e.g., Home and Work, could be dynamic in a real app */}
            <TouchableOpacity style={styles.chipOutline} activeOpacity={0.9}>
              <MaterialIcons name="home" size={16} color={THEME.primary} />
              <Text style={styles.chipTextOutline}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chipOutline} activeOpacity={0.9}>
              <MaterialIcons name="work" size={16} color={THEME.primary} />
              <Text style={styles.chipTextOutline}>Work</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.chipOutline} 
              activeOpacity={0.9}
              onPress={() => setShowScheduleModal(true)}
            >
              <Ionicons name="time-outline" size={16} color={THEME.primary} />
              <Text style={styles.chipTextOutline}>Schedule</Text>
            </TouchableOpacity>
          </View>
          )}

          {/* Ride options - hidden when suggestions are showing */}
          {!(activeInput && (pickupSuggestions.length > 0 || destinationSuggestions.length > 0)) && (
          <>
          <Text style={styles.sectionLabel}>Choose a ride</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {rideOptions.map((r) => {
              const active = selectedRide === (r.key as any);
              return (
                <TouchableOpacity
                  key={r.key}
                  activeOpacity={0.9}
                  onPress={() => setSelectedRide(r.key as any)}
                  style={[styles.rideCard, active && styles.rideCardActive]}
                >
                  <View style={styles.rideTop}>
                    <View style={[styles.rideIcon, active && styles.rideIconActive]}>
                      <Ionicons name="car-sport" size={18} color={active ? "#0f1a19" : "#35736E"} />
                    </View>
                    <Text style={[styles.ridePrice, active && { color: "#0f1a19" }]}>{r.price}</Text>
                  </View>

                  <Text style={[styles.rideTitle, active && { color: "#0f1a19" }]}>{r.title}</Text>
                  <Text style={[styles.rideSub, active && { color: "rgba(15,26,25,0.75)" }]}>{r.subtitle}</Text>

                  <View style={styles.etaRow}>
                    <Ionicons name="time-outline" size={14} color={active ? "#0f1a19" : "#7B8794"} />
                    <Text style={[styles.etaText, active && { color: "#0f1a19" }]}>{r.eta}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, !canRequest && { opacity: 0.55 }]}
            activeOpacity={0.9}
            disabled={!canRequest}
            onPress={() => {
              router.push({
                pathname: "/booking-confirm",
                params: {
                  pickup,
                  destination,
                  selectedRide,
                  pickupLat: pickupCoords?.lat?.toString() || "",
                  pickupLng: pickupCoords?.lng?.toString() || "",
                  destLat: destinationCoords?.lat?.toString() || "",
                  destLng: destinationCoords?.lng?.toString() || "",
                }
              });
            }}
          >
            <Text style={styles.primaryBtnText}>Request {selectedRide === "standard" ? "Standard" : selectedRide === "xl" ? "XL" : "Premium"}</Text>
            <Ionicons name="arrow-forward" size={18} color="#0f1a19" />
          </TouchableOpacity>

          <Text style={styles.helperText}>Tip: Add pickup & destination to enable request.</Text>
          </>
          )}
        </View>

        {/* Schedule Modal */}
        <Modal
          visible={showScheduleModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowScheduleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.scheduleModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Schedule a Ride</Text>
                <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                  <Ionicons name="close" size={24} color="#0f1a19" />
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Select Date</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#35736E" />
                  <Text style={styles.dateTimeText}>
                    {scheduledDate.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.scheduleLabel, { marginTop: 16 }]}>Select Time</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#35736E" />
                  <Text style={styles.dateTimeText}>
                    {scheduledTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={scheduledDate}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) setScheduledDate(date);
                    }}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={scheduledTime}
                    mode="time"
                    onChange={(event, time) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (time) setScheduledTime(time);
                    }}
                  />
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 24 }]}
                  onPress={() => {
                    const combinedDateTime = new Date(
                      scheduledDate.getFullYear(),
                      scheduledDate.getMonth(),
                      scheduledDate.getDate(),
                      scheduledTime.getHours(),
                      scheduledTime.getMinutes()
                    );
                    setShowScheduleModal(false);
                    router.push({
                      pathname: "/booking-confirm",
                      params: {
                        pickup,
                        destination,
                        selectedRide,
                        scheduled: "true",
                        scheduledDateTime: combinedDateTime.toISOString(),
                        pickupLat: pickupCoords?.lat?.toString() || "",
                        pickupLng: pickupCoords?.lng?.toString() || "",
                        destLat: destinationCoords?.lat?.toString() || "",
                        destLng: destinationCoords?.lng?.toString() || "",
                      }
                    });
                  }}
                  disabled={!canRequest}
                >
                  <Text style={styles.primaryBtnText}>Schedule Ride</Text>
                  <Ionicons name="checkmark" size={18} color="#0f1a19" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const THEME = {
  primary: "#35736E",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.dark },

  map: {
    flex: 1,
    width: "100%",
  },

  /* Top floating header */
  topHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 20,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    shadowColor: "#111",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitle: { fontWeight: "900", color: THEME.primary, fontSize: 14 },

  /* Bottom sheet */
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.dark,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 26 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 12,
  },

  fieldStack: {
    backgroundColor: "#2D313A",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 10,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  connector: {
    height: 14,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255,255,255,0.10)",
    marginLeft: 14,
    marginVertical: 2,
  },

  chipsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  chipOutline: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  chipTextOutline: {
    color: THEME.primary,
    fontWeight: "900",
    fontSize: 12,
  },

  sectionLabel: {
    color: "rgba(255,255,255,0.78)",
    marginTop: 14,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  rideCard: {
    width: 170,
    marginRight: 12,
    backgroundColor: "#2D313A",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  rideCardActive: {
    backgroundColor: THEME.accent,
    borderColor: "rgba(255,255,255,0.0)",
  },
  rideTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rideIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  rideIconActive: { backgroundColor: "rgba(255,255,255,0.65)" },
  ridePrice: { color: "#fff", fontWeight: "900" },
  rideTitle: { marginTop: 10, color: "#fff", fontWeight: "900", fontSize: 14 },
  rideSub: { marginTop: 4, color: "rgba(255,255,255,0.70)", fontWeight: "700", fontSize: 12 },
  etaRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  etaText: { color: "#C7CED9", fontWeight: "900", fontSize: 12 },

  primaryBtn: {
    marginTop: 10,
    backgroundColor: THEME.aqua,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnText: { color: THEME.ink, fontWeight: "900", fontSize: 15 },

  helperText: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    fontSize: 12,
  },

  /* Schedule Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  scheduleModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f1a19",
  },
  scheduleContent: {
    padding: 20,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f1a19",
    marginBottom: 10,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(53,115,110,0.08)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(53,115,110,0.15)",
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0f1a19",
  },

  /* Suggestions */
  suggestionsWrapper: {
    position: "relative",
    zIndex: 1000,
  },
  suggestionsContainer: {
    maxHeight: 280,
    backgroundColor: "#2D313A",
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: {
    flex: 1,
  },
  suggestionMainText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Active Ride Blocker */
  activeRideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  activeRideIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(94,198,198,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  activeRideTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  activeRideStatus: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5EC6C6",
    textAlign: "center",
    marginBottom: 24,
  },
  activeRideDetails: {
    width: "100%",
    backgroundColor: "#252B35",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  activeRideRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activeRideDivider: {
    width: 2,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 8,
    marginVertical: 8,
  },
  activeRideText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  trackRideBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: "#5EC6C6",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  trackRideBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f1a19",
  },
  cancelRideBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    backgroundColor: "rgba(255,82,82,0.15)",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.3)",
  },
  cancelRideBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FF5252",
  },
  backHomeBtn: {
    paddingVertical: 12,
  },
  backHomeBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
  },

  /* Driver Card Styles */
  driverCard: {
    width: "100%",
    backgroundColor: "#252B35",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.2)",
  },
  driverCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  driverAvatarContainer: {
    position: "relative",
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(94,198,198,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  driverOnlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#252B35",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 14,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  driverRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  driverRating: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFC107",
  },
  driverTrips: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginLeft: 4,
  },
  driverActions: {
    flexDirection: "row",
    gap: 10,
  },
  driverActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(94,198,198,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9AA4B2",
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(94,198,198,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  etaBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#5EC6C6",
  },

  /* Floating Navigation */
  floatingNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#23272F",
    borderTopWidth: 0,
    height: Platform.OS === "ios" ? 88 : 72,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    marginHorizontal: 12,
    marginBottom: Platform.OS === "ios" ? 20 : 12,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  floatingNavItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 6,
  },
  floatingNavLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
  },
});
