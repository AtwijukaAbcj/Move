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
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../app/auth-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';

const GOOGLE_MAPS_API_KEY = "AIzaSyAEIJNjKs7Kxr5DstLl_Slzp5oCk8Ba2l0";

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
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<"pickup" | "destination" | null>(null);

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
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:ug`
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

  const selectSuggestion = (suggestion: any, type: "pickup" | "destination") => {
    if (type === "pickup") {
      setPickup(suggestion.description);
      setPickupSuggestions([]);
    } else {
      setDestination(suggestion.description);
      setDestinationSuggestions([]);
    }
    setActiveInput(null);
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

          {/* Pickup Suggestions */}
          {activeInput === "pickup" && pickupSuggestions.length > 0 && (
            <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
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
            <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
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
          
          {/* Quick chips */}
          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.chip} activeOpacity={0.9}>
              <MaterialIcons name="home" size={16} color="#35736E" />
              <Text style={styles.chipText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chip} activeOpacity={0.9}>
              <MaterialIcons name="work" size={16} color="#35736E" />
              <Text style={styles.chipText}>Work</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.chip} 
              activeOpacity={0.9}
              onPress={() => setShowScheduleModal(true)}
            >
              <Ionicons name="time-outline" size={16} color="#35736E" />
              <Text style={styles.chipText}>Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* Ride options */}
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
                  selectedRide
                }
              });
            }}
          >
            <Text style={styles.primaryBtnText}>Request {selectedRide === "standard" ? "Standard" : selectedRide === "xl" ? "XL" : "Premium"}</Text>
            <Ionicons name="arrow-forward" size={18} color="#0f1a19" />
          </TouchableOpacity>

          <Text style={styles.helperText}>Tip: Add pickup & destination to enable request.</Text>
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
  chip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  chipText: {
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
  suggestionsContainer: {
    maxHeight: 220,
    backgroundColor: "#2D313A",
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
});
