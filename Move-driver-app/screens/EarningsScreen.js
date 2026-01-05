import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { getToken } from "../utils/storage";

export default function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month, total

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2f66ff" />
      </View>
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

  const PeriodButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.periodBtn, selectedPeriod === value && styles.periodBtnActive]}
      onPress={() => setSelectedPeriod(value)}
      activeOpacity={0.8}
    >
      <Text style={[styles.periodText, selectedPeriod === value && styles.periodTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 18, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2f66ff" />}
    >
      <Text style={styles.title}>Earnings</Text>
      <Text style={styles.subtitle}>Track your income and performance</Text>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <PeriodButton label="Today" value="today" />
        <PeriodButton label="This Week" value="week" />
        <PeriodButton label="This Month" value="month" />
        <PeriodButton label="Total" value="total" />
      </View>

      {/* Main Earnings Card */}
      <View style={styles.mainCard}>
        <Text style={styles.amountLabel}>
          {selectedPeriod === 'today' ? "Today's Earnings" :
           selectedPeriod === 'week' ? "This Week" :
           selectedPeriod === 'month' ? "This Month" :
           "Total Earnings"}
        </Text>
        <Text style={styles.amount}>
          {earnings?.currency || 'USD'} {getDisplayAmount().toFixed(2)}
        </Text>
      </View>

      {/* Breakdown Cards */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>
            {earnings?.currency || 'USD'} {(earnings?.today || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>
            {earnings?.currency || 'USD'} {(earnings?.this_week || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>
            {earnings?.currency || 'USD'} {(earnings?.this_month || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>All Time</Text>
          <Text style={styles.statValue}>
            {earnings?.currency || 'USD'} {(earnings?.total || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Earnings Information</Text>
        <Text style={styles.infoText}>
          • Earnings are calculated from completed trips{'\n'}
          • Payouts are processed weekly{'\n'}
          • Check your wallet for pending payments{'\n'}
          • Contact support for earnings disputes
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b1220" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" },
  
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: "#aeb9cc", fontSize: 14, fontWeight: "600", marginBottom: 16 },

  periodSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#121b2e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: "#2f66ff",
    borderColor: "#2f66ff",
  },
  periodText: {
    color: "#aeb9cc",
    fontWeight: "800",
    fontSize: 12,
  },
  periodTextActive: {
    color: "#fff",
  },

  mainCard: {
    backgroundColor: "#121b2e",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 18,
  },
  amountLabel: {
    color: "#aeb9cc",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 12,
  },
  amount: {
    color: "#5EC6C6",
    fontSize: 42,
    fontWeight: "900",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#121b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statLabel: {
    color: "#aeb9cc",
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },

  infoBox: {
    backgroundColor: "#121b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  infoTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 10,
  },
  infoText: {
    color: "#aeb9cc",
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 20,
  },
});
