import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

type Method = "card" | "mobilemoney";

type Tx = {
  id: number;
  type: "credit" | "debit";
  amount: number;
  date: string;
  desc: string;
};

export default function WalletScreen() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<Method>("card");

  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");

  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [provider, setProvider] = useState<string>("");

  const resetForm = () => {
    setAmount("");
    setCardNumber("");
    setCardName("");
    setExpiry("");
    setCvv("");
    setMobileNumber("");
    setProvider("");
  };

  // API base URL
  const API_BASE = "https://your-backend-domain/api/wallet";

  // Fetch wallet balance and transactions
  const fetchWallet = async () => {
    setLoading(true);
    try {
      // Fetch balance
      const balRes = await fetch(`${API_BASE}/balance/`, {
        credentials: "include",
      });
      const balData = await balRes.json();
      setBalance(balData.balance || 0);

      // Fetch transactions
      const txRes = await fetch(`${API_BASE}/transactions/`, {
        credentials: "include",
      });
      const txData = await txRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
    } catch (err) {
      // optional: show toast/snackbar
      setBalance(0);
      setTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // Add credit
  const handleAddCredit = async () => {
    const amt = parseInt(amount, 10);
    if (!Number.isFinite(amt) || amt <= 0) return;

    try {
      const res = await fetch(`${API_BASE}/add-credit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amt }),
      });

      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        await fetchWallet();
        setModalVisible(false);
        resetForm();
      } else {
        // optional: show error message
      }
    } catch (err) {
      // optional: show error message
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
        <Ionicons name="wallet" size={32} color="#35736E" />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {loading ? "..." : `₦${balance.toLocaleString()}`}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Credit</Text>
        </TouchableOpacity>
      </View>

      {/* Add Credit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Credit</Text>

            <TextInput
              style={styles.input}
              placeholder="Amount (₦)"
              placeholderTextColor="#9AA4B2"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.methodRow}>
              <Pressable
                style={[styles.methodBtn, method === "card" && styles.methodBtnActive]}
                onPress={() => setMethod("card")}
              >
                <MaterialIcons
                  name="credit-card"
                  size={20}
                  color={method === "card" ? "#5EC6C6" : "#888"}
                />
                <Text style={[styles.methodBtnText, method === "card" && { color: "#5EC6C6" }]}>
                  Credit Card
                </Text>
              </Pressable>

              <Pressable
                style={[styles.methodBtn, method === "mobilemoney" && styles.methodBtnActive]}
                onPress={() => setMethod("mobilemoney")}
              >
                <MaterialIcons
                  name="phone-android"
                  size={20}
                  color={method === "mobilemoney" ? "#5EC6C6" : "#888"}
                />
                <Text style={[styles.methodBtnText, method === "mobilemoney" && { color: "#5EC6C6" }]}>
                  Mobile Money
                </Text>
              </Pressable>
            </View>

            {method === "card" ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Card Number"
                  placeholderTextColor="#9AA4B2"
                  keyboardType="number-pad"
                  value={cardNumber}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/\D/g, "");
                    let formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
                    setCardNumber(formatted.slice(0, 19));
                  }}
                  maxLength={19}
                  autoComplete="cc-number"
                  textContentType="creditCardNumber"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Cardholder Name"
                  placeholderTextColor="#9AA4B2"
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                  autoComplete="cc-name"
                  textContentType="name"
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="MM/YY"
                    placeholderTextColor="#9AA4B2"
                    value={expiry}
                    onChangeText={(text) => {
                      let cleaned = text.replace(/[^\d]/g, "");
                      if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
                      setExpiry(cleaned.slice(0, 5));
                    }}
                    maxLength={5}
                    keyboardType="number-pad"
                    autoComplete="cc-exp"
                    textContentType="creditCardExpiration"
                  />

                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="CVV"
                    placeholderTextColor="#9AA4B2"
                    value={cvv}
                    onChangeText={(text) => setCvv(text.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    keyboardType="number-pad"
                    secureTextEntry
                    autoComplete="cc-csc"
                    textContentType="creditCardSecurityCode"
                  />
                </View>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor="#9AA4B2"
                  keyboardType="phone-pad"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />

                <View style={styles.networkBox}>
                  <Text style={styles.networkLabel}>Select Network</Text>
                  <View style={styles.networkRow}>
                    {["MTN", "Airtel", "Africell", "UTL"].map((net) => (
                      <TouchableOpacity
                        key={net}
                        style={[styles.networkChip, provider === net && styles.networkChipActive]}
                        onPress={() => setProvider(net)}
                      >
                        <Text style={[styles.networkChipText, provider === net && styles.networkChipTextActive]}>
                          {net}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddCredit}>
                <Text style={styles.modalAddText}>Add Credit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <ScrollView style={styles.txList} contentContainerStyle={{ paddingBottom: 20 }}>
        {loading ? (
          <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>Loading...</Text>
        ) : transactions.length === 0 ? (
          <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
            No transactions found.
          </Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <Ionicons
                name={tx.type === "credit" ? "arrow-down-circle" : "arrow-up-circle"}
                size={20}
                color={tx.type === "credit" ? "#5EC6C6" : "#FFA726"}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.txDesc}>{tx.desc}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, tx.type === "credit" ? styles.credit : styles.debit]}>
                {tx.type === "credit" ? "+" : "-"}₦{tx.amount}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#23272F", padding: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#fff" },

  balanceCard: {
    backgroundColor: "#35736E",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  balanceLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
  balanceAmount: { color: "#fff", fontWeight: "900", fontSize: 32, marginVertical: 8 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5EC6C6",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "900", fontSize: 15, marginLeft: 8 },

  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 18, marginBottom: 10 },

  txList: { flex: 1 },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2D313A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  txDesc: { color: "#fff", fontWeight: "700", fontSize: 14 },
  txDate: { color: "#A7C7C7", fontSize: 12, marginTop: 2 },
  txAmount: { fontWeight: "900", fontSize: 16 },
  credit: { color: "#5EC6C6" },
  debit: { color: "#FFA726" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#23272F",
    borderRadius: 18,
    padding: 24,
    width: "88%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 22,
    marginBottom: 18,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#2D313A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 12,
  },

  methodRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    justifyContent: "center",
  },
  methodBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#23272F",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  methodBtnActive: {
    borderColor: "#5EC6C6",
    backgroundColor: "#1a232a",
  },
  methodBtnText: {
    color: "#888",
    fontWeight: "900",
    fontSize: 14,
    marginLeft: 8,
  },

  networkBox: {
    backgroundColor: "#2D313A",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  networkLabel: { color: "#fff", fontWeight: "800", marginBottom: 8 },
  networkRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  networkChip: {
    backgroundColor: "#23272F",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  networkChipActive: { backgroundColor: "#5EC6C6", borderColor: "#5EC6C6" },
  networkChipText: { color: "#A7C7C7", fontWeight: "900" },
  networkChipTextActive: { color: "#fff" },

  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  modalCancelText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  modalAddBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#5EC6C6",
  },
  modalAddText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});
