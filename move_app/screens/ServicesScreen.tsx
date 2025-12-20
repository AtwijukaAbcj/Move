import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { Service } from '../models/Service';
import { fetchServices } from '../api/services';
import { useRouter } from 'expo-router';


export default function ServicesScreen() {
  const router = useRouter();
  // Improved icons and colors for each service
  const ICON_MAP: Record<string, JSX.Element> = {
    plane: <MaterialCommunityIcons name="airplane-takeoff" size={36} color="#5EC6C6" />,
    briefcase: <MaterialCommunityIcons name="briefcase-variant" size={36} color="#FFA726" />,
    heart: <Entypo name="heart" size={36} color="#E91E63" />,
    road: <MaterialCommunityIcons name="highway" size={36} color="#FFD600" />,
    car: <MaterialCommunityIcons name="car-sports" size={36} color="#FF6F00" />,
  };

  const [search, setSearch] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchServices()
      .then((data) => {
        setServices(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/service-provided', params: { service: JSON.stringify(item) } })}
    >
      <View style={styles.iconCircle}>
        {ICON_MAP[item.icon] || <MaterialCommunityIcons name="car-sports" size={36} color="#FFA726" />}
      </View>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.desc}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={22} color="#aaa" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="Search services..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Info Card/Banner */}
      <View style={styles.infoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="star-circle" size={32} color="#FFA726" style={{ marginRight: 10 }} />
          <Text style={styles.infoTitle}>New! Flight Booking</Text>
        </View>
        <Text style={styles.infoDesc}>Book local and international flights right from the app. Try it now!</Text>
      </View>

      <Text style={styles.header}>BOOK NOW!</Text>
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>Premium rides for every occasion</Text>
      </View>
      <View style={styles.gridWrapper}>
        <FlatList
          data={filteredServices}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23272F',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D313A',
    borderRadius: 16,
    marginTop: 32,
    marginHorizontal: 18,
    marginBottom: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  searchBar: {
    flex: 1,
    height: 48,
    fontSize: 17,
    color: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  infoCard: {
    backgroundColor: '#35736E',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 18,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  infoTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 2,
  },
  infoDesc: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.92,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#FFA726',
    alignSelf: 'center',
    letterSpacing: 1,
    textShadowColor: '#2228',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: 8,
  },
  labelContainer: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 18,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  labelText: {
    color: '#5EC6C6',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  gridWrapper: {
    flex: 1,
    backgroundColor: '#23272F',
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#2D313A',
    borderRadius: 20,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    minWidth: 150,
    maxWidth: '48%',
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: '#35736E',
    transitionDuration: '200ms',
  },
  iconCircle: {
    borderRadius: 36,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 14,
    color: '#B0BEC5',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.96,
    fontWeight: '500',
    textShadowColor: '#35736E88',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
