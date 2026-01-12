import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Entypo, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fetchProviderServicesByCategory } from "../api/providerServices";
import { useAuth } from "../app/auth-context";
import { useRoute, useNavigation, NavigationProp } from "@react-navigation/native";
import { ProviderService } from "../models/ProviderService";

const { width } = Dimensions.get("window");

const COLORS = {
  bg: "#0B1220",
  panel: "#0F1A2B",
  card: "rgba(255,255,255,0.06)",
  card2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.70)",
  muted2: "rgba(255,255,255,0.55)",
  brand: "#5EC6C6",
  warn: "#FFA726",
  pink: "#E91E63",
  yellow: "#FFD600",
  orange: "#FF6F00",
};

function money(n: any) {
  if (n === null || n === undefined) return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString();
}

export default function ServiceProvidedScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<any>>();

  let { service } = (route.params as any) || {};
  if (typeof service === "string") {
    try {
      service = JSON.parse(service);
    } catch {}
  }

  if (!service || !service.id) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg }}>
        <Text style={{ color: "#FF5D5D", fontSize: 16, fontWeight: "800" }}>No service category selected.</Text>
      </View>
    );
  }

  // Prevent infinite redirect loop for flight_booking
  const didRedirect = useRef(false);
  useEffect(() => {
    if (
      service?.service_type === "flight_booking" &&
      !didRedirect.current &&
      navigation.getState &&
      navigation.getState().routes &&
      navigation.getState().routes[navigation.getState().index]?.name !== "flight-booking"
    ) {
      didRedirect.current = true;
      if (typeof (navigation as any).replace === "function") {
        (navigation as any).replace("flight-booking");
      }
    }
  }, [service, navigation]);

  if (service?.service_type === "flight_booking") return null;

  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => user?.token || user?.access || user?.auth_token, [user]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchProviderServicesByCategory(service.id, token)
      .then((data) => setProviderServices(data))
      .catch((err) => {
        setError("Failed to load services");
        console.log("[ServiceProvidedScreen] Error fetching provider services:", err);
      })
      .finally(() => setLoading(false));
  }, [service.id, token]);

  const headerMeta = useMemo(() => {
    const t = service?.service_type;

    if (t === "wedding_car") {
      return {
        title: "Wedding Cars",
        desc: "Arrive in style on your special day with elegant wedding cars.",
        colors: ["rgba(233,30,99,0.28)", "rgba(11,18,32,0.00)"],
        badge: COLORS.pink,
        icon: <Entypo name="heart" size={22} color="#fff" />,
      };
    }
    if (t === "corporate_hire") {
      return {
        title: "Corporate Hires",
        desc: "Professional transport for executives and business events.",
        colors: ["rgba(255,167,38,0.28)", "rgba(11,18,32,0.00)"],
        badge: COLORS.warn,
        icon: <MaterialCommunityIcons name="briefcase-variant" size={22} color="#fff" />,
      };
    }
    if (t === "intercity_trip") {
      return {
        title: "Inter-city Trips",
        desc: "Comfortable rides between cities with trusted drivers.",
        colors: ["rgba(255,214,0,0.28)", "rgba(11,18,32,0.00)"],
        badge: COLORS.yellow,
        icon: <MaterialCommunityIcons name="highway" size={22} color="#0B1220" />,
      };
    }
    if (t === "rental") {
      return {
        title: "Car Rentals",
        desc: "Flexible rentals for any duration. Choose your ride and go.",
        colors: ["rgba(255,111,0,0.28)", "rgba(11,18,32,0.00)"],
        badge: COLORS.orange,
        icon: <MaterialCommunityIcons name="car-sports" size={22} color="#fff" />,
      };
    }
    // default
    return {
      title: service?.name || "Services",
      desc: "Browse available options from providers in this category.",
      colors: ["rgba(94,198,198,0.24)", "rgba(11,18,32,0.00)"],
      badge: COLORS.brand,
      icon: <MaterialCommunityIcons name="shape-outline" size={22} color="#fff" />,
    };
  }, [service]);

  const renderItem = ({ item }: { item: any }) => {
    const imageUri = item?.image1 || (item?.photos && item.photos.length > 0 ? item.photos[0] : null);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("service-detail", { providerServiceId: item.id })}
        activeOpacity={0.88}
      >
        <View style={styles.thumbWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <MaterialCommunityIcons name="image-off-outline" size={28} color="rgba(255,255,255,0.55)" />
            </View>
          )}

          {/* subtle corner badge */}
          <View style={[styles.cornerBadge, { borderColor: COLORS.border }]}>
            <MaterialCommunityIcons name="star" size={14} color={COLORS.brand} />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>

          {!!item.short_description && (
            <Text style={styles.desc} numberOfLines={2}>
              {item.short_description}
            </Text>
          )}

          <View style={styles.priceRow}>
            <View style={styles.pricePill}>
              <MaterialCommunityIcons name="tag-outline" size={15} color={COLORS.warn} />
              <Text style={styles.priceText}>
                {money(item.base_price)} {item.currency || ""}
              </Text>
            </View>

            {/* <View style={styles.ctaPill}>
              <Text style={styles.ctaText}>View</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.text} />
            </View> */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Gradient header */}
      <LinearGradient colors={headerMeta.colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero} />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {headerMeta.title}
          </Text>
          <Text style={styles.screenSub} numberOfLines={1}>
            {providerServices.length} option{providerServices.length === 1 ? "" : "s"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchProviderServicesByCategory(service.id, token)
              .then((data) => setProviderServices(data))
              .catch(() => setError("Failed to load services"))
              .finally(() => setLoading(false));
          }}
          style={styles.iconBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Category info card */}
      <View style={styles.categoryCard}>
        <View style={[styles.badge, { backgroundColor: headerMeta.badge }]}>
          {headerMeta.icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryTitle}>{headerMeta.title}</Text>
          <Text style={styles.categoryDesc}>{headerMeta.desc}</Text>
        </View>
      </View>

      {/* States */}
      {loading && <ActivityIndicator size="large" color={COLORS.warn} style={{ marginTop: 14 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* List */}
      <FlatList
        data={providerServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="tray-remove" size={36} color="rgba(255,255,255,0.55)" />
              <Text style={styles.emptyTitle}>No services yet</Text>
              <Text style={styles.emptyDesc}>Providers haven’t added options for this category.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 14 },

  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 190,
  },

  topBar: {
    paddingTop: Platform.OS === "android" ? 6 : 2,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  screenTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },

  screenSub: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
  },

  categoryCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 6,
    marginBottom: 10,
  },

  badge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  categoryDesc: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  errorText: {
    color: "#FF5D5D",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "800",
  },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 8,
  },

  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  thumb: {
    width: "100%",
    height: "100%",
  },

  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  cornerBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "rgba(15,26,43,0.85)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  desc: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  priceRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,167,38,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,167,38,0.28)",
  },

  priceText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 12,
  },

  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(94,198,198,0.12)",
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.28)",
  },

  ctaText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 12,
  },

  emptyWrap: {
    marginTop: 26,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16,
  },

  emptyDesc: {
    marginTop: 6,
    color: COLORS.muted,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
});
