import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ProviderService } from "../models/ProviderService";
import { fetchProviderServiceById } from "../api/providerServiceDetail";
import { createBooking } from "../api";
import { useAuth } from "../app/auth-context"; // ✅ adjust if you moved auth-context elsewhere
import { addNotification } from "../utils/notifications";
import { trackBooking } from "../utils/bookingStatusPoller";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.31:8000";

function resolveImg(img?: string | null) {
  if (!img) return null;
  return img.startsWith("http") ? img : `${BASE_URL}${img}`;
}

function money(amount: any, currency?: string) {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return null;
  return `${n.toLocaleString()} ${currency || ""}`.trim();
}

export default function ServiceDetailScreen() {
  const { providerServiceId } = useLocalSearchParams();
  const { token, user } = useAuth(); // ✅ Get user from auth context

  const [service, setService] = useState<ProviderService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // booking
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState(new Date());
  const [numberOfCars, setNumberOfCars] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const id = useMemo(() => {
    const raw = providerServiceId;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }, [providerServiceId]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("No service ID provided.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchProviderServiceById(Number(id), token ?? undefined)
      .then((data) => {
        setService(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch service details.");
        setLoading(false);
      });
  }, [id]);

  const images = useMemo(() => {
    if (!service) return [];
    return [service.image1, service.image2, service.image3, service.image4, service.image5]
      .map((x) => resolveImg(x as any))
      .filter(Boolean) as string[];
  }, [service]);

  const totalPassengers = numberOfCars * 4;
  const basePrice = (service as any)?.base_price || 0;
  const totalPrice = basePrice * numberOfCars;

  const headerTitle = service?.title || "Service Details";

  const pricePerCar = money((service as any)?.base_price, (service as any)?.currency) || "Price on request";
  const totalPriceText = numberOfCars > 1 
    ? `${money(totalPrice, (service as any)?.currency)} (${numberOfCars} cars)`
    : pricePerCar;

  const stats = useMemo(
    () => [
      {
        icon: "tag-outline",
        label: "Pricing",
        value: (service as any)?.pricing_type || "—",
      },
      {
        icon: "calendar-check-outline",
        label: "Booking",
        value: (service as any)?.booking_mode || "—",
      },
      {
        icon: "account-group-outline",
        label: "Passengers",
        value: String((service as any)?.max_passengers ?? "—"),
      },
      {
        icon: "bag-suitcase-outline",
        label: "Luggage",
        value: String((service as any)?.max_luggage ?? "—"),
      },
    ],
    [service]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.container}>
          <Stack.Screen options={{ title: headerTitle }} />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5EC6C6" />
            <Text style={styles.centerText}>Loading service...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.container}>
          <Stack.Screen options={{ title: headerTitle }} />
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={24} color="#FFB4A2" />
            <Text style={styles.error}>{error || "Service not found."}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Stack.Screen options={{ title: service.title }} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* HERO */}
          {images[0] ? (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => {
                setSelectedImage(images[0]);
                setModalVisible(true);
              }}
            >
              <View style={styles.hero}>
                <Image source={{ uri: images[0] }} style={styles.heroImg} resizeMode="cover" />
                <View style={styles.heroFade} />

                <View style={styles.heroTopRow}>
                  <View style={styles.pill}>
                    <Ionicons name="images-outline" size={14} color="#0f1a19" />
                    <Text style={styles.pillText}>{images.length} photos</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.pillBtn}
                    activeOpacity={0.9}
                    onPress={() => setBookingModalVisible(true)}
                  >
                    <Ionicons name="flash-outline" size={14} color="#0f1a19" />
                    <Text style={styles.pillText}>Book</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.heroBottom}>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {service.title}
                  </Text>
                  <View style={styles.heroPriceRow}>
                    <Text style={styles.heroPriceLabel}>Starting from</Text>
                    <Text style={styles.heroPrice}>{totalPriceText}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* THUMBNAILS */}
          {images.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbScroll}
            >
              {images.slice(1).map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedImage(img);
                    setModalVisible(true);
                  }}
                  style={styles.thumbWrap}
                >
                  <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {/* DETAILS CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderTitle}>About this service</Text>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#5EC6C6" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            </View>

            <Text style={styles.desc}>
              {(service as any)?.full_description ||
                (service as any)?.short_description ||
                "No description provided."}
            </Text>

            {/* SERVICE DETAILS (extra fields) */}
            <View style={{ marginTop: 14 }}>
              <Text style={{ color: "#fff", fontWeight: "900", marginBottom: 8 }}>
                Service details
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Service ID</Text>
                <Text style={styles.detailValue}>{String((service as any)?.id ?? "—")}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>
                  {String(
                    (service as any)?.service_category_name ||
                      (service as any)?.service_category?.name ||
                      (service as any)?.service_category ||
                      "—"
                  )}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailValue}>
                  {String(
                    (service as any)?.provider_name ||
                      (service as any)?.provider?.full_name ||
                      (service as any)?.provider?.name ||
                      "—"
                  )}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location Area</Text>
                <Text style={styles.detailValue}>
                  {String((service as any)?.location || (service as any)?.city || "—")}
                </Text>
              </View>
            </View>

            {/* STATS GRID */}
            <View style={styles.grid}>
              {stats.map((s) => (
                <View key={s.label} style={styles.gridItem}>
                  <View style={styles.gridIcon}>
                    <MaterialCommunityIcons name={s.icon as any} size={18} color="#5EC6C6" />
                  </View>
                  <Text style={styles.gridLabel}>{s.label}</Text>
                  <Text style={styles.gridValue} numberOfLines={1}>
                    {s.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* CTA BAR */}
            <View style={styles.ctaBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaSmall}>Total</Text>
                <Text style={styles.ctaBig}>{totalPriceText}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.92}
                style={styles.ctaBtn}
                onPress={() => setBookingModalVisible(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#0f1a19" />
                <Text style={styles.ctaBtnText}>Book now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* IMAGE MODAL */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBg}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <View style={styles.modalBody}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.modalImg} resizeMode="contain" />
              ) : null}
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* BOOKING MODAL */}
        <Modal
          visible={bookingModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBookingModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetOverlay}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setBookingModalVisible(false)} />

            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeaderRow}>
                <View>
                  <Text style={styles.sheetTitle}>Book Service</Text>
                  <Text style={styles.sheetSub} numberOfLines={1}>
                    {service.title}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.sheetClose}
                  onPress={() => setBookingModalVisible(false)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={16} color="#9AA4B2" />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (optional)"
                  placeholderTextColor="#9AA4B2"
                  value={bookingPhone}
                  onChangeText={setBookingPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.helperText}>Optional: Add a phone number for this booking</Text>

              {/* Number of Cars Selector */}
              <View style={styles.carSelectorContainer}>
                <View style={styles.carSelectorHeader}>
                  <View>
                    <Text style={styles.carSelectorTitle}>Number of Cars</Text>
                    <Text style={styles.carSelectorSubtitle}>4 passengers per car</Text>
                  </View>
                  <View style={styles.passengerInfo}>
                    <Ionicons name="people-outline" size={16} color="#5EC6C6" />
                    <Text style={styles.passengerText}>Max {totalPassengers} passengers</Text>
                  </View>
                </View>
                
                <View style={styles.carSelectorControls}>
                  <TouchableOpacity
                    style={[styles.carButton, numberOfCars <= 1 && styles.carButtonDisabled]}
                    onPress={() => setNumberOfCars(Math.max(1, numberOfCars - 1))}
                    disabled={numberOfCars <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={20} color={numberOfCars <= 1 ? "#6B7280" : "#fff"} />
                  </TouchableOpacity>
                  
                  <View style={styles.carCountContainer}>
                    <Ionicons name="car-outline" size={24} color="#5EC6C6" />
                    <Text style={styles.carCountText}>{numberOfCars}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.carButton, numberOfCars >= 10 && styles.carButtonDisabled]}
                    onPress={() => setNumberOfCars(Math.min(10, numberOfCars + 1))}
                    disabled={numberOfCars >= 10}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color={numberOfCars >= 10 ? "#6B7280" : "#fff"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.priceBreakdown}>
                  <Text style={styles.priceBreakdownText}>
                    {pricePerCar} × {numberOfCars} car{numberOfCars > 1 ? 's' : ''} = <Text style={styles.totalPriceText}>{money(totalPrice, (service as any)?.currency)}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[styles.picker, { flex: 1 }]}
                  activeOpacity={0.9}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#B0BEC5" />
                  <Text style={styles.pickerText}>{bookingDate.toLocaleDateString()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.picker, { flex: 1 }]}
                  activeOpacity={0.9}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={16} color="#B0BEC5" />
                  <Text style={styles.pickerText}>
                    {bookingTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={bookingDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) setBookingDate(date);
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={bookingTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, time) => {
                    setShowTimePicker(false);
                    if (time) setBookingTime(time);
                  }}
                />
              )}

              {!token ? (
                <Text style={styles.msgError}>
                  You must be logged in to book. Please login and try again.
                </Text>
              ) : null}

              {bookingError ? <Text style={styles.msgError}>{bookingError}</Text> : null}
              {bookingSuccess ? <Text style={styles.msgSuccess}>Booking successful!</Text> : null}

              <View style={styles.sheetBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (bookingLoading || !token) && { opacity: 0.6 },
                  ]}
                  disabled={bookingLoading || !token}
                  activeOpacity={0.92}
                  onPress={async () => {
                    setBookingLoading(true);
                    setBookingError(null);
                    setBookingSuccess(false);

                    try {
                      if (!user?.id) {
                        setBookingError("Please login to book this service");
                        return;
                      }
                      
                      if (!service?.id) {
                        setBookingError("Service information is missing. Please try again.");
                        return;
                      }
                      
                      console.log("Creating service booking...", {
                        provider_service: service.id,
                        customer: user.id,
                        phone: bookingPhone,
                        number_of_cars: numberOfCars,
                        total_passengers: totalPassengers,
                        total_price: totalPrice,
                        date: bookingDate.toISOString().split("T")[0],
                        time: bookingTime.toTimeString().slice(0, 5),
                      });
                      
                      const bookingResult = await createBooking(
                        {
                          provider_service: service.id,
                          customer: user.id,
                          phone: bookingPhone,
                          number_of_cars: numberOfCars,
                          total_passengers: totalPassengers,
                          total_price: totalPrice,
                          date: bookingDate.toISOString().split("T")[0],
                          time: bookingTime.toTimeString().slice(0, 5),
                        },
                        token
                      );
                      
                      setBookingSuccess(true);
                      
                      // Add notification for service booking
                      const customerId = await AsyncStorage.getItem("customerId");
                      if (customerId) {
                        const status = bookingResult?.status || 'pending';
                        
                        // Define status-specific messages
                        const statusMessages: Record<string, { title: string; message: string }> = {
                          pending: { 
                            title: 'Service Booked! 📅', 
                            message: `Your booking for "${service.title}" on ${bookingDate.toLocaleDateString()} is being processed.` 
                          },
                          confirmed: { 
                            title: 'Booking Confirmed! ✅', 
                            message: `Your booking for "${service.title}" on ${bookingDate.toLocaleDateString()} at ${bookingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} is confirmed.` 
                          },
                          in_progress: { 
                            title: 'Service In Progress! 🔧', 
                            message: `Your service "${service.title}" is now in progress.` 
                          },
                          completed: { 
                            title: 'Service Completed! ✅', 
                            message: `Your service "${service.title}" has been completed. Thank you!` 
                          }
                        };
                        
                        const statusInfo = statusMessages[status] || {
                          title: 'Booking Created! 🎉',
                          message: `Your booking for "${service.title}" has been created.`
                        };
                        
                        // Create notification for all bookings
                        await addNotification(
                          customerId,
                          statusInfo.title,
                          statusInfo.message,
                          'service',
                          { bookingId: bookingResult?.id, serviceTitle: service.title, status: status }
                        );
                        console.log('Notification created successfully');
                        
                        // Track pending bookings for status updates
                        if (status === 'pending') {
                          await trackBooking(
                            customerId,
                            bookingResult?.id,
                            status,
                            'service',
                            {
                              serviceTitle: service.title,
                              date: bookingDate.toLocaleDateString(),
                              time: bookingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                          );
                          console.log('Booking tracked for future status updates');
                        }
                      }
                      
                      setTimeout(() => {
                        setBookingModalVisible(false);
                        setBookingSuccess(false);
                      }, 2000);
                    } catch (error: any) {
                      console.error("Booking error:", error);
                      console.error("Error response:", error?.response?.data);
                      console.error("Error status:", error?.response?.status);
                      const errorMsg = error?.response?.data?.detail || error?.response?.data?.error || JSON.stringify(error?.response?.data) || "Booking failed. Please try again.";
                      setBookingError(errorMsg);
                    } finally {
                      setBookingLoading(false);
                    }
                  }}
                >
                  <Text style={styles.primaryText}>
                    {bookingLoading ? "Booking..." : "Confirm booking"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.92}
                  onPress={() => setBookingModalVisible(false)}
                >
                  <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#23272F" },
  container: { flex: 1, backgroundColor: "#23272F" },
  content: { padding: 16, paddingBottom: 28 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  centerText: { marginTop: 10, color: "#B0BEC5", fontWeight: "700" },
  error: { marginTop: 10, color: "#FFB4A2", textAlign: "center", fontWeight: "900" },

  hero: { borderRadius: 22, overflow: "hidden", backgroundColor: "#1F232B" },
  heroImg: { width: "100%", height: 260, backgroundColor: "#1F232B" },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  heroTopRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFA726",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillText: { color: "#0f1a19", fontWeight: "900", fontSize: 12 },

  heroBottom: { position: "absolute", left: 12, right: 12, bottom: 12 },
  heroTitle: { color: "#fff", fontWeight: "900", fontSize: 20, marginBottom: 8 },
  heroPriceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroPriceLabel: { color: "#E6EDF3", opacity: 0.9, fontWeight: "800", fontSize: 12 },
  heroPrice: { color: "#FFA726", fontWeight: "900", fontSize: 14 },

  thumbScroll: { marginTop: 12, paddingVertical: 2, paddingRight: 6 },
  thumbWrap: { marginRight: 10 },
  thumbImg: { width: 84, height: 84, borderRadius: 18, backgroundColor: "#1F232B" },

  card: {
    marginTop: 14,
    backgroundColor: "#2D313A",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardHeaderTitle: { color: "#fff", fontWeight: "900", fontSize: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(94,198,198,0.10)",
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#5EC6C6", fontWeight: "900", fontSize: 12 },

  desc: { color: "#B0BEC5", lineHeight: 18, fontWeight: "600" },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  detailLabel: { color: "#98A2B3", fontWeight: "900" },
  detailValue: { color: "#fff", fontWeight: "800", maxWidth: "55%", textAlign: "right" },

  grid: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: {
    width: "48%",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  gridIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(94,198,198,0.12)",
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridLabel: { color: "#98A2B3", fontWeight: "900", fontSize: 12 },
  gridValue: { color: "#fff", fontWeight: "900", fontSize: 13, marginTop: 4 },

  ctaBar: {
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  ctaSmall: { color: "#98A2B3", fontWeight: "900", fontSize: 12 },
  ctaBig: { color: "#fff", fontWeight: "900", fontSize: 16, marginTop: 4 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#5EC6C6",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  ctaBtnText: { color: "#0f1a19", fontWeight: "900" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  modalImg: { width: "92%", height: "72%", borderRadius: 18, backgroundColor: "#1F232B" },
  modalClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.70)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#23272F",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginBottom: 10,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sheetTitle: { color: "#FFA726", fontWeight: "900", fontSize: 18 },
  sheetSub: { color: "#B0BEC5", fontWeight: "700", marginTop: 2, maxWidth: 220 },
  sheetClose: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#2D313A",
    alignItems: "center",
    justifyContent: "center",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#2D313A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  input: { flex: 1, color: "#fff", fontWeight: "700" },
  helperText: { 
    color: "#9AA4B2", 
    fontSize: 12, 
    fontWeight: "600", 
    marginTop: -6, 
    marginBottom: 10,
    paddingHorizontal: 4
  },

  pickerRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2D313A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerText: { color: "#fff", fontWeight: "800" },

  carSelectorContainer: {
    backgroundColor: '#2D313A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 198, 198, 0.2)',
  },
  carSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  carSelectorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  carSelectorSubtitle: {
    color: '#B0BEC5',
    fontSize: 12,
    marginTop: 2,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(94, 198, 198, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  passengerText: {
    color: '#5EC6C6',
    fontSize: 12,
    fontWeight: '700',
  },
  carSelectorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  carButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5EC6C6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  carButtonDisabled: {
    backgroundColor: '#3D4350',
    opacity: 0.5,
  },
  carCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#23272F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  carCountText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  priceBreakdown: {
    backgroundColor: '#23272F',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  priceBreakdownText: {
    color: '#B0BEC5',
    fontSize: 14,
    fontWeight: '600',
  },
  totalPriceText: {
    color: '#FFA726',
    fontSize: 16,
    fontWeight: '900',
  },

  msgError: {
    color: "#FFB4A2",
    textAlign: "center",
    fontWeight: "900",
    marginTop: 4,
  },
  msgSuccess: {
    color: "#5EC6C6",
    textAlign: "center",
    fontWeight: "900",
    marginTop: 4,
  },

  sheetBtnRow: { flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 6 },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#5EC6C6",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryText: { color: "#0f1a19", fontWeight: "900" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#E91E63",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryText: { color: "#fff", fontWeight: "900" },
});
