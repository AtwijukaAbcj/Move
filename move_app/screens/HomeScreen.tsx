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
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../app/auth-context";
import { getUnreadCount } from "../utils/notifications";

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
        console.log("[Adverts] Fetching from:", `${BASE_URL}/api/corporate/adverts/`);
        const response = await fetch(`${BASE_URL}/api/corporate/adverts/`);
        if (!response.ok) throw new Error("Failed to fetch adverts");
        const data = await response.json();
        console.log("[Adverts] Received data:", data);

        const list = Array.isArray(data) ? data : [];
        const cleaned = list
          .filter((a) => a?.is_active !== false)
          .map((a, idx) => ({
            id: a?.id ?? `${idx}-${a?.caption ?? "ad"}`,
            caption: a?.caption ?? "",
            image: a?.image ?? "",
            is_active: a?.is_active ?? true,
          }));

        console.log("[Adverts] Cleaned adverts:", cleaned);
        if (mounted) setAdverts(cleaned.length ? cleaned : FALLBACK_ADS);
      } catch (err: any) {
        console.log("[Adverts] Error:", err?.message || "Something went wrong");
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
          <View key={String(ad.id)} style={styles.adSlideWrap}>
            {/* ✅ Each advert is its own card */}
            <View style={styles.adSlideCard}>
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
          </View>
        );
      })}
    </Swiper>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [ongoingRide, setOngoingRide] = useState<any>(null);
  const [mostOrderedPlace, setMostOrderedPlace] = useState<any>(null);
  const [lastVisitedPlace, setLastVisitedPlace] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) router.replace("/login");
    else {
      loadProfilePicture();
      fetchOngoingRide();
    }
  }, [user, router]);

  const fetchOngoingRide = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;
      const response = await fetch(`${BASE_URL}/api/corporate/customer/${customerId}/ongoing-ride/`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.status && data.status !== "completed" && data.status !== "cancelled") {
          setOngoingRide(data);
        } else {
          setOngoingRide(null);
        }
      } else {
        setOngoingRide(null);
      }
    } catch (error) {
      setOngoingRide(null);
    }
  };

  useEffect(() => {
    loadShortcuts();
    loadMostOrderedPlace();
    loadLastVisitedPlace();
    loadUnreadNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUnreadNotifications();
    }, [])
  );

  const loadUnreadNotifications = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (customerId) {
        const count = await getUnreadCount(customerId);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Error loading unread notifications:", error);
    }
  };

  const loadProfilePicture = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;

      const response = await fetch(`${BASE_URL}/api/corporate/customer/${customerId}/profile/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile_picture) {
          setProfilePicture(data.profile_picture);
        }
      }
    } catch (error) {
      console.error("Error loading profile picture:", error);
    }
  };

  const loadShortcuts = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;

      const stored = await AsyncStorage.getItem(`move_shortcuts_${customerId}`);
      if (stored) {
        setShortcuts(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading shortcuts:", error);
    }
  };

  const loadMostOrderedPlace = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;

      const orderHistoryStr = await AsyncStorage.getItem(`ORDER_HISTORY_${customerId}`);
      if (orderHistoryStr) {
        const orderHistory = JSON.parse(orderHistoryStr);
        const sortedPlaces = Object.entries(orderHistory)
          .map(([address, count]) => ({ address, count: count as number }))
          .sort((a, b) => b.count - a.count);

        if (sortedPlaces.length > 0) {
          setMostOrderedPlace({
            id: "most-ordered",
            title: "Most Ordered",
            address: sortedPlaces[0].address,
            icon: "star",
            iconColor: "#FFA726",
            orderCount: sortedPlaces[0].count,
          });
        }
      }
    } catch (error) {
      console.error("Error loading order history:", error);
    }
  };

  const loadLastVisitedPlace = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;

      const lastVisitedStr = await AsyncStorage.getItem(`LAST_VISITED_PLACE_${customerId}`);
      if (lastVisitedStr) {
        const lastVisited = JSON.parse(lastVisitedStr);
        setLastVisitedPlace({
          id: "last-visited",
          title: "Last Visit",
          address: lastVisited.destination,
          icon: "time",
          iconColor: "#5EC6C6",
          timestamp: lastVisited.timestamp,
        });
      }
    } catch (error) {
      console.error("Error loading last visited place:", error);
    }
  };

  if (!user) return null;

  const userName = user?.full_name || user?.name || "Alex";
  const userInitials = userName ? userName[0] : "U";

  const [destination, setDestination] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (destination.trim().length > 2) {
      searchPlaces(destination);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [destination]);

  const searchPlaces = async (query: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=AIzaSyAEIJNjKs7Kxr5DstLl_Slzp5oCk8Ba2l0&components=country:us`
      );
      const data = await response.json();
      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
    }
  };

  const selectSuggestion = (place: any) => {
    setDestination(place.description);
    setShowSuggestions(false);
    router.push({
      pathname: "/rides",
      params: {
        destination: place.description,
        placeId: place.place_id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Ongoing Ride Card */}
        {ongoingRide && (
          <View
            style={{
              backgroundColor: "#e6f7f7",
              borderRadius: 14,
              padding: 16,
              marginBottom: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 1,
              borderColor: "#5EC6C6",
              marginHorizontal: 20,
              marginTop: 10,
            }}
          >
            <Ionicons name="car-sport" size={28} color="#5EC6C6" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#0f1a19", fontWeight: "900", fontSize: 15, marginBottom: 2 }}>
                Request accepted
              </Text>
              <Text style={{ color: "#35736E", fontWeight: "700", fontSize: 13 }}>Driver on the way</Text>
              <Text style={{ color: "#35736E", fontWeight: "700", fontSize: 13 }}>You have an ongoing ride</Text>
            </View>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.push("/account")} style={styles.avatarWrapper}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
              )}
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
              onPress={() => {
                router.push("/notifications");
                loadUnreadNotifications();
              }}
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/wallet")} style={styles.iconBtn} activeOpacity={0.85}>
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
              onFocus={() => destination.length > 2 && setShowSuggestions(true)}
            />

            {destination.trim() && (
              <TouchableOpacity
                onPress={() => {
                  setDestination("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                style={styles.clearSearchBtn}
                activeOpacity={0.9}
              >
                <Ionicons name="close-circle" size={18} color="#8B95A5" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.orderBtn, !destination.trim() && { opacity: 0.5 }]}
              disabled={!destination.trim()}
              onPress={() => router.push({ pathname: "/rides", params: { destination } })}
              activeOpacity={0.9}
            >
              <Text style={styles.orderBtnText}>Go</Text>
              <Ionicons name="arrow-forward" size={16} color="#0f1a19" />
            </TouchableOpacity>
          </View>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.slice(0, 5).map((place: any, index: number) => (
                <TouchableOpacity
                  key={place.place_id}
                  style={[styles.suggestionItem, index === suggestions.length - 1 && styles.suggestionItemLast]}
                  onPress={() => selectSuggestion(place)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionIcon}>
                    <Ionicons name="location" size={16} color="#35736E" />
                  </View>
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionMainText}>
                      {place.structured_formatting?.main_text || place.description}
                    </Text>
                    <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                      {place.structured_formatting?.secondary_text || ""}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#9AA4B2" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickChip}
              activeOpacity={0.9}
              onPress={() => {
                router.push("/rides");
              }}
            >
              <MaterialIcons name="event-available" size={18} color="#35736E" />
              <Text style={styles.quickChipText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChip}
              activeOpacity={0.9}
              onPress={() => {
                router.push("/rides");
              }}
            >
              <MaterialIcons name="person-outline" size={18} color="#35736E" />
              <Text style={styles.quickChipText}>Rider</Text>
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

        {/* Most Ordered Place */}
        {mostOrderedPlace && (
          <TouchableOpacity
            style={[styles.shortcutCard, styles.mostOrderedCard]}
            activeOpacity={0.9}
            onPress={() => {
              router.push({
                pathname: "/rides",
                params: { destination: mostOrderedPlace.address },
              });
            }}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: `${mostOrderedPlace.iconColor}30` }]}>
              <Ionicons name="star" size={24} color={mostOrderedPlace.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.mostOrderedBadge}>
                <Ionicons name="trending-up" size={12} color="#FFA726" />
                <Text style={styles.mostOrderedBadgeText}>MOST ORDERED</Text>
              </View>
              <Text style={styles.shortcutTitle}>{mostOrderedPlace.address}</Text>
              <Text style={styles.shortcutSub}>
                Ordered {mostOrderedPlace.orderCount} time{mostOrderedPlace.orderCount > 1 ? "s" : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}

        {/* Last Visited Place */}
        {lastVisitedPlace && (
          <TouchableOpacity
            style={[styles.shortcutCard, styles.lastVisitedCard]}
            activeOpacity={0.9}
            onPress={() => {
              router.push({
                pathname: "/rides",
                params: { destination: lastVisitedPlace.address },
              });
            }}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: `${lastVisitedPlace.iconColor}30` }]}>
              <Ionicons name="time" size={24} color={lastVisitedPlace.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.mostOrderedBadge}>
                <Ionicons name="time-outline" size={12} color="#5EC6C6" />
                <Text style={[styles.mostOrderedBadgeText, { color: "#5EC6C6" }]}>LAST VISIT</Text>
              </View>
              <Text style={styles.shortcutTitle}>{lastVisitedPlace.address}</Text>
              <Text style={styles.shortcutSub}>{new Date(lastVisitedPlace.timestamp).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}

        {shortcuts.length === 0 && !mostOrderedPlace && !lastVisitedPlace ? (
          <TouchableOpacity style={styles.shortcutCard} activeOpacity={0.9} onPress={() => router.push("/shortcuts")}>
            <View style={[styles.shortcutIcon, { backgroundColor: "rgba(94,198,198,0.2)" }]}>
              <Ionicons name="add" size={24} color="#5EC6C6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Add Shortcuts</Text>
              <Text style={styles.shortcutSub}>Save your favorite places</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        ) : (
          shortcuts
            .slice(0, mostOrderedPlace && lastVisitedPlace ? 0 : mostOrderedPlace || lastVisitedPlace ? 1 : 2)
            .map((shortcut) => (
              <TouchableOpacity
                key={shortcut.id}
                style={styles.shortcutCard}
                activeOpacity={0.9}
                onPress={() => {
                  if (shortcut.address.includes("Add")) {
                    router.push("/shortcuts");
                  } else {
                    router.push({
                      pathname: "/rides",
                      params: { destination: shortcut.address },
                    });
                  }
                }}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: `${shortcut.iconColor}20` }]}>
                  {shortcut.icon === "home" && <Ionicons name="home" size={22} color={shortcut.iconColor} />}
                  {shortcut.icon === "briefcase" && <FontAwesome5 name="briefcase" size={18} color={shortcut.iconColor} />}
                  {shortcut.icon === "location-pin" && <MaterialIcons name="location-pin" size={22} color={shortcut.iconColor} />}
                  {shortcut.icon === "star" && <Ionicons name="star" size={22} color={shortcut.iconColor} />}
                  {shortcut.icon === "school" && <MaterialIcons name="school" size={22} color={shortcut.iconColor} />}
                  {shortcut.icon === "restaurant" && <MaterialIcons name="restaurant" size={22} color={shortcut.iconColor} />}
                  {shortcut.icon === "shopping-bag" && <MaterialIcons name="shopping-bag" size={22} color={shortcut.iconColor} />}
                  {shortcut.icon === "fitness-center" && <MaterialIcons name="fitness-center" size={22} color={shortcut.iconColor} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                  <Text style={styles.shortcutSub} numberOfLines={1}>
                    {shortcut.address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ))
        )}

        {/* ADVERTS */}
        <View style={styles.adCard}>
          <AdvertSwiper />
        </View>

        {/* CTA (left commented exactly as you had it) */}
        {/*
        ... your CTA block remains unchanged ...
        */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2A5F5D",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#2A5F5D",
  },

  /* Header */
  header: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerTextWrap: { flexDirection: "column" },
  hiText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#5EC6C6",
    shadowColor: "#5EC6C6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  subText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    fontSize: 13,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5252",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#35736E",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },

  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#FFA726",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
  },

  /* Search Card */
  searchCard: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(53,115,110,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    color: "#0f1a19",
    fontWeight: "800",
    fontSize: 16,
    paddingVertical: 10,
  },
  clearSearchBtn: {
    padding: 4,
    marginRight: 4,
  },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#5EC6C6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#5EC6C6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  orderBtnText: {
    color: "#0f1a19",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  /* Suggestions */
  suggestionsContainer: {
    marginTop: 12,
    backgroundColor: "rgba(53,115,110,0.06)",
    borderRadius: 14,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(53,115,110,0.10)",
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "rgba(53,115,110,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    color: "#0f1a19",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },

  quickRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  quickChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(53,115,110,0.10)",
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(53,115,110,0.15)",
  },
  quickChipText: {
    color: "#35736E",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  /* Section headers */
  sectionHeader: {
    marginTop: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.3,
  },
  sectionAction: {
    color: "#5EC6C6",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  /* Shortcuts */
  shortcutCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  mostOrderedCard: {
    backgroundColor: "rgba(255,167,38,0.18)",
    borderColor: "rgba(255,167,38,0.25)",
    shadowColor: "#FFA726",
    shadowOpacity: 0.25,
  },
  lastVisitedCard: {
    backgroundColor: "rgba(94,198,198,0.18)",
    borderColor: "rgba(94,198,198,0.25)",
    shadowColor: "#5EC6C6",
    shadowOpacity: 0.25,
  },
  mostOrderedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  mostOrderedBadgeText: {
    color: "#FFA726",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  shortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  shortcutSub: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
    fontWeight: "700",
    fontSize: 13,
  },

  /* Adverts */
  adCard: {
    width: "90%",
    height: 240,
    backgroundColor: "transparent",
    alignSelf: "center",
    marginTop: 18,
    marginBottom: 18,
    borderRadius: 24,
    overflow: "visible", // ✅ allow each slide card shadow to show
  },
  swiperContainer: { borderRadius: 24 },
  swiperSlide: { flex: 1 },
  rectangleImage: { width: "100%", height: "100%" },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
  },
  imageFallbackText: {
    color: "#999",
    fontWeight: "800",
    fontSize: 14,
  },
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  captionPill: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  captionText: {
    flex: 1,
    color: "#0f1a19",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.2,
  },

  /* ✅ New: each advert slide is its own card */
  adSlideWrap: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  adSlideCard: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },

  /* Ad center */
  adCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  adInfoText: {
    marginTop: 8,
    color: "#666",
    fontWeight: "800",
    fontSize: 14,
  },
});
