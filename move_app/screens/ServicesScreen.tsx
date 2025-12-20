import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  Entypo,
} from "@expo/vector-icons";
import { Service } from "../models/Service";
import { fetchServices } from "../api/services";
import { useRouter } from "expo-router";

export default function ServicesScreen() {
  const router = useRouter();

  // ✅ same logic, just UI polish
  const ICON_MAP: Record<string, JSX.Element> = {
    plane: <MaterialCommunityIcons name="airplane-takeoff" size={30} color="#5EC6C6" />,
    briefcase: <MaterialCommunityIcons name="briefcase-variant" size={30} color="#FFA726" />,
    heart: <Entypo name="heart" size={30} color="#E91E63" />,
    road: <MaterialCommunityIcons name="highway" size={30} color="#FFD600" />,
    car: <MaterialCommunityIcons name="car-sports" size={30} color="#FF6F00" />,
  };

  const [search, setSearch] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchServices()
      .then((data) => {
        setServices(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/service-provided",
          params: { service: JSON.stringify(item) },
        })
      }
    >
      <View style={styles.cardTop}>
        <View style={styles.iconCircle}>
          {ICON_MAP[item.icon] || (
            <MaterialCommunityIcons name="car-sports" size={30} color="#FFA726" />
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>

      {/* <View style={styles.cardFooter}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Explore</Text>
        </View>
      </View> */}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={20} color="#9AA4B2" style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search services..."
          placeholderTextColor="#9AA4B2"
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color="#9AA4B2" />
          </TouchableOpacity>
        )}
      </View>

      {/* Banner */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <MaterialCommunityIcons name="star-circle" size={22} color="#FFA726" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>New! Flight Booking</Text>
            <Text style={styles.infoDesc} numberOfLines={2}>
              Book local and international flights right from the app.
            </Text>
          </View>

          <View style={styles.infoCTA}>
            <Text style={styles.infoCTAText}>Try</Text>
            <Ionicons name="chevron-forward" size={14} color="#0f1a19" />
          </View>
        </View>
      </View>

      {/* Heading */}
      <View style={styles.headingWrap}>
        <Text style={styles.header}>Book now</Text>
        <Text style={styles.subHeader}>Premium rides for every occasion</Text>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#5EC6C6" />
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={{ paddingBottom: 24, paddingTop: 6 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#23272F",
    paddingTop: Platform.OS === "ios" ? 18 : 26,
  },

  /** Search */
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D313A",
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  searchBar: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#fff",
    paddingHorizontal: 10,
  },
  clearBtn: {
    width: 40,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  /** Banner */
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#35736E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  infoDesc: { color: "rgba(255,255,255,0.92)", marginTop: 2, fontSize: 13, lineHeight: 17 },

  infoCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
  },
  infoCTAText: { fontWeight: "900", color: "#0f1a19", fontSize: 12 },

  /** Heading */
  headingWrap: { marginHorizontal: 16, marginBottom: 8 },
  header: { fontSize: 22, fontWeight: "900", color: "#FFA726", letterSpacing: 0.3 },
  subHeader: { marginTop: 4, color: "#B0BEC5", fontWeight: "600" },

  /** Grid */
  gridWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  columnWrap: { justifyContent: "space-between", paddingHorizontal: 6 },

  /** Cards */
  card: {
    flex: 1,
    minHeight: 170,
    maxWidth: "48%",
    backgroundColor: "#2D313A",
    borderRadius: 20,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  desc: {
    marginTop: 6,
    fontSize: 13,
    color: "#B0BEC5",
    lineHeight: 16,
    fontWeight: "600",
  },

  cardFooter: { marginTop: 12, flexDirection: "row", justifyContent: "flex-start" },
  pill: {
    backgroundColor: "rgba(94,198,198,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.25)",
  },
  pillText: { color: "#5EC6C6", fontWeight: "900", fontSize: 12 },

  /** Loading */
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 10, color: "#B0BEC5", fontWeight: "700" },
});
