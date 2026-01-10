import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);

  const SettingItem = ({ icon, iconBg, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, iconBg, title, subtitle, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3d4654', true: '#5EC6C680' }}
        thumbColor={value ? '#5EC6C6' : '#9ca3af'}
        ios_backgroundColor="#3d4654"
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your app experience</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.sectionCard}
          >
            <SettingItem
              icon="person-outline"
              iconBg="#5EC6C6"
              title="Profile"
              subtitle="Edit your personal information"
              onPress={() => navigation?.navigate?.('Profile')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="card-outline"
              iconBg="#60a5fa"
              title="Payment Methods"
              subtitle="Manage your bank accounts"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="document-text-outline"
              iconBg="#a78bfa"
              title="Documents"
              subtitle="View uploaded documents"
              onPress={() => navigation?.navigate?.('DocumentUpload')}
            />
          </LinearGradient>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.sectionCard}
          >
            <ToggleItem
              icon="notifications-outline"
              iconBg="#fbbf24"
              title="Push Notifications"
              subtitle="Receive ride alerts"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <View style={styles.divider} />
            <ToggleItem
              icon="volume-high-outline"
              iconBg="#10b981"
              title="Sound"
              subtitle="Play notification sounds"
              value={soundEnabled}
              onValueChange={setSoundEnabled}
            />
            <View style={styles.divider} />
            <ToggleItem
              icon="phone-portrait-outline"
              iconBg="#ef4444"
              title="Vibration"
              subtitle="Vibrate for new requests"
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
            />
          </LinearGradient>
        </View>

        {/* Driver Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Preferences</Text>
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.sectionCard}
          >
            <ToggleItem
              icon="flash-outline"
              iconBg="#5EC6C6"
              title="Auto-Accept Rides"
              subtitle="Automatically accept high-rated riders"
              value={autoAccept}
              onValueChange={setAutoAccept}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="car-outline"
              iconBg="#60a5fa"
              title="Vehicle Details"
              subtitle="Update your vehicle information"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="location-outline"
              iconBg="#a78bfa"
              title="Preferred Areas"
              subtitle="Set your preferred pickup zones"
              onPress={() => {}}
            />
          </LinearGradient>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <LinearGradient
            colors={['#1a2744', '#0f1a2e']}
            style={styles.sectionCard}
          >
            <SettingItem
              icon="help-circle-outline"
              iconBg="#5EC6C6"
              title="Help Center"
              subtitle="Get help and FAQs"
              onPress={() => navigation?.navigate?.('Support')}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="chatbubble-outline"
              iconBg="#fbbf24"
              title="Contact Support"
              subtitle="Chat with our team"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="information-circle-outline"
              iconBg="#60a5fa"
              title="About"
              subtitle="App version 1.0.0"
              onPress={() => {}}
            />
          </LinearGradient>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Log Out', 
                  style: 'destructive',
                  onPress: () => navigation?.replace?.('Login')
                },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0a0f1a" },
  
  header: {
    marginBottom: 24,
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

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 20,
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

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  settingSubtitle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 70,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "800",
  },
});
