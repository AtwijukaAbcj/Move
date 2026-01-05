import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const THEME = {
  primary: "#35736E",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

type PaymentMethod = "card" | "mobilemoney" | null;

export default function PaymentMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  
  // Card details
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  
  // Mobile money details
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState<"mtn" | "vodafone" | "airtel" | null>(null);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleProceed = () => {
    if (!selectedMethod) {
      Alert.alert("Payment Method Required", "Please select a payment method");
      return;
    }

    if (selectedMethod === "card") {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        Alert.alert("Missing Information", "Please fill in all card details");
        return;
      }
      if (cardNumber.replace(/\s/g, "").length !== 16) {
        Alert.alert("Invalid Card", "Please enter a valid 16-digit card number");
        return;
      }
    }

    if (selectedMethod === "mobilemoney") {
      if (!phoneNumber || !provider) {
        Alert.alert("Missing Information", "Please enter phone number and select provider");
        return;
      }
    }

    router.push({
      pathname: "/payment-process",
      params: { 
        ...params,
        paymentMethod: selectedMethod,
        cardNumber: selectedMethod === "card" ? cardNumber : "",
        phoneNumber: selectedMethod === "mobilemoney" ? phoneNumber : "",
        provider: provider || ""
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Total Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>${params.fare}</Text>
        </View>

        <Text style={styles.sectionTitle}>SELECT PAYMENT METHOD</Text>

        {/* Credit/Debit Card */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            selectedMethod === "card" && styles.methodCardActive,
          ]}
          activeOpacity={0.9}
          onPress={() => setSelectedMethod("card")}
        >
          <View style={styles.methodHeader}>
            <View style={styles.methodIconBox}>
              <Ionicons name="card" size={24} color={THEME.aqua} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Credit / Debit Card</Text>
              <Text style={styles.methodSub}>Visa, Mastercard, Amex</Text>
            </View>
            <View
              style={[
                styles.radio,
                selectedMethod === "card" && styles.radioActive,
              ]}
            >
              {selectedMethod === "card" && (
                <View style={styles.radioDot} />
              )}
            </View>
          </View>

          {selectedMethod === "card" && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                maxLength={19}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              />

              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#6B7280"
                autoCapitalize="words"
                value={cardName}
                onChangeText={setCardName}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={5}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiry(text))}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                    value={cvv}
                    onChangeText={setCvv}
                  />
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Mobile Money */}
        <TouchableOpacity
          style={[
            styles.methodCard,
            selectedMethod === "mobilemoney" && styles.methodCardActive,
          ]}
          activeOpacity={0.9}
          onPress={() => setSelectedMethod("mobilemoney")}
        >
          <View style={styles.methodHeader}>
            <View style={[styles.methodIconBox, { backgroundColor: "#FFA72620" }]}>
              <Ionicons name="phone-portrait" size={24} color={THEME.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Mobile Money</Text>
              <Text style={styles.methodSub}>MTN, Vodafone, AirtelTigo</Text>
            </View>
            <View
              style={[
                styles.radio,
                selectedMethod === "mobilemoney" && styles.radioActive,
              ]}
            >
              {selectedMethod === "mobilemoney" && (
                <View style={styles.radioDot} />
              )}
            </View>
          </View>

          {selectedMethod === "mobilemoney" && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Select Provider</Text>
              <View style={styles.providerRow}>
                <TouchableOpacity
                  style={[
                    styles.providerBtn,
                    provider === "mtn" && styles.providerBtnActive,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setProvider("mtn")}
                >
                  <Text style={[styles.providerText, provider === "mtn" && styles.providerTextActive]}>
                    MTN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.providerBtn,
                    provider === "vodafone" && styles.providerBtnActive,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setProvider("vodafone")}
                >
                  <Text style={[styles.providerText, provider === "vodafone" && styles.providerTextActive]}>
                    Vodafone
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.providerBtn,
                    provider === "airtel" && styles.providerBtnActive,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setProvider("airtel")}
                >
                  <Text style={[styles.providerText, provider === "airtel" && styles.providerTextActive]}>
                    AirtelTigo
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="024 123 4567"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={20} color="#5EC6C6" />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, !selectedMethod && styles.primaryBtnDisabled]}
          activeOpacity={0.9}
          onPress={handleProceed}
          disabled={!selectedMethod}
        >
          <Text style={styles.primaryBtnText}>Proceed to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color={THEME.ink} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.dark },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 16,
    backgroundColor: THEME.dark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

  content: { flex: 1 },

  amountCard: {
    backgroundColor: "#2D313A",
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.2)",
  },
  amountLabel: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  amountValue: {
    color: THEME.aqua,
    fontSize: 36,
    fontWeight: "900",
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 12,
  },

  methodCard: {
    backgroundColor: "#2D313A",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.06)",
  },
  methodCardActive: {
    borderColor: THEME.aqua,
    backgroundColor: "rgba(94,198,198,0.05)",
  },

  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(94,198,198,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  methodTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  methodSub: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "700",
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#6B7280",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: THEME.aqua,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: THEME.aqua,
  },

  formContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  inputLabel: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  row: {
    flexDirection: "row",
  },

  providerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  providerBtn: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.06)",
  },
  providerBtnActive: {
    borderColor: THEME.aqua,
    backgroundColor: "rgba(94,198,198,0.1)",
  },
  providerText: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "800",
  },
  providerTextActive: {
    color: THEME.aqua,
  },

  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(94,198,198,0.1)",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  securityText: {
    flex: 1,
    color: "#9AA4B2",
    fontSize: 12,
    fontWeight: "700",
  },

  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: THEME.dark,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  primaryBtn: {
    backgroundColor: THEME.aqua,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: { color: THEME.ink, fontSize: 16, fontWeight: "900" },
});
