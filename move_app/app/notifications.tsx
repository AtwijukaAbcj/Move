import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-context';
import { useRouter, Stack } from 'expo-router';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'ride' | 'service' | 'general';
  timestamp: string;
  read: boolean;
  data?: any;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    loadNotifications();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const loadNotifications = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) {
        setLoading(false);
        return;
      }

      const notificationsKey = `notifications_${customerId}`;
      const storedNotifications = await AsyncStorage.getItem(notificationsKey);
      
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Sort by timestamp, newest first
        parsed.sort((a: Notification, b: Notification) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(parsed);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;

      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );

      setNotifications(updatedNotifications);

      const notificationsKey = `notifications_${customerId}`;
      await AsyncStorage.setItem(notificationsKey, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const clearAll = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;

      const notificationsKey = `notifications_${customerId}`;
      await AsyncStorage.removeItem(notificationsKey);
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'booking': return 'calendar-outline';
      case 'ride': return 'car-outline';
      case 'service': return 'briefcase-outline';
      default: return 'notifications-outline';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking': return '#5EC6C6';
      case 'ride': return '#FFA726';
      case 'service': return '#67D1C8';
      default: return '#B0BEC5';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
      <View style={styles.container}>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5EC6C6" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#5EC6C6']}
                tintColor="#5EC6C6"
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={getIconName(item.type) as any} 
                    size={24} 
                    color={getIconColor(item.type)} 
                  />
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.header}>
                    <Text style={styles.title}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#3D4350" />
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptyText}>
                  You'll see booking confirmations and updates here
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#23272F' },
  container: { flex: 1 },
  clearButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 16,
    marginTop: 8,
  },
  clearButtonText: {
    color: '#FFA726',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#B0BEC5',
    marginTop: 12,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#2D313A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#323844',
    borderLeftWidth: 4,
    borderLeftColor: '#5EC6C6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#23272F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5EC6C6',
    marginLeft: 8,
  },
  message: {
    color: '#B0BEC5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  timestamp: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#B0BEC5',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
