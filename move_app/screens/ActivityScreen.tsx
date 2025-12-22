
import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';

// Mock activity data
const mockActivity = [
  {
    id: '1',
    type: 'Ride',
    title: 'Ride to Airport',
    date: '2025-12-20 14:30',
    amount: '$32.50',
    status: 'Completed',
    details: 'From: Home\nTo: Airport Terminal 1',
  },
  {
    id: '2',
    type: 'Order',
    title: 'Food Order',
    date: '2025-12-18 19:10',
    amount: '$12.99',
    status: 'Delivered',
    details: 'Pizza, Coke',
  },
  {
    id: '3',
    type: 'Receipt',
    title: 'Monthly Subscription',
    date: '2025-12-01 09:00',
    amount: '$9.99',
    status: 'Paid',
    details: 'MOVE Premium',
  },
  // Add more mock logs as needed
];

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Your Activity</Text>
        <FlatList
          data={mockActivity}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.type}>{item.type}</Text>
                <Text style={styles.amount}>{item.amount}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.details}>{item.details}</Text>
              <View style={styles.row}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No activity yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#23272F' },
  container: { flex: 1 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#FFA726', marginVertical: 18, textAlign: 'center', letterSpacing: 0.5 },
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
  details: { color: '#B0BEC5', marginTop: 4, fontSize: 14 },
  date: { color: '#B0BEC5', fontSize: 13, marginTop: 10 },
  status: { color: '#67D1C8', fontWeight: 'bold', fontSize: 13, marginTop: 10 },
  empty: { color: '#B0BEC5', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
