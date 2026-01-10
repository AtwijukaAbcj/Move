import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Entypo, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Service } from "../models/Service";
import { fetchServices } from "../api/services";
import { useRouter } from "expo-router";

import { ColorValue } from 'react-native';
type IconData = { icon: React.ReactNode; gradient: readonly [ColorValue, ColorValue, ...ColorValue[]] };

export default function ServicesScreen() {
  const router = useRouter();

  // Map iconType to icon component
  function getIconComponent(iconType: string | undefined): React.ReactNode {
    if (!iconType) return <MaterialCommunityIcons name="car-sports" size={38} color="rgba(255, 255, 255, 1)" />;
      const calmColor = "#A7C7C7";
    // FontAwesome5 support: 'fas fa-cogs', 'far fa-user', 'fab fa-github', etc.
    if (/^fa[brs]? /.test(iconType)) {
      const [prefix, faName] = iconType.split(' ');
      // Remove 'fa-' prefix for FontAwesome5
      const name = faName?.replace(/^fa-/, '') || 'car';
      let solid = false, brand = false;
      if (prefix === 'fas') solid = true;
      if (prefix === 'fab') brand = true;
      // FontAwesome5 uses 'solid', 'regular', 'brands' props
      return (
        <FontAwesome5
          name={name}
          size={38}
            color={calmColor}
          solid={solid}
          brand={brand}
        />
      );
    }
    // Support MaterialCommunityIcons, Ionicons, Entypo by prefix, e.g. 'mci:car-sports', 'ion:airplane', 'ent:heart'
    if (iconType.startsWith('mci:')) {
      return <MaterialCommunityIcons name={iconType.replace('mci:', '')} size={20} color={calmColor} />;
    }
    if (iconType.startsWith('ion:')) {
      return <Ionicons name={iconType.replace('ion:', '')} size={20} color={calmColor} />;
    }
    if (iconType.startsWith('ent:')) {
      return <Entypo name={iconType.replace('ent:', '')} size={20} color={calmColor} />;
    }
    // Default fallback
     return <MaterialCommunityIcons name={iconType} size={20} color={calmColor} />;
  }

  const [search, setSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const data = await fetchServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("fetchServices error:", e);
      setServices([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadServices();
      setLoading(false);
    })();
  }, [loadServices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, [loadServices]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;

    return services.filter((s) => {
      const name = ((s as any)?.name ?? "").toLowerCase();
      const desc = ((s as any)?.description ?? "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [services, search]);

  const ListHeader = useMemo(() => {
    return (
      <View>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Services</Text>
          <Text style={styles.headerSub}>Premium rides for every occasion</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchIconWrap}>
            <Ionicons name="search" size={18} color="#5EC6C6" />
          </View>
          <TextInput
            style={styles.searchBar}
            placeholder="Search services..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={10} color="rgba(255,255,255,0.45)" />
            </Pressable>
          )}
        </View>

        {/* Promo Banner */}
        <Pressable
          style={({ pressed }) => [
            styles.promoBanner,
            { transform: [{ scale: pressed ? 0.99 : 1 }] },
          ]}
          onPress={() => router.push("/flight-booking")}
        >
          <LinearGradient
            colors={["#35736E", "#2A5F5D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoIconWrap}>
                <MaterialCommunityIcons name="airplane-takeoff" size={24} color="#fff" />
              </View>

              <View style={styles.promoTextWrap}>
                <View style={styles.promoNewBadge}>
                  <Text style={styles.promoNewText}>NEW</Text>
                </View>
                <Text style={styles.promoTitle}>Flight Booking</Text>
                <Text style={styles.promoDesc}>Book local & international flights</Text>
              </View>

              <View style={styles.promoArrow}>
                <Ionicons name="arrow-forward" size={18} color="#35736E" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Services</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredServices.length}</Text>
          </View>
        </View>
      </View>
    );
  }, [filteredServices.length, router, search]);

  const renderServiceItem = useCallback(
    ({ item }: { item: Service }) => {
      const iconNode = getIconComponent((item as any)?.icon);

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/service-provided",
              params: { service: JSON.stringify(item) },
            })
          }
          style={({ pressed }) => [
            styles.gridCard,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <View style={styles.gridTop}>
            <View style={styles.gridIconBubble}>
              {iconNode}
            </View>
          </View>

          <View style={styles.gridBody}>
            <Text style={styles.gridTitle} numberOfLines={1}>
              {(item as any)?.name ?? "Service"}
            </Text>

            {!!(item as any)?.description ? (
              <Text style={styles.gridDesc} numberOfLines={2}>
                {(item as any)?.description}
              </Text>
            ) : (
              <Text style={styles.gridDesc} numberOfLines={2}>
                Tap to view options and book
              </Text>
            )}

            <View style={styles.gridFooter}>
              <View style={styles.pillMini}>
                <Text style={styles.pillMiniText}>View</Text>
                <Ionicons name="chevron-forward" size={14} color="#5ec6c6" />
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [router]
  );

  const SkeletonGrid = useMemo(() => {
    const skeletons = Array.from({ length: 8 }).map((_, i) => ({ id: i }));
    return (
      <FlatList
        data={skeletons}
        keyExtractor={(i) => i.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 6 }}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        ListHeaderComponent={ListHeader}
        renderItem={() => (
          <View style={styles.gridCard}>
            <View style={[styles.gridTop, { backgroundColor: "#2F3642" }]} />
            <View style={{ padding: 12 }}>
              <View style={{ height: 14, backgroundColor: "#2F3642", borderRadius: 10, width: "85%" }} />
              <View style={{ marginTop: 10, height: 10, backgroundColor: "#2F3642", borderRadius: 10, width: "95%" }} />
              <View style={{ marginTop: 6, height: 10, backgroundColor: "#2F3642", borderRadius: 10, width: "70%" }} />
            </View>
          </View>
        )}
      />
    );
  }, [ListHeader]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#12161C", "#1A1F26", "#1A1F26"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.gridWrapper}>
        {loading ? (
          SkeletonGrid
        ) : filteredServices.length === 0 ? (
          <View style={styles.emptyWrap}>
            {ListHeader}
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={48} color="#5EC6C6" />
            </View>
            <Text style={styles.emptyTitle}>No services found</Text>
            <Text style={styles.emptyDesc}>Try a different search term</Text>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            renderItem={renderServiceItem}
            keyExtractor={(item: any) => String(item.id)}
            numColumns={3}
            key={'services-3-cols'}
            columnWrapperStyle={{ gap: 12, paddingHorizontal: 4 }}
            contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeader}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1F26" },

  /** Header */
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: 0.3 },
  headerSub: { marginTop: 4, fontSize: 14, color: "rgba(255,255,255,0.55)", fontWeight: "600" },

  /** Search */
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#252B35",
    borderRadius: 18,
    marginHorizontal: 6,
    marginTop: 16,
    marginBottom: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: "rgba(94,198,198,0.18)",
  },
  searchIconWrap: { width: 44, height: 52, alignItems: "center", justifyContent: "center" },
  searchBar: { flex: 1, height: 52, fontSize: 15, color: "#fff", fontWeight: "600" },
  clearBtn: { width: 44, height: 52, alignItems: "center", justifyContent: "center" },

  /** Promo Banner */
  promoBanner: {
    marginHorizontal: 6,
    marginBottom: 18,
    borderRadius: 18,
    overflow: "hidden",
  },
  promoGradient: { padding: 18 },
  promoContent: { flexDirection: "row", alignItems: "center" },
  promoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  promoTextWrap: { flex: 1, marginLeft: 14 },
  promoNewBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#26c9ffff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 18,
  },
  promoNewText: { fontSize: 9, fontWeight: "900", color: "#0f1a19", letterSpacing: 0.5 },
  promoTitle: { fontSize: 17, fontWeight: "900", color: "#fff" },
  promoDesc: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginTop: 2 },
  promoArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  /** Section header */
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  countBadge: {
    marginLeft: 10,
    backgroundColor: "rgba(94,198,198,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 18,
  },
  countText: { fontSize: 12, fontWeight: "900", color: "#5EC6C6" },

  /** Grid wrapper */
  gridWrapper: { flex: 1, paddingHorizontal: 8 },

  /** NEW: Grid Card */
  gridCard: {
    width: 110,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "rgba(37,43,53,0.92)",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(94,198,198,0.10)",
    marginBottom: 12,
    marginHorizontal: 2,
  },
  gridTop: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 0,
  },
  gridIconBubble: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  gridBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    width: '100%',
  },
  gridTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 2,
  },
  gridDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 16,
    fontWeight: "600",
    textAlign: 'center',
    minHeight: 28,
  },
  gridFooter: { display: 'none' },
  pillMini: { display: 'none' },
  pillMiniText: { display: 'none' },

  /** Empty */
  emptyWrap: { flex: 1, paddingTop: 8 },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 18,
    backgroundColor: "rgba(94,198,198,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    alignSelf: "center",
  },
  emptyTitle: { marginTop: 18, fontSize: 18, fontWeight: "900", color: "#fff", textAlign: "center" },
  emptyDesc: { marginTop: 6, fontSize: 14, color: "rgba(255,255,255,0.55)", fontWeight: "600", textAlign: "center" },
});
