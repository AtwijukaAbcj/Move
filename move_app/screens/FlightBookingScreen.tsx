import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FlightBookingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Flight Booking</Text>
      <Text style={styles.info}>Flight booking is coming soon! You will be able to book local and international flights right from the app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#23272F', justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { color: '#FFA726', fontSize: 28, fontWeight: 'bold', marginBottom: 18 },
  info: { color: '#fff', fontSize: 16, textAlign: 'center', opacity: 0.85 },
});
