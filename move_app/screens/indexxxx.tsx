import React, { useEffect, useMemo, useState } from "react";
// This file has been renamed to HomeScreen.tsx. Please update your imports to use './HomeScreen'.
import React, { useEffect, useMemo, useState } from "react";
import {
import {
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "../app/auth-context";

const BASE_URL = "http://192.168.1.31:8000";
const MEDIA_PREFIX = "/media/";

const FALLBACK_ADS = [
  { id: 1, caption: "Turn your ride into MOVE Cash", image: "adverts/move_cash.png", is_active: true },
  { id: 2, caption: "Advertise your business here!", image: "adverts/business_ad.png", is_active: true },
  { id: 3, caption: "Special deals for MOVE users", image: "adverts/special_deals.png", is_active: true },
];

function resolveImageUrl(imagePath?: string | null) {
  if (!imagePath || typeof imagePath !== "string") return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  if (imagePath.startsWith("/")) return `${BASE_URL}${imagePath}`;
  return `${BASE_URL}${MEDIA_PREFIX}${imagePath}`;
}

function AdvertSwiper() {
  const [adverts, setAdverts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/corporate/adverts/`);
        if (!response.ok) throw new Error("Failed to fetch adverts");
        const data = await response.json();

        const list = Array.isArray(data) ? data : [];
        const cleaned = list
          .filter((a) => a?.is_active !== false)
          .map((a, idx) => ({
            id: a?.id ?? `${idx}-${a?.caption ?? "ad"}`,
            caption: a?.caption ?? "",
            image: a?.image ?? "",
            is_active: a?.is_active ?? true,
          }));

        if (mounted) setAdverts(cleaned.length ? cleaned : FALLBACK_ADS);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Something went wrong");
          setAdverts(FALLBACK_ADS);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.adCenter}>
        <ActivityIndicator color="#35736E" />
        <Text style={styles.adInfoText}>Loading adverts...</Text>
      </View>
    );
  }

  if (!adverts.length) {
    return (
      <View style={styles.adCenter}>
        <Text style={styles.adInfoText}>{error ? `Error: ${error}` : "No adverts available"}</Text>
      </View>
    );
  }

  return (
    <Swiper
      showsPagination
      autoplay
      autoplayTimeout={4}
      dotColor="rgba(255,255,255,0.45)"
      activeDotColor="#fff"
      containerStyle={styles.swiperContainer}
    >
      {adverts.map((ad) => {
        const imgUrl = resolveImageUrl(ad.image);

        return (
          <View style={styles.swiperSlide} key={String(ad.id)}>
            {imgUrl ? (
              <Image source={{ uri: imgUrl }} style={styles.rectangleImage} resizeMode="cover" />
            ) : (
              <View style={[styles.rectangleImage, styles.imageFallback]}>
                <Text style={styles.imageFallbackText}>No image</Text>
              </View>
            )}

            {/* Soft gradient overlay */}
            <View style={styles.adOverlay} />

            {!!ad.caption && (
              <View style={styles.captionPill}>
                <Ionicons name="sparkles-outline" size={14} color="#0f1a19" />
                <Text style={styles.captionText} numberOfLines={2}>
                  {ad.caption}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </Swiper>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  const userName = user?.name || "Alex";
  const userInitials = userName ? userName[0] : "U";

  const quotes = useMemo(
    () => [
      "Every journey begins with a single step.",
      "Go where you feel most alive.",
      "The world is yours to explore.",
      "Travel. Explore. Discover.",
    ],
    []
  );

  const [quote, setQuote] = useState(quotes[0]);
  const [destination, setDestination] = useState("");

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [quotes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.push("/profile")} style={styles.avatarWrapper}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
            </Pressable>

            <View style={styles.headerTextWrap}>
              <Text style={styles.hiText}>Hi, {userName}</Text>
              <View style={styles.statusRow}>
                <View style={styles.dot} />
                <Text style={styles.subText}>Ready when you are</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH CARD */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchIconWrap}>
              <Ionicons name="search" size={18} color="#35736E" />
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Where are you going?"
              placeholderTextColor="#8B95A5"
              value={destination}
              onChangeText={setDestination}
            />

            <TouchableOpacity
              style={[styles.orderBtn, !destination.trim() && { opacity: 0.5 }]}
              disabled={!destination.trim()}
              onPress={() => router.push({ pathname: "/ride-screen", params: { destination } })}
              activeOpacity={0.9}
            >
              <Text style={styles.orderBtnText}>Order</Text>
              <Ionicons name="arrow-forward" size={16} color="#0f1a19" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickChip} activeOpacity={0.9}>
              <MaterialIcons name="event-available" size={18} color="#35736E" />
              <Text style={styles.quickChipText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickChip} activeOpacity={0.9}>
              <MaterialIcons name="person-outline" size={18} color="#35736E" />
              <Text style={styles.quickChipText}>Rider</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickChip} activeOpacity={0.9}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#35736E" />
              <Text style={styles.quickChipText}>Safety</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAVS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shortcuts</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/shortcuts")}>
            <Text style={styles.sectionAction}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shortcutCard}>
          <View style={styles.shortcutIcon}>
            <MaterialIcons name="location-pin" size={22} color="#E040FB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Massachusetts RMV</Text>
            <Text style={styles.shortcutSub}>50 Southwest Cutoff, Worcester</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </View>

        <View style={styles.shortcutCard}>
          <View style={[styles.shortcutIcon, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
            <FontAwesome5 name="briefcase" size={18} color="#E040FB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Work</Text>
            <Text style={styles.shortcutSub}>Add shortcut</Text>
          </View>
          <Ionicons name="add" size={20} color="rgba(255,255,255,0.85)" />
        </View>

        {/* ADVERTS */}
        <View style={styles.adCard}>
          <AdvertSwiper />
        </View>

        {/* QUOTE */}
        <View style={styles.quoteCard}>
          <Ionicons name="sparkles" size={16} color="#FFA726" />
          <Text style={styles.quoteText}>{quote}</Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaHeader}>
          <Text style={styles.sectionTitle}>Choose an option</Text>
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.ctaCard, styles.ctaPrimary]}
            onPress={() => router.push("/ride-screen")}
          >
            <View style={styles.ctaTopRow}>
              <View style={styles.ctaIcon}>
                <Ionicons name="car-sport" size={24} color="#0f1a19" />
              </View>
              <View style={styles.ctaPill}>
                <Text style={styles.ctaPillText}>FAST</Text>
              </View>
            </View>

            <Text style={styles.ctaTitle}>Get a Ride</Text>
            <Text style={styles.ctaSub}>Within your city • 2–5 min pickup</Text>

            <View style={styles.ctaBottom}>
              <Text style={styles.ctaGo}>Ride now</Text>
              <Ionicons name="chevron-forward" size={18} color="#0f1a19" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.ctaCard, styles.ctaSecondary]}
            onPress={() => router.push("/services")}
          >
            <View style={styles.ctaTopRow}>
              <View style={styles.ctaIcon}>
                <Ionicons name="navigate" size={22} color="#0f1a19" />
              </View>
              <View style={[styles.ctaPill, styles.ctaPillAlt]}>
                <Text style={styles.ctaPillText}>SCHEDULE</Text>
              </View>
            </View>

            <Text style={styles.ctaTitle}>Intercity</Text>
            <Text style={styles.ctaSub}>Between cities • book ahead</Text>

            <View style={styles.ctaBottom}>
              <Text style={styles.ctaGo}>Plan trip</Text>
              <Ionicons name="chevron-forward" size={18} color="#0f1a19" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#35736E" },
  scrollContainer: { flex: 1, backgroundColor: "#35736E" },

  /* Header */
  header: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTextWrap: { flexDirection: "column" },
  hiText: { color: "#fff", fontSize: 20, fontWeight: "900" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#5EC6C6" },
  subText: { color: "rgba(255,255,255,0.78)", fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarWrapper: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFA726",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 20 },

  /* Search Card */
  searchCard: {
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#111",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 14,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(53,115,110,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: { flex: 1, color: "#0f1a19", fontWeight: "800", fontSize: 15, paddingVertical: 8 },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#5EC6C6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  orderBtnText: { color: "#0f1a19", fontWeight: "900", fontSize: 13 },

  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  quickChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(53,115,110,0.08)",
    borderRadius: 14,
    paddingVertical: 10,
  },
  quickChipText: { color: "#35736E", fontWeight: "900", fontSize: 12 },

  /* Section headers */
  sectionHeader: {
    marginTop: 2,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaHeader: {
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  sectionAction: { color: "rgba(255,255,255,0.85)", fontWeight: "900" },

  /* Shortcuts */
  shortcutCard: {
    marginHorizontal: 18,
    marginBottom: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTitle: { color: "#fff", fontWeight: "900", fontSize: 14 },
  shortcutSub: { color: "rgba(255,255,255,0.72)", marginTop: 2, fontWeight: "700" },

  /* Adverts */
  adCard: {
    width: "90%",
    height: 220,
    backgroundColor: "#fff",
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#111",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  swiperContainer: { borderRadius: 18 },
  swiperSlide: { flex: 1 },
  rectangleImage: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#f2f2f2" },
  imageFallbackText: { color: "#666", fontWeight: "800" },
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  captionPill: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  captionText: { flex: 1, color: "#0f1a19", fontWeight: "900" },

  /* Quote */
  quoteCard: {
    marginHorizontal: 18,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quoteText: { flex: 1, color: "#fff", fontWeight: "800", fontStyle: "italic" },

  /* CTA cards */
  ctaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 18,
  },
  ctaCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaPrimary: { backgroundColor: "#5EC6C6" },
  ctaSecondary: { backgroundColor: "#67D1C8", opacity: 0.95 },

  ctaTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPill: {
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ctaPillAlt: { backgroundColor: "rgba(255,255,255,0.74)" },
  ctaPillText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.6, color: "#0f1a19" },

  ctaTitle: { marginTop: 12, fontSize: 18, fontWeight: "900", color: "#0f1a19" },
  ctaSub: { marginTop: 6, fontSize: 12, lineHeight: 16, color: "rgba(15,26,25,0.75)", fontWeight: "800" },
  ctaBottom: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ctaGo: { fontSize: 13, fontWeight: "900", color: "#0f1a19" },

  /* Ad center */
  adCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  adInfoText: { marginTop: 6, color: "#333", fontWeight: "800" },
});
