import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function SupportScreen() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const topics = [
    { id: 1, icon: "car-outline", title: "Trip Issues", description: "Problems with a specific trip", color: "#5EC6C6" },
    { id: 2, icon: "cash-outline", title: "Payment & Earnings", description: "Questions about payments", color: "#10b981" },
    { id: 3, icon: "document-text-outline", title: "Document Verification", description: "Help with document upload", color: "#60a5fa" },
    { id: 4, icon: "settings-outline", title: "Account Settings", description: "Profile and preferences", color: "#a78bfa" },
    { id: 5, icon: "help-circle-outline", title: "General Help", description: "Other questions", color: "#fbbf24" },
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
    setTimeout(() => {
      setSending(false);
      Alert.alert("Request Sent", "Our support team will contact you soon");
      setMessage("");
      setSelectedTopic(null);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Support Center</Text>
          <Text style={styles.subtitle}>We're here to help you</Text>
        </View>

        {/* Quick Contact */}
        <LinearGradient
          colors={['#1e3a5f', '#152238']}
          style={styles.contactCard}
        >
          <View style={styles.contactHeader}>
            <View style={styles.contactIcon}>
              <Ionicons name="headset" size={24} color="#5EC6C6" />
            </View>
            <View>
              <Text style={styles.contactTitle}>Need immediate help?</Text>
              <Text style={styles.contactSubtitle}>Our team is available 24/7</Text>
            </View>
          </View>
          
          <View style={styles.contactRow}>
            <TouchableOpacity 
              style={styles.contactBtn} 
              activeOpacity={0.85}
              onPress={() => Linking.openURL('tel:+1234567890')}
            >
              <LinearGradient
                colors={['#5EC6C6', '#4BA8A8']}
                style={styles.contactBtnGradient}
              >
                <Ionicons name="call" size={20} color="#0a0f1a" />
                <Text style={styles.contactBtnText}>Call Us</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactBtn} 
              activeOpacity={0.85}
              onPress={() => Linking.openURL('mailto:support@move.com')}
            >
              <View style={styles.contactBtnOutline}>
                <Ionicons name="mail" size={20} color="#5EC6C6" />
                <Text style={styles.contactBtnTextOutline}>Email</Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Topics Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="chatbubbles" size={16} color="#fbbf24" />
          </View>
          <Text style={styles.sectionTitle}>How can we help?</Text>
        </View>

        {/* Topic Buttons */}
        {topics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            activeOpacity={0.85}
            onPress={() => setSelectedTopic(topic.id)}
          >
            <LinearGradient
              colors={selectedTopic === topic.id ? ['#1e3a5f', '#152238'] : ['#1a2744', '#0f1a2e']}
              style={[
                styles.topicCard,
                selectedTopic === topic.id && styles.topicCardSelected,
              ]}
            >
              <View style={[styles.topicIcon, { backgroundColor: `${topic.color}15` }]}>
                <Ionicons name={topic.icon} size={22} color={topic.color} />
              </View>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDesc}>{topic.description}</Text>
              </View>
              <View style={[
                styles.checkCircle,
                selectedTopic === topic.id && styles.checkCircleSelected
              ]}>
                {selectedTopic === topic.id && (
                  <Ionicons name="checkmark" size={14} color="#0a0f1a" />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Message Input */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
            <Ionicons name="create" size={16} color="#60a5fa" />
          </View>
          <Text style={styles.sectionTitle}>Describe your issue</Text>
        </View>

        <LinearGradient
          colors={['#1a2744', '#0f1a2e']}
          style={styles.messageCard}
        >
          <TextInput
            style={styles.textArea}
            placeholder="Tell us more about your issue..."
            placeholderTextColor="#6b7280"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </LinearGradient>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, sending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={sending}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={sending ? ['#4a5568', '#2d3748'] : ['#5EC6C6', '#4BA8A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtnGradient}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#0a0f1a" />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* FAQ Section */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
            <Ionicons name="help" size={16} color="#a78bfa" />
          </View>
          <Text style={styles.sectionTitle}>Frequently Asked</Text>
        </View>

        <LinearGradient
          colors={['#1a2744', '#0f1a2e']}
          style={styles.faqCard}
        >
          <TouchableOpacity style={styles.faqItem} activeOpacity={0.8}>
            <Text style={styles.faqQuestion}>How do I update my documents?</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.faqDivider} />
          <TouchableOpacity style={styles.faqItem} activeOpacity={0.8}>
            <Text style={styles.faqQuestion}>When do I get paid?</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.faqDivider} />
          <TouchableOpacity style={styles.faqItem} activeOpacity={0.8}>
            <Text style={styles.faqQuestion}>How to change my vehicle?</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0f1a" },
  
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

  contactCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#5EC6C6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(94, 198, 198, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactTitle: { 
    color: "#fff", 
    fontWeight: "900", 
    fontSize: 16 
  },
  contactSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  contactRow: { 
    flexDirection: "row", 
    gap: 12 
  },
  contactBtn: { 
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  contactBtnText: { 
    color: "#0a0f1a", 
    fontWeight: "900",
    fontSize: 14,
  },
  contactBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 198, 198, 0.4)',
    borderRadius: 12,
    backgroundColor: 'rgba(94, 198, 198, 0.1)',
  },
  contactBtnTextOutline: {
    color: "#5EC6C6",
    fontWeight: "900",
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
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

  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  topicCardSelected: {
    borderColor: '#5EC6C6',
    borderWidth: 2,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 15 
  },
  topicDesc: { 
    color: "#6b7280", 
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#5EC6C6',
    borderColor: '#5EC6C6',
  },

  messageCard: {
    borderRadius: 16,
    marginBottom: 20,
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
  textArea: {
    padding: 16,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    minHeight: 120,
  },

  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#5EC6C6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitBtnText: {
    color: "#0a0f1a",
    fontWeight: "900",
    fontSize: 16,
  },

  faqCard: {
    borderRadius: 16,
    overflow: 'hidden',
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
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  faqDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
  },
});
