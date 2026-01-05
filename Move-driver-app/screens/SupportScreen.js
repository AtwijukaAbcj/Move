import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";

export default function SupportScreen() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const topics = [
    { id: 1, icon: "🚗", title: "Trip Issues", description: "Problems with a specific trip" },
    { id: 2, icon: "💰", title: "Payment & Earnings", description: "Questions about payments" },
    { id: 3, icon: "📄", title: "Document Verification", description: "Help with document upload" },
    { id: 4, icon: "⚙️", title: "Account Settings", description: "Profile and preferences" },
    { id: 5, icon: "❓", title: "General Help", description: "Other questions" },
  ];

  const handleSubmit = async () => {
    if (!selectedTopic) {
      Alert.alert("Select a topic", "Please choose a support topic");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Enter a message", "Please describe your issue");
      return;
    }

    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      Alert.alert("Request Sent", "Our support team will contact you soon");
      setMessage("");
      setSelectedTopic(null);
    }, 1500);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 18, paddingBottom: 28 }}>
      <Text style={styles.title}>Support Center</Text>
      <Text style={styles.subtitle}>We're here to help you</Text>

      {/* Quick Contact */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Need immediate help?</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactText}>Call Us</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
            <Text style={styles.contactIcon}>💬</Text>
            <Text style={styles.contactText}>Live Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85}>
            <Text style={styles.contactIcon}>✉️</Text>
            <Text style={styles.contactText}>Email</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Topics */}
      <Text style={styles.sectionTitle}>Select a Topic</Text>
      {topics.map((topic) => (
        <TouchableOpacity
          key={topic.id}
          style={[styles.topicCard, selectedTopic === topic.id && styles.topicCardActive]}
          onPress={() => setSelectedTopic(topic.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.topicIcon}>{topic.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
          </View>
          {selectedTopic === topic.id && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Message Input */}
      <Text style={styles.sectionTitle}>Describe Your Issue</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Tell us how we can help..."
        placeholderTextColor="#5a6477"
        multiline
        numberOfLines={6}
        style={styles.textArea}
        textAlignVertical="top"
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, (!selectedTopic || !message.trim() || sending) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!selectedTopic || !message.trim() || sending}
        activeOpacity={0.85}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Request</Text>
        )}
      </TouchableOpacity>

      {/* FAQ */}
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I get approved as a driver?</Text>
        <Text style={styles.faqAnswer}>Upload all required documents and wait for admin review (usually 1-2 business days).</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>When do I get paid?</Text>
        <Text style={styles.faqAnswer}>Payouts are processed every Monday for the previous week's earnings.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I go online to receive requests?</Text>
        <Text style={styles.faqAnswer}>From the Dashboard, tap the 'GO ONLINE' button after you're approved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b1220" },
  
  title: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: "#aeb9cc", fontSize: 14, fontWeight: "600", marginBottom: 16 },

  contactCard: {
    backgroundColor: "#121b2e",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 18,
  },
  contactTitle: { color: "#fff", fontWeight: "900", fontSize: 16, marginBottom: 14 },
  contactRow: { flexDirection: "row", gap: 10 },
  contactBtn: {
    flex: 1,
    backgroundColor: "#0f1627",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#24314d",
  },
  contactIcon: { fontSize: 24, marginBottom: 6 },
  contactText: { color: "#fff", fontWeight: "800", fontSize: 11 },

  sectionTitle: { color: "#fff", fontWeight: "900", fontSize: 18, marginBottom: 12, marginTop: 6 },

  topicCard: {
    backgroundColor: "#121b2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  topicCardActive: {
    backgroundColor: "rgba(47, 102, 255, 0.12)",
    borderColor: "#2f66ff",
  },
  topicIcon: { fontSize: 28 },
  topicTitle: { color: "#fff", fontWeight: "900", fontSize: 15, marginBottom: 4 },
  topicDescription: { color: "#aeb9cc", fontWeight: "600", fontSize: 12 },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#2f66ff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  textArea: {
    backgroundColor: "#121b2e",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#24314d",
    fontWeight: "600",
    minHeight: 120,
    marginBottom: 16,
  },

  submitBtn: {
    backgroundColor: "#2f66ff",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  faqCard: {
    backgroundColor: "#121b2e",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  faqQuestion: { color: "#fff", fontWeight: "900", fontSize: 14, marginBottom: 8 },
  faqAnswer: { color: "#aeb9cc", fontWeight: "600", fontSize: 13, lineHeight: 20 },
});
