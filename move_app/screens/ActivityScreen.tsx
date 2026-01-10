
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../app/auth-context';
import { useRouter } from 'expo-router';

const BASE_URL = "http://192.168.1.31:8000";

export default function ActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'rides' | 'services'>('rides');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    loadBookings();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const loadBookings = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) {
        setLoading(false);
        return;
      }

      // Fetch ride bookings
      const ridesResponse = await fetch(`${BASE_URL}/api/corporate/customer/${customerId}/bookings/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json();
        setBookings(ridesData);
      }

      // Fetch service bookings
      const servicesResponse = await fetch(`${BASE_URL}/api/corporate/customer/${customerId}/service-bookings/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServiceBookings(servicesData);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#67D1C8';
      case 'in_progress': return '#5EC6C6';
      case 'cancelled': return '#E57373';
      default: return '#FFA726';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  const displayData = activeTab === 'rides' ? bookings : serviceBookings;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Your Activity</Text>
        
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'rides' && styles.activeTab]}
            onPress={() => setActiveTab('rides')}
          >
            <Text style={[styles.tabText, activeTab === 'rides' && styles.activeTabText]}>
              Rides ({bookings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
              Services ({serviceBookings.length})
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5EC6C6" />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </View>
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#5EC6C6']}
                tintColor="#5EC6C6"
              />
            }
            renderItem={({ item }) => (
              activeTab === 'rides' ? (
                <View style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.type}>Ride</Text>
                    <Text style={styles.amount}>${item.fare || '0.00'}</Text>
                  </View>
                  <Text style={styles.title}>{item.ride_type || 'MOVE Standard'}</Text>
                  <Text style={styles.details}>
                    From: {item.pickup_location || 'N/A'}{'\n'}
                    To: {item.destination || 'N/A'}
                  </Text>
                  {item.driver_name && (
                    <Text style={styles.driver}>Driver: {item.driver_name}</Text>
                  )}
                  <View style={styles.row}>
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                    <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.card}>
                  <View style={styles.row}>
                    <Text style={styles.type}>Service</Text>
                    <Text style={styles.amount}>${item.total_price || '0.00'}</Text>
                  </View>
                  <Text style={styles.title}>{item.service_title || 'Service Booking'}</Text>
                  <Text style={styles.details}>
                    Date: {new Date(item.date).toLocaleDateString()}{'\n'}
                    Time: {item.time}
                  </Text>
                  {item.number_of_cars && item.total_passengers && (
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleText}>
                        {item.number_of_cars} car{item.number_of_cars > 1 ? 's' : ''} • 
                        {item.total_passengers} passenger{item.total_passengers > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  {item.phone && (
                    <Text style={styles.driver}>Contact: {item.phone}</Text>
                  )}
                  <View style={styles.row}>
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                    <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              )
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {activeTab === 'rides' 
                  ? 'No rides yet. Book your first ride!' 
                  : 'No service bookings yet. Book a service!'}
              </Text>
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
  header: { fontSize: 26, fontWeight: 'bold', color: '#FFA726', marginVertical: 18, textAlign: 'center', letterSpacing: 0.5 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2D313A',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#5EC6C6',
  },
  tabText: {
    color: '#B0BEC5',
    fontWeight: '700',
    fontSize: 14,
  },
  activeTabText: {
    color: '#0f1a19',
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
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { color: '#5EC6C6', fontWeight: 'bold', fontSize: 15 },
  amount: { color: '#FFA726', fontWeight: 'bold', fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  details: { color: '#B0BEC5', marginTop: 4, fontSize: 14, lineHeight: 20 },
  vehicleInfo: {
    backgroundColor: 'rgba(94, 198, 198, 0.09)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  vehicleText: {
    color: '#5EC6C6',
    fontSize: 13,
    fontWeight: '700',
  },
  driver: { color: '#67D1C8', marginTop: 6, fontSize: 14, fontWeight: '600' },
  date: { color: '#B0BEC5', fontSize: 13, marginTop: 10 },
  status: { fontWeight: 'bold', fontSize: 13, marginTop: 10 },
  empty: { color: '#B0BEC5', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
