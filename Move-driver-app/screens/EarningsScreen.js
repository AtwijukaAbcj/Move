import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { getToken } from "../utils/storage";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const API_BASE = "http://192.168.1.31:8000";

  const fetchEarnings = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const userId = await getToken("userId");
      if (!userId) return;

      const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/earnings/`);
      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
      }
    } catch (e) {
      console.log("Error fetching earnings:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings(true);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5EC6C6" />
        </View>
      </SafeAreaView>
    );
  }

  const getDisplayAmount = () => {
    if (!earnings) return 0;
    switch(selectedPeriod) {
      case 'today': return earnings.today || 0;
      case 'week': return earnings.this_week || 0;
      case 'month': return earnings.this_month || 0;
      case 'total': return earnings.total || 0;
      default: return 0;
    }
  };

  const periodLabels = {
    today: "Today's Earnings",
    week: "This Week",
    month: "This Month",
    total: "Total Earnings"
  };

  const PeriodButton = ({ label, value, icon }) => (
    <TouchableOpacity
      style={[styles.periodBtn, selectedPeriod === value && styles.periodBtnActive]}
      onPress={() => setSelectedPeriod(value)}
      activeOpacity={0.8}
    >
      {selectedPeriod === value ? (
        <LinearGradient
          colors={['#5EC6C6', '#4BA8A8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.periodBtnGradient}
        >
          <Ionicons name={icon} size={14} color="#0a0f1a" />
          <Text style={styles.periodTextActive}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.periodBtnInner}>
          <Ionicons name={icon} size={14} color="#6b7280" />
          <Text style={styles.periodText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5EC6C6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.subtitle}>Track your income and performance</Text>
        </View>

        {/* Period Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.periodScroll}
          contentContainerStyle={styles.periodSelector}
        >
          <PeriodButton label="Today" value="today" icon="today-outline" />
          <PeriodButton label="Week" value="week" icon="calendar-outline" />
          <PeriodButton label="Month" value="month" icon="calendar" />
          <PeriodButton label="Total" value="total" icon="stats-chart" />
        </ScrollView>

        {/* Main Earnings Card */}
        <LinearGradient
          colors={['#1e3a5f', '#152238']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainCard}
        >
          <View style={styles.mainCardIcon}>
            <FontAwesome5 name="dollar-sign" size={24} color="#10b981" />
          </View>
          <Text style={styles.amountLabel}>{periodLabels[selectedPeriod]}</Text>
          <Text style={styles.amount}>
            ${getDisplayAmount().toFixed(2)}
          </Text>
          <Text style={styles.currency}>{earnings?.currency || 'USD'}</Text>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.statCard}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="today-outline" size={18} color="#10b981" />
            </View>
            <Text style={styles.statValue}>${(earnings?.today || 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.statCard}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
              <Ionicons name="calendar-outline" size={18} color="#60a5fa" />
            </View>
            <Text style={styles.statValue}>${(earnings?.this_week || 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.statCard}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
              <Ionicons name="calendar" size={18} color="#a78bfa" />
            </View>
            <Text style={styles.statValue}>${(earnings?.this_month || 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.statCard}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Ionicons name="trophy-outline" size={18} color="#fbbf24" />
            </View>
            <Text style={styles.statValue}>${(earnings?.total || 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>All Time</Text>
          </LinearGradient>
        </View>

        {/* Info Box */}
        <LinearGradient
          colors={['#1a2744', '#0f1a2e']}
          style={styles.infoBox}
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={20} color="#5EC6C6" />
            </View>
            <Text style={styles.infoTitle}>Earnings Information</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Earnings are calculated from completed trips</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Payouts are processed weekly</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Check your wallet for pending payments</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Contact support for earnings disputes</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0f1a" },
  
  header: {
    marginBottom: 20,
  },
  title: { 
    color: "#fff", 
    fontSize: 32, 
    fontWeight: "900", 
    marginBottom: 6 
  },
  subtitle: { 
    color: "#6b7280", 
    fontSize: 15, 
    fontWeight: "600" 
  },

  periodScroll: {
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 10,
  },
  periodBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  periodBtnActive: {},
  periodBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  periodBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  periodText: {
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 13,
  },
  periodTextActive: {
    color: "#0a0f1a",
    fontWeight: "800",
    fontSize: 13,
  },

  mainCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#5EC6C6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    color: "#5EC6C6",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1,
  },
  currency: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },

  infoBox: {
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(94, 198, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTitle: { 
    color: "#fff", 
    fontWeight: "900", 
    fontSize: 16 
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  infoText: { 
    color: "#9ca3af", 
    fontWeight: "600", 
    fontSize: 13,
    flex: 1,
  },
});
