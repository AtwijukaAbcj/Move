
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { fetchProviderServicesByCategory } from '../api/providerServices';
import { useRoute, useNavigation, NavigationProp } from '@react-navigation/native';

import { ProviderService } from '../models/ProviderService';

export default function ServiceProvidedScreen() {
  // Icon map for service types
  const ICON_MAP: Record<string, React.ReactElement> = {
    plane: <MaterialCommunityIcons name="airplane-takeoff" size={44} color="#5EC6C6" />,
    briefcase: <MaterialCommunityIcons name="briefcase-variant" size={44} color="#FFA726" />,
    heart: <Entypo name="heart" size={44} color="#E91E63" />,
    road: <MaterialCommunityIcons name="highway" size={44} color="#FFD600" />,
    car: <MaterialCommunityIcons name="car-sports" size={44} color="#FF6F00" />,
  };
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<any>>();
  let { service } = route.params as any || {};
  if (typeof service === 'string') {
    try { service = JSON.parse(service); } catch {}
  }
  if (!service || !service.id) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23272F' }}>
        <Text style={{ color: 'red', fontSize: 18 }}>No service category selected.</Text>
      </View>
    );
  }
  // Handle flight booking redirect inside the component body
  // Prevent infinite redirect loop for flight_booking
  const didRedirect = useRef(false);
  useEffect(() => {
    if (
      service?.service_type === 'flight_booking' &&
      !didRedirect.current &&
      navigation.getState &&
      navigation.getState().routes &&
      navigation.getState().routes[navigation.getState().index]?.name !== 'flight-booking'
    ) {
      didRedirect.current = true;
      if (typeof navigation.replace === 'function') {
        navigation.replace('flight-booking');
      }
    }
  }, [service, navigation]);
  if (service?.service_type === 'flight_booking') return null;
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProviderServicesByCategory(service.id)
      .then(setProviderServices)
      .catch(() => setError('Failed to load services'))
      .finally(() => setLoading(false));
  }, [service.id]);

  return (
    <View style={styles.container}>
      {/* Custom content for each service type (colored card) */}
      {service.service_type === 'flight_booking' && (
        <View style={[styles.customInfoBox, { backgroundColor: '#35736E' }]}> 
          <MaterialCommunityIcons name="airplane" size={32} color="#fff" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.customInfoTitle}>Flight Booking</Text>
            <Text style={styles.customInfoDesc}>Book local and international flights. Coming soon! Enjoy seamless travel planning and exclusive deals.</Text>
          </View>
        </View>
      )}
      {service.service_type === 'wedding_car' && (
        <View style={[styles.customInfoBox, { backgroundColor: '#E91E63' }]}> 
          <Entypo name="heart" size={32} color="#fff" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.customInfoTitle}>Wedding Cars</Text>
            <Text style={styles.customInfoDesc}>Arrive in style on your special day with our elegant wedding cars. Choose from a range of luxury vehicles and make your wedding unforgettable.</Text>
          </View>
        </View>
      )}
      {service.service_type === 'corporate_hire' && (
        <View style={[styles.customInfoBox, { backgroundColor: '#FFA726' }]}> 
          <MaterialCommunityIcons name="briefcase-variant" size={32} color="#fff" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.customInfoTitle}>Corporate Hires</Text>
            <Text style={styles.customInfoDesc}>Professional transport for executives and business events. Reliable, punctual, and comfortable rides for your team.</Text>
          </View>
        </View>
      )}
      {service.service_type === 'intercity_trip' && (
        <View style={[styles.customInfoBox, { backgroundColor: '#FFD600' }]}> 
          <MaterialCommunityIcons name="highway" size={32} color="#23272F" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.customInfoTitle, { color: '#23272F' }]}>Inter-city Trips</Text>
            <Text style={[styles.customInfoDesc, { color: '#23272F' }]}>Comfortable rides between cities. Travel safely and affordably with our trusted drivers.</Text>
          </View>
        </View>
      )}
      {service.service_type === 'rental' && (
        <View style={[styles.customInfoBox, { backgroundColor: '#FF6F00' }]}> 
          <MaterialCommunityIcons name="car-sports" size={32} color="#fff" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.customInfoTitle}>Car Rentals</Text>
            <Text style={styles.customInfoDesc}>Flexible car rentals for any duration. Choose your ride and enjoy the freedom to go anywhere, anytime.</Text>
          </View>
        </View>
      )}
      {/* Provider Services List */}
      {loading && <ActivityIndicator size="large" color="#FFA726" style={{ margin: 20 }} />}
      {error && <Text style={{ color: 'red', textAlign: 'center', margin: 16 }}>{error}</Text>}
      <FlatList
        data={providerServices}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('service-detail', { providerServiceId: item.id })}
            activeOpacity={0.85}
          >
            {item.image1 ? (
              <Image
                source={{ uri: item.image1 }}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            ) : item.photos && item.photos.length > 0 ? (
              <Image
                source={{ uri: item.photos[0] }}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image-off-outline" size={48} color="#B0BEC5" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.short_description}</Text>
              <Text style={styles.price}>{item.base_price} {item.currency}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#23272F', padding: 16 },
  serviceHeaderBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, backgroundColor: '#2D313A', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
  iconCircle: { borderRadius: 36, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: '#2D313A', shadowColor: '#FFA726', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.13, shadowRadius: 8 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#FFA726', marginBottom: 2 },
  serviceDesc: { color: '#B0BEC5', fontSize: 15, marginBottom: 8, fontStyle: 'italic' },
  customInfoBox: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, marginBottom: 16, marginTop: 2 },
  customInfoTitle: { color: '#fff', fontWeight: 'bold', fontSize: 17, marginBottom: 2 },
  customInfoDesc: { color: '#fff', fontSize: 14, opacity: 0.92 },
  card: { backgroundColor: '#2D313A', borderRadius: 14, padding: 12, marginVertical: 8, flexDirection: 'row', alignItems: 'center' },
  serviceImage: { width: 80, height: 80, borderRadius: 10, marginRight: 14, backgroundColor: '#23272F' },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 10, marginRight: 14, backgroundColor: '#23272F', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  desc: { color: '#B0BEC5', fontSize: 14, marginTop: 4 },
  backBtn: { marginBottom: 10 },
  backText: { color: '#5EC6C6', fontWeight: 'bold' },
  supplierHeader: { color: '#FFA726', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  carCard: { backgroundColor: '#2D313A', borderRadius: 14, padding: 14, marginVertical: 8, alignItems: 'center' },
  carImage: { width: 120, height: 80, borderRadius: 10, marginBottom: 8 },
  carName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  carDesc: { color: '#B0BEC5', fontSize: 13, marginTop: 2 },
  carPrice: { color: '#FFA726', fontWeight: 'bold', marginTop: 4 },
});
