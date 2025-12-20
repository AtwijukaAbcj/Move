import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/**
 * ✅ Update this to your Django server IP (LAN) and media path.
 * If your Django serves media at http://IP:8000/media/...
 * keep MEDIA_PREFIX as "/media/".
 */
const BASE_URL = "http://192.168.1.31:8000";
const MEDIA_PREFIX = "/media/";

/** Fallback ads if API fails or returns empty */
const FALLBACK_ADS = [
  { id: 1, caption: "Turn your ride into MOVE Cash", image: "adverts/move_cash.png", is_active: true },
  { id: 2, caption: "Advertise your business here!", image: "adverts/business_ad.png", is_active: true },
  { id: 3, caption: "Special deals for MOVE users", image: "adverts/special_deals.png", is_active: true },
];

/** Build a safe full image URL from API values like "adverts/x.png" or "/media/adverts/x.png" or full http url */
function resolveImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  if (imagePath.startsWith("/")) return `${BASE_URL}${imagePath}`;
  return `${BASE_URL}${MEDIA_PREFIX}${imagePath}`;
}

/** ✅ Keep components OUTSIDE StyleSheet.create */
function AdvertSwiper() {
  const [adverts, setAdverts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchAdverts = async () => {
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
      } catch (err) {
        if (mounted) {
          setError(err?.message || "Something went wrong");
          setAdverts(FALLBACK_ADS);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAdverts();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.adCenter}>
        <ActivityIndicator />
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
      dotColor="#ccc"
      activeDotColor="#FFA726"
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

            {!!ad.caption && (
              <View style={styles.captionContainer}>
                <Text style={styles.rectangleCaption} numberOfLines={2}>
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

  // Replace with real user data later
  const userName = "Alex";
  const avatarUrl = null;
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

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [quotes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarInitials}>
                  <Text style={styles.avatarInitialsText}>{userInitials}</Text>
                </View>
              )}
            </View>

            <View style={styles.greetingWrapper}>
              <Text style={styles.greetingText}>Good day, {userName}!</Text>
            </View>

            <View style={styles.menuRow}>
              <Text style={styles.menuDots}>•••</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={22} color="#aaa" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.searchBar}
              placeholder="Where are you going?"
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.85}>
              <MaterialIcons name="event-available" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Schedule ahead</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} activeOpacity={0.85}>
              <MaterialIcons name="person-outline" size={20} color="#fff" />
              <Text style={styles.quickActionText}>Change rider</Text>
            </TouchableOpacity>
          </View>

          {/* Favorite Locations */}
          <View style={styles.favLocationRow}>
            <MaterialIcons name="location-pin" size={22} color="#E040FB" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.favLocationTitle}>Massachusetts Registry of Motor Vehicles</Text>
              <Text style={styles.favLocationSubtitle}>50 Southwest Cutoff, Worcester</Text>
            </View>
          </View>

          <View style={styles.favLocationRow}>
            <FontAwesome5 name="briefcase" size={20} color="#E040FB" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.favLocationTitle}>Work</Text>
              <Text style={styles.favLocationSubtitle}>Add shortcut</Text>
            </View>
          </View>

          {/* Adverts */}
          <View style={styles.rectangleCard}>
            <AdvertSwiper />
          </View>

          {/* Label */}
          <View style={styles.leftLabelContainer}>
            <Text style={styles.leftLabelText}>Adventure awaits!</Text>
          </View>

          {/* Quote */}
          <Text style={styles.quoteText}>{quote}</Text>

          {/* ✅ Improved CTA buttons */}
          <View style={styles.ctaRow}>
            {/* Primary: Get a Ride */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.ctaCard, styles.ctaPrimary]}
              onPress={() => router.push("/rides")}
            >
              <View style={styles.ctaTopRow}>
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="car-sport" size={26} color="#0f1a19" />
                </View>
                <View style={styles.ctaBadge}>
                  <Text style={styles.ctaBadgeText}>FAST</Text>
                </View>
              </View>

              <Text style={styles.ctaTitle}>Get a Ride</Text>
              <Text style={styles.ctaSubtitle}>Within your city • 2–5 min pickup</Text>

              <View style={styles.ctaBottomRow}>
                <Text style={styles.ctaActionText}>Ride now</Text>
                <Ionicons name="chevron-forward" size={18} color="#0f1a19" />
              </View>
            </TouchableOpacity>

            {/* Secondary: Intercity */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.ctaCard, styles.ctaSecondary]}
              onPress={() => router.push("/services")}
            >
              <View style={styles.ctaTopRow}>
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="navigate" size={24} color="#0f1a19" />
                </View>
                <View style={[styles.ctaBadge, styles.ctaBadgeAlt]}>
                  <Text style={styles.ctaBadgeText}>SCHEDULE</Text>
                </View>
              </View>

              <Text style={styles.ctaTitle}>Intercity</Text>
              <Text style={styles.ctaSubtitle}>Between cities • book ahead</Text>

              <View style={styles.ctaBottomRow}>
                <Text style={styles.ctaActionText}>Plan trip</Text>
                <Ionicons name="chevron-forward" size={18} color="#0f1a19" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#35736E" },
  scrollContainer: { flex: 1, backgroundColor: "#35736E" },

  // ✅ Removed paddingTop to avoid fighting SafeArea
  container: { flex: 1, backgroundColor: "#35736E", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
  },

  avatarWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#5EC6C6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    shadowColor: "#222",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarImg: { width: 54, height: 54, borderRadius: 27 },
  avatarInitials: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFA726",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: { color: "#fff", fontWeight: "bold", fontSize: 26 },

  greetingWrapper: { flex: 1, marginLeft: 8 },
  greetingText: { color: "#fff", fontSize: 20, fontWeight: "600", letterSpacing: 0.5 },

  menuRow: { alignItems: "flex-end", justifyContent: "center", marginLeft: 8 },
  menuDots: {
    fontSize: 10,
    color: "#fff",
    letterSpacing: 4,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 16,
  },

  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D313A",
    borderRadius: 25,
    marginTop: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    height: 50,
    width: "95%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBar: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "transparent",
    borderRadius: 16,
    paddingHorizontal: 12,
  },

  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginHorizontal: 8,
    marginBottom: 8,
    gap: 12,
    width: "95%",
  },
  quickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#444",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  quickActionText: { color: "#fff", fontSize: 14, marginLeft: 6, fontWeight: "500" },

  favLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 12,
    marginBottom: 4,
  },
  favLocationTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  favLocationSubtitle: { color: "#aaa", fontSize: 13, fontWeight: "400" },

  rectangleCard: {
    width: 350,
    height: 220,
    backgroundColor: "#fff",
    alignSelf: "center",
    marginVertical: 18,
    borderRadius: 14,
    shadowColor: "#222",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    overflow: "hidden",
  },

  swiperContainer: { borderRadius: 14 },
  swiperSlide: { flex: 1 },

  rectangleImage: { width: "100%", height: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#f1f1f1" },
  imageFallbackText: { color: "#666" },

  captionContainer: {
    position: "absolute",
    top: 10,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    maxWidth: "70%",
  },
  rectangleCaption: {
    color: "#FFA726",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
    letterSpacing: 0.5,
  },

  leftLabelContainer: {
    alignSelf: "flex-start",
    marginLeft: 24,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 14,
    shadowColor: "#222",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftLabelText: { color: "#35736E", fontWeight: "bold", fontSize: 15, letterSpacing: 0.5 },

  quoteText: {
    color: "#FFA726",
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  /** ✅ New CTA styles */
  ctaRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 14,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  ctaCard: {
    width: 168,
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaPrimary: {
    backgroundColor: "#5EC6C6",
  },
  ctaSecondary: {
    backgroundColor: "#67D1C8",
    opacity: 0.92,
  },
  ctaTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBadge: {
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ctaBadgeAlt: {
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  ctaBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#0f1a19",
  },
  ctaTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f1a19",
  },
  ctaSubtitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(15,26,25,0.75)",
    fontWeight: "600",
  },
  ctaBottomRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ctaActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f1a19",
  },

  adCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  adInfoText: { marginTop: 6, color: "#333" },
});
