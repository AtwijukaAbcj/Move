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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
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
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5EC6C6" />
        </View>
      </SafeAreaView>
    );
  }

  const transactions = wallet?.transactions || [];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5EC6C6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Manage your earnings and payouts</Text>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#1e3a5f', '#152238']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIcon}>
              <MaterialCommunityIcons name="wallet" size={24} color="#5EC6C6" />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          
          <Text style={styles.balanceAmount}>
            ${(wallet?.balance || 0).toFixed(2)}
          </Text>
          <Text style={styles.currency}>{wallet?.currency || 'USD'}</Text>

          <View style={styles.balanceFooter}>
            <View style={styles.pendingContainer}>
              <Ionicons name="time-outline" size={16} color="#fbbf24" />
              <Text style={styles.pendingLabel}>Pending</Text>
              <Text style={styles.pendingValue}>
                ${(wallet?.pending || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={['#5EC6C6', '#4BA8A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.withdrawBtnGradient}
            >
              <Ionicons name="arrow-up-circle" size={20} color="#0a0f1a" />
              <Text style={styles.withdrawBtnText}>Request Payout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={['#1a2744', '#0f1a2e']}
              style={styles.actionBtnInner}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="add" size={22} color="#10b981" />
              </View>
              <Text style={styles.actionText}>Add Bank</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={['#1a2744', '#0f1a2e']}
              style={styles.actionBtnInner}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                <Ionicons name="document-text-outline" size={22} color="#60a5fa" />
              </View>
              <Text style={styles.actionText}>Statements</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
            <LinearGradient
              colors={['#1a2744', '#0f1a2e']}
              style={styles.actionBtnInner}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                <Ionicons name="help-circle-outline" size={22} color="#a78bfa" />
              </View>
              <Text style={styles.actionText}>Support</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Payout Info */}
        <LinearGradient
          colors={['#1a2744', '#0f1a2e']}
          style={styles.infoCard}
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={20} color="#5EC6C6" />
            </View>
            <Text style={styles.infoTitle}>Payout Information</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Payouts are processed every Monday</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Minimum payout amount is $50</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Funds arrive in 2-3 business days</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
            <Text style={styles.infoText}>Update your bank details in settings</Text>
          </View>
        </LinearGradient>

        {/* Transactions Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIcon}>
              <Ionicons name="swap-vertical" size={16} color="#fbbf24" />
            </View>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>
        </View>

        {transactions.length === 0 ? (
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="history" size={48} color="#6b7280" />
            </View>
            <Text style={styles.emptyTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyText}>Your transaction history will appear here</Text>
          </LinearGradient>
        ) : (
          transactions.map((tx, index) => (
            <LinearGradient
              key={tx.id || index}
              colors={['#1a2744', '#0f1a2e']}
              style={styles.txCard}
            >
              <View style={[
                styles.txIcon,
                { backgroundColor: tx.type === 'credit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }
              ]}>
                <Ionicons 
                  name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
                  size={18} 
                  color={tx.type === 'credit' ? '#10b981' : '#ef4444'} 
                />
              </View>
              <View style={styles.txContent}>
                <Text style={styles.txTitle}>{tx.description || "Transaction"}</Text>
                <Text style={styles.txDate}>{tx.date || "Recent"}</Text>
              </View>
              <Text style={[styles.txAmount, tx.type === 'credit' && styles.txCredit]}>
                {tx.type === 'credit' ? '+' : '-'}${tx.amount || 0}
              </Text>
            </LinearGradient>
          ))
        )}
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

  balanceCard: {
    borderRadius: 24,
    padding: 24,
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
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(94, 198, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceLabel: { 
    color: "#9ca3af", 
    fontWeight: "700", 
    fontSize: 14 
  },
  balanceAmount: { 
    color: "#5EC6C6", 
    fontSize: 48, 
    fontWeight: "900",
    letterSpacing: -1,
  },
  currency: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  balanceFooter: { 
    marginBottom: 20,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
  },
  pendingLabel: { 
    color: "#fbbf24", 
    fontWeight: "700", 
    fontSize: 13 
  },
  pendingValue: { 
    color: "#fbbf24", 
    fontWeight: "900", 
    fontSize: 14 
  },

  withdrawBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  withdrawBtnGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  withdrawBtnText: { 
    color: "#0a0f1a", 
    fontWeight: "900", 
    fontSize: 15 
  },

  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtnInner: {
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
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
  infoIconContainer: {
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: { 
    color: "#fff", 
    fontWeight: "900", 
    fontSize: 18 
  },

  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { 
    color: "#fff", 
    fontWeight: "900", 
    fontSize: 18, 
    marginBottom: 8 
  },
  emptyText: { 
    color: "#6b7280", 
    fontWeight: "600", 
    textAlign: "center" 
  },

  txCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txContent: {
    flex: 1,
  },
  txTitle: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 15, 
    marginBottom: 4 
  },
  txDate: { 
    color: "#6b7280", 
    fontWeight: "600", 
    fontSize: 12 
  },
  txAmount: { 
    color: "#ef4444", 
    fontWeight: "900", 
    fontSize: 16 
  },
  txCredit: { 
    color: "#10b981" 
  },
});
