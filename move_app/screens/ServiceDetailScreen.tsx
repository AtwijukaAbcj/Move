
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Modal, TouchableOpacity, Pressable, TextInput, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams } from 'expo-router';
import { ProviderService } from '../models/ProviderService';

import { fetchProviderServiceById } from '../api/providerServiceDetail';
import { createBooking } from '../api';

const BASE_URL = 'http://192.168.1.31:8000'; // Change to your backend IP if needed

export default function ServiceDetailScreen() {
  const { providerServiceId } = useLocalSearchParams();
  const [service, setService] = useState<ProviderService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Booking modal state (must be inside the component)
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string|null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (!providerServiceId) {
      setError('No service ID provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchProviderServiceById(Number(providerServiceId))
      .then(data => {
        setService(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch service details.');
        setLoading(false);
      });
  }, [providerServiceId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFA726" style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Service details not found.</Text>
      </View>
    );
  }

  // Debug: log the service object
  // console.log('Service detail:', service);

  // Gather all images (main + others)
  const images = [service.image1, service.image2, service.image3, service.image4, service.image5]
    .filter(Boolean)
    .map(img => (img as string).startsWith('http') ? img : `${BASE_URL}${img}`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Main Image */}
      {images[0] && (
        <TouchableOpacity onPress={() => { setSelectedImage(images[0]); setModalVisible(true); }}>
          <Image source={{ uri: images[0] }} style={styles.mainImage} resizeMode="cover" />
        </TouchableOpacity>
      )}
      {/* Thumbnails */}
      <View style={styles.thumbnailRow}>
        {images.slice(1).map((img, idx) => (
          <TouchableOpacity key={idx} onPress={() => { setSelectedImage(img); setModalVisible(true); }}>
            <Image source={{ uri: img }} style={styles.thumbnail} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
      {/* Modal Preview */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Card-like details */}
      <View style={styles.card}>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.desc}>{service.full_description || service.short_description}</Text>
        <Text style={styles.section}>Price: <Text style={styles.value}>{service.base_price} {service.currency}</Text></Text>
        <Text style={styles.section}>Pricing Type: <Text style={styles.value}>{service.pricing_type}</Text></Text>
        <Text style={styles.section}>Booking Mode: <Text style={styles.value}>{service.booking_mode}</Text></Text>
        <Text style={styles.section}>Max Passengers: <Text style={styles.value}>{service.max_passengers}</Text></Text>
        <Text style={styles.section}>Max Luggage: <Text style={styles.value}>{service.max_luggage}</Text></Text>
        {/* Add more fields as needed */}
        <TouchableOpacity style={styles.bookBtn} onPress={() => setBookingModalVisible(true)}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
      {/* Booking Modal */}
      <Modal visible={bookingModalVisible} transparent animationType="slide">
        <View style={styles.bookingModalOverlay}>
          <View style={styles.bookingModalCard}>
            <Text style={styles.bookingModalHeader}>Book Service</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor="#aaa"
              value={bookingName}
              onChangeText={setBookingName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#aaa"
              value={bookingPhone}
              onChangeText={setBookingPhone}
              keyboardType="phone-pad"
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputPicker}>
              <Text style={styles.inputPickerText}>Date: {bookingDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.inputPicker}>
              <Text style={styles.inputPickerText}>Time: {bookingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={bookingDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setBookingDate(date);
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={bookingTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, time) => {
                  setShowTimePicker(false);
                  if (time) setBookingTime(time);
                }}
              />
            )}
            {bookingError && <Text style={styles.bookingError}>{bookingError}</Text>}
            {bookingSuccess && <Text style={styles.bookingSuccess}>Booking successful!</Text>}
            <View style={styles.bookingModalBtnRow}>
              <TouchableOpacity
                style={[styles.bookBtn, styles.bookingSubmitBtn, bookingLoading && { opacity: 0.6 }]}
                disabled={bookingLoading}
                onPress={async () => {
                  setBookingLoading(true);
                  setBookingError(null);
                  setBookingSuccess(false);
                  try {
                    await createBooking({
                      provider_service: service.id,
                      name: bookingName,
                      phone: bookingPhone,
                      date: bookingDate.toISOString().split('T')[0],
                      time: bookingTime.toTimeString().slice(0,5),
                    });
                    setBookingSuccess(true);
                  } catch (e) {
                    setBookingError('Booking failed. Please try again.');
                  } finally {
                    setBookingLoading(false);
                  }
                }}
              >
                <Text style={styles.bookBtnText}>{bookingLoading ? 'Booking...' : 'Submit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bookBtn, styles.bookingCancelBtn]} onPress={() => setBookingModalVisible(false)}>
                <Text style={styles.bookBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#23272F' },
  mainImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: '#23272F',
  },
  thumbnailRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 8,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#23272F',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '70%',
    borderRadius: 16,
    backgroundColor: '#23272F',
    zIndex: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#23272F',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  bookBtn: {
    backgroundColor: '#FFA726',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 18,
    alignItems: 'center',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  bookingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingModalCard: {
    width: '90%',
    backgroundColor: '#23272F',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'stretch',
  },
  bookingModalHeader: {
    color: '#FFA726',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  bookingModalBtnRow: {
    flexDirection: 'row',
    marginTop: 22,
    justifyContent: 'space-between',
    gap: 12,
  },
  bookingSubmitBtn: {
    backgroundColor: '#5EC6C6',
    flex: 1,
    marginRight: 6,
  },
  bookingCancelBtn: {
    backgroundColor: '#E91E63',
    flex: 1,
    marginLeft: 6,
  },
  bookingError: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 15,
  },
  bookingSuccess: {
    color: '#5EC6C6',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#2D313A',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  inputPicker: {
    backgroundColor: '#2D313A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  inputPickerText: {
    color: '#fff',
    fontSize: 16,
  },
  title: { color: '#FFA726', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  desc: { color: '#B0BEC5', fontSize: 16, marginBottom: 16 },
  section: { color: '#fff', fontSize: 16, marginTop: 8 },
  value: { color: '#5EC6C6', fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginTop: 40 },
});
