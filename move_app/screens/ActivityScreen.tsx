import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchProviderServicesByCategory } from '../api/providerServices';
import { ProviderService } from '../models/ProviderService';

export default function ActivityScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    fetchProviderServicesByCategory(Number(categoryId))
      .then(setServices)
      .catch(() => setError('Failed to load services'))
      .finally(() => setLoading(false));
  }, [categoryId]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{categoryName || 'Services'}</Text>
      {loading && <ActivityIndicator size="large" color="#35736E" />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={services}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.short_description}</Text>
            <Text style={styles.price}>{item.base_price} {item.currency}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#23272F' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#FFA726', margin: 16, textAlign: 'center' },
  card: { backgroundColor: '#2D313A', borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  desc: { color: '#B0BEC5', marginTop: 4 },
  price: { color: '#5EC6C6', marginTop: 8, fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', margin: 16 },
});
