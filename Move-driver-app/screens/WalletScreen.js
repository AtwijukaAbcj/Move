import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { getToken } from "../utils/storage";

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);

  const API_BASE = "http://192.168.1.31:8000";

  const fetchWallet = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const userId = await getToken("userId");
      if (!userId) return;

      const res = await fetch(`${API_BASE}/api/corporate/driver/${userId}/wallet/`);
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (e) {
      console.log("Error fetching wallet:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallet(true);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2f66ff" />
      </View>
    );
  }

  const transactions = wallet?.transactions || [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: 18, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2f66ff" />}
    >
      <Text style={styles.title}>Wallet</Text>
      <Text style={styles.subtitle}>Manage your earnings and payouts</Text>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {wallet?.currency || 'USD'} {(wallet?.balance || 0).toFixed(2)}
        </Text>

        <View style={styles.balanceFooter}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Pending</Text>
            <Text style={styles.balanceItemValue}>
              {wallet?.currency || 'USD'} {(wallet?.pending || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.85}>
          <Text style={styles.withdrawBtnText}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      {/* Payout Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Payout Information</Text>
        <Text style={styles.infoText}>
          • Payouts are processed every Monday{'\n'}
          • Minimum payout amount is $50{'\n'}
          • Funds arrive in 2-3 business days{'\n'}
          • Update your bank details in settings
        </Text>
      </View>

      {/* Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyText}>Your transaction history will appear here</Text>
        </View>
      ) : (
        transactions.map((tx, index) => (
          <View key={tx.id || index} style={styles.txCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{tx.description || "Transaction"}</Text>
              <Text style={styles.txDate}>{tx.date || "Recent"}</Text>
            </View>
            <Text style={[styles.txAmount, tx.type === 'credit' && styles.txCredit]}>
              {tx.type === 'credit' ? '+' : '-'} {wallet?.currency || 'USD'} {tx.amount || 0}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b1220" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b1220" },
  
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: "#aeb9cc", fontSize: 14, fontWeight: "600", marginBottom: 16 },

  balanceCard: {
    backgroundColor: "#121b2e",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  balanceLabel: { color: "#aeb9cc", fontWeight: "800", fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: "#5EC6C6", fontSize: 42, fontWeight: "900", marginBottom: 16 },
  balanceFooter: { marginBottom: 16 },
  balanceItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  balanceItemLabel: { color: "#aeb9cc", fontWeight: "800", fontSize: 13 },
  balanceItemValue: { color: "#fff", fontWeight: "900", fontSize: 13 },

  withdrawBtn: {
    backgroundColor: "#2f66ff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  withdrawBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  infoCard: {
    backgroundColor: "#121b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  infoTitle: { color: "#fff", fontWeight: "900", fontSize: 15, marginBottom: 10 },
  infoText: { color: "#aeb9cc", fontWeight: "600", fontSize: 13, lineHeight: 20 },

  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 18, marginBottom: 12 },

  emptyState: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 18, marginBottom: 8 },
  emptyText: { color: "#aeb9cc", fontWeight: "600", textAlign: "center" },

  txCard: {
    backgroundColor: "#121b2e",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  txTitle: { color: "#fff", fontWeight: "800", fontSize: 15, marginBottom: 4 },
  txDate: { color: "#aeb9cc", fontWeight: "600", fontSize: 12 },
  txAmount: { color: "#ff3b30", fontWeight: "900", fontSize: 16 },
  txCredit: { color: "#5EC6C6" },
});
