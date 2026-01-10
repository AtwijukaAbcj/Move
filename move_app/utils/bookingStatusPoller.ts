import AsyncStorage from '@react-native-async-storage/async-storage';
import { addNotification } from './notifications';

interface BookingStatus {
  bookingId: number;
  status: string;
  type: 'ride' | 'service';
  lastChecked: string;
}

const POLLING_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY = 'booking_status_tracker';

let pollingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Track a booking for status changes
 */
export const trackBooking = async (
  customerId: string,
  bookingId: number,
  initialStatus: string,
  type: 'ride' | 'service',
  bookingDetails?: any
) => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const tracked: BookingStatus[] = stored ? JSON.parse(stored) : [];
    
    // Add new booking to track
    tracked.push({
      bookingId,
      status: initialStatus,
      type,
      lastChecked: new Date().toISOString(),
    });
    
    // Store booking details for later notification
    await AsyncStorage.setItem(`booking_${bookingId}_details`, JSON.stringify(bookingDetails));
    await AsyncStorage.setItem(`booking_${bookingId}_customerId`, customerId);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tracked));
    
    console.log('Now tracking booking:', bookingId, 'Initial status:', initialStatus);
  } catch (error) {
    console.error('Error tracking booking:', error);
  }
};

/**
 * Check all tracked bookings for status changes
 */
export const checkBookingStatusChanges = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const tracked: BookingStatus[] = JSON.parse(stored);
    const updated: BookingStatus[] = [];
    
    for (const booking of tracked) {
      try {
        // Fetch current status from API
        const endpoint = booking.type === 'ride' 
          ? `http://192.168.1.31:8000/api/corporate/bookings/${booking.bookingId}/`
          : `http://192.168.1.31:8000/api/corporate/service-bookings/${booking.bookingId}/`;
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          updated.push(booking); // Keep tracking
          continue;
        }
        
        const data = await response.json();
        const newStatus = data.status;
        
        // Check if status changed to confirmed
        const oldStatus = booking.status;
        const confirmedStatuses = ['confirmed', 'driver_assigned', 'driver_arrived', 'in_progress'];
        
        if (confirmedStatuses.includes(newStatus) && !confirmedStatuses.includes(oldStatus)) {
          // Status changed to confirmed! Create notification
          console.log(`Booking ${booking.bookingId} status changed: ${oldStatus} -> ${newStatus}`);
          
          const customerId = await AsyncStorage.getItem(`booking_${booking.bookingId}_customerId`);
          const detailsStr = await AsyncStorage.getItem(`booking_${booking.bookingId}_details`);
          
          if (customerId) {
            const details = detailsStr ? JSON.parse(detailsStr) : {};
            
            if (booking.type === 'ride') {
              await addNotification(
                customerId,
                'Ride Confirmed! 🚗',
                `Your ${details.rideType || 'ride'} has been confirmed and a driver has been assigned!`,
                'ride',
                { bookingId: booking.bookingId, status: newStatus, ...details }
              );
            } else {
              await addNotification(
                customerId,
                'Service Booking Confirmed! 🎉',
                `Your booking for "${details.serviceTitle || 'service'}" has been confirmed!`,
                'service',
                { bookingId: booking.bookingId, status: newStatus, ...details }
              );
            }
          }
          
          // Don't track anymore once confirmed
          // Clean up stored details
          await AsyncStorage.removeItem(`booking_${booking.bookingId}_details`);
          await AsyncStorage.removeItem(`booking_${booking.bookingId}_customerId`);
        } else if (newStatus === 'completed' || newStatus === 'cancelled') {
          // Stop tracking completed/cancelled bookings
          await AsyncStorage.removeItem(`booking_${booking.bookingId}_details`);
          await AsyncStorage.removeItem(`booking_${booking.bookingId}_customerId`);
        } else {
          // Update status and keep tracking
          updated.push({
            ...booking,
            status: newStatus,
            lastChecked: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error checking booking ${booking.bookingId}:`, error);
        updated.push(booking); // Keep tracking even on error
      }
    }
    
    // Save updated tracking list
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error checking booking status changes:', error);
  }
};

/**
 * Start polling for booking status changes
 */
export const startBookingStatusPolling = () => {
  if (pollingInterval) return; // Already running
  
  console.log('Starting booking status polling...');
  
  // Check immediately
  checkBookingStatusChanges();
  
  // Then check every 30 seconds
  pollingInterval = setInterval(() => {
    checkBookingStatusChanges();
  }, POLLING_INTERVAL);
};

/**
 * Stop polling for booking status changes
 */
export const stopBookingStatusPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('Stopped booking status polling');
  }
};
