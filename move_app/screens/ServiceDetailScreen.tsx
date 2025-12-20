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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ProviderService } from "../models/ProviderService";
import { fetchProviderServiceById } from "../api/providerServiceDetail";
import { createBooking } from "../api";

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

  const [service, setService] = useState<ProviderService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // booking
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState(new Date());
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

    fetchProviderServiceById(id)
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

  const headerTitle = service?.title || "Service Details";

  const priceText =
    money((service as any)?.base_price, (service as any)?.currency) || "Price on request";

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
      <View style={styles.container}>
        <Stack.Screen options={{ title: headerTitle }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5EC6C6" />
          <Text style={styles.centerText}>Loading service...</Text>
        </View>
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: headerTitle }} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={24} color="#FFB4A2" />
          <Text style={styles.error}>{error || "Service not found."}</Text>
        </View>
      </View>
    );
  }

  return (
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
                  <Text style={styles.heroPrice}>{priceText}</Text>
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
            {(service as any)?.full_description || (service as any)?.short_description || "No description provided."}
          </Text>

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
              <Text style={styles.ctaBig}>{priceText}</Text>
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
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.modalBody}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.modalImg} resizeMode="contain" />
            ) : null}
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)} activeOpacity={0.85}>
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
              <Ionicons name="person-outline" size={16} color="#9AA4B2" />
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor="#9AA4B2"
                value={bookingName}
                onChangeText={setBookingName}
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="call-outline" size={16} color="#9AA4B2" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#9AA4B2"
                value={bookingPhone}
                onChangeText={setBookingPhone}
                keyboardType="phone-pad"
              />
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

            {bookingError ? <Text style={styles.msgError}>{bookingError}</Text> : null}
            {bookingSuccess ? <Text style={styles.msgSuccess}>Booking successful!</Text> : null}

            <View style={styles.sheetBtnRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, bookingLoading && { opacity: 0.6 }]}
                disabled={bookingLoading}
                activeOpacity={0.92}
                onPress={async () => {
                  setBookingLoading(true);
                  setBookingError(null);
                  setBookingSuccess(false);
                  try {
                    await createBooking({
                      provider_service: (service as any).id,
                      name: bookingName,
                      phone: bookingPhone,
                      date: bookingDate.toISOString().split("T")[0],
                      time: bookingTime.toTimeString().slice(0, 5),
                    });
                    setBookingSuccess(true);
                  } catch {
                    setBookingError("Booking failed. Please try again.");
                  } finally {
                    setBookingLoading(false);
                  }
                }}
              >
                <Text style={styles.primaryText}>{bookingLoading ? "Booking..." : "Confirm booking"}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#23272F" },
  content: { padding: 16, paddingBottom: 28 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  centerText: { marginTop: 10, color: "#B0BEC5", fontWeight: "700" },
  error: { marginTop: 10, color: "#FFB4A2", textAlign: "center", fontWeight: "900" },

  hero: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#1F232B",
  },
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
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

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" },
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
  sheetHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
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

  msgError: { color: "#FFB4A2", textAlign: "center", fontWeight: "900", marginTop: 4 },
  msgSuccess: { color: "#5EC6C6", textAlign: "center", fontWeight: "900", marginTop: 4 },

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
