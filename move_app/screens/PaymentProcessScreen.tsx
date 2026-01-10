import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addNotification } from "../utils/notifications";
import { trackBooking } from "../utils/bookingStatusPoller";

const THEME = {
  primary: "#35736E",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

export default function PaymentProcessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Simulate payment processing
    const timer = setTimeout(() => {
      // Create booking in backend
      processPaymentAndBooking();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const processPaymentAndBooking = async () => {
    try {
      // Get customer ID from AsyncStorage
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) {
        setStatus("failed");
        Alert.alert("Error", "Please login again");
        router.replace("/login");
        return;
      }

      const bookingData: any = {
        customer: parseInt(customerId),
        pickup_location: params.pickup,
        destination: params.destination,
        ride_type: params.rideType,
        fare: parseFloat(params.fare as string),
        distance: parseFloat(params.distance as string),
        duration: parseInt(params.duration as string),
        payment_method: params.paymentMethod,
        status: "pending",
        contact_phone: params.contactPhone as string || "",
      };

      // Add coordinates if available (required for driver assignment)
      // Round to 7 decimal places to avoid floating point precision issues
      if (params.pickupLat && params.pickupLng) {
        bookingData.pickup_latitude = Math.round(parseFloat(params.pickupLat as string) * 10000000) / 10000000;
        bookingData.pickup_longitude = Math.round(parseFloat(params.pickupLng as string) * 10000000) / 10000000;
      }
      if (params.destLat && params.destLng) {
        bookingData.destination_latitude = Math.round(parseFloat(params.destLat as string) * 10000000) / 10000000;
        bookingData.destination_longitude = Math.round(parseFloat(params.destLng as string) * 10000000) / 10000000;
      }

      console.log("Creating booking with data:", bookingData);

      const response = await fetch("http://192.168.1.31:8000/api/corporate/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const responseData = await response.json();
      console.log("Booking response:", responseData);

      if (response.ok) {
        let booking = responseData;
        
        // Automatically assign nearest available driver
        try {
          console.log("Assigning nearest driver for booking:", booking.id);
          const assignResponse = await fetch(
            `http://192.168.1.31:8000/api/corporate/bookings/${booking.id}/assign-driver/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const assignData = await assignResponse.json();
          console.log("Driver assignment response:", assignData);
          
          if (assignResponse.ok && assignData.driver_id) {
            // Update booking with driver info
            booking = { ...booking, ...assignData, status: assignData.status };
            console.log("Driver assigned:", assignData.driver_name);
          } else if (assignResponse.status === 202) {
            // No drivers available, booking is in searching_driver status
            booking.status = 'searching_driver';
            console.log("No drivers available, will keep searching");
          }
        } catch (assignError) {
          console.log("Error assigning driver (will continue):", assignError);
        }
        
        setStatus("success");
        
        // Create notification based on booking status
        if (customerId) {
          console.log('Creating notification for booking:', booking.id, 'Status:', booking.status);
          
          // Define status-specific notification details
          const statusMessages: Record<string, { title: string; message: string }> = {
            pending: { 
              title: 'Ride Booked! 🚗', 
              message: `Your ${params.rideType || 'ride'} booking is being processed. We're finding you a driver.` 
            },
            searching_driver: { 
              title: 'Finding Driver... 🔍', 
              message: `Searching for a driver for your ${params.rideType || 'ride'} from ${params.pickup}.` 
            },
            confirmed: { 
              title: 'Ride Confirmed! ✅', 
              message: `Your ${params.rideType || 'ride'} from ${params.pickup} to ${params.destination} is confirmed.` 
            },
            driver_assigned: { 
              title: 'Driver Assigned! 👋', 
              message: `A driver has been assigned to your ${params.rideType || 'ride'}. They're on their way!` 
            },
            driver_arrived: { 
              title: 'Driver Arrived! 📍', 
              message: `Your driver has arrived at ${params.pickup}.` 
            },
            picked_up: { 
              title: 'Trip Started! 🚀', 
              message: `You've been picked up. Enjoy your ride to ${params.destination}!` 
            },
            in_progress: { 
              title: 'Trip In Progress 🛣️', 
              message: `Your ride to ${params.destination} is in progress.` 
            },
            completed: { 
              title: 'Trip Completed! ✅', 
              message: `You've arrived at ${params.destination}. Thank you for riding with Move!` 
            },
          };
          
          const statusInfo = statusMessages[booking.status] || {
            title: 'Booking Created! 🎉',
            message: `Your ${params.rideType || 'ride'} booking has been created.`
          };
          
          // Create notification for all bookings
          await addNotification(
            customerId,
            statusInfo.title,
            statusInfo.message,
            'ride',
            { bookingId: booking.id, rideType: params.rideType, status: booking.status }
          );
          console.log('Notification created successfully');
          
          // Track pending bookings for status updates
          if (booking.status === 'pending' || booking.status === 'searching_driver') {
            await trackBooking(
              customerId,
              booking.id,
              booking.status,
              'ride',
              {
                rideType: params.rideType,
                pickup: params.pickup,
                destination: params.destination,
                fare: params.fare
              }
            );
            console.log('Booking tracked for future status updates');
          }
        }
        
        // Track order history and last visited
        await trackOrderHistory(params.destination as string);
        await trackLastVisited(params.destination as string);
        
        // Navigate to success screen after a brief delay
        setTimeout(() => {
          router.replace({
            pathname: "/booking-success",
            params: { 
              bookingId: booking.id,
              ...params 
            }
          });
        }, 1500);
      } else {
        console.error("Booking failed:", responseData);
        setStatus("failed");
        Alert.alert("Booking Failed", responseData.error || responseData.detail || "Could not create booking. Please try again.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setStatus("failed");
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    }
  };

  const trackOrderHistory = async (destination: string) => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;
      
      const orderHistoryStr = await AsyncStorage.getItem(`ORDER_HISTORY_${customerId}`);
      let orderHistory: Record<string, number> = {};
      
      if (orderHistoryStr) {
        orderHistory = JSON.parse(orderHistoryStr);
      }
      
      // Increment count for this destination
      if (orderHistory[destination]) {
        orderHistory[destination]++;
      } else {
        orderHistory[destination] = 1;
      }
      
      await AsyncStorage.setItem(`ORDER_HISTORY_${customerId}`, JSON.stringify(orderHistory));
      console.log("Order history updated:", orderHistory);
    } catch (error) {
      console.error("Error tracking order history:", error);
    }
  };

  const trackLastVisited = async (destination: string) => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;
      
      const lastVisitedData = {
        destination,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(`LAST_VISITED_PLACE_${customerId}`, JSON.stringify(lastVisitedData));
      console.log("Last visited place updated:", lastVisitedData);
    } catch (error) {
      console.error("Error tracking last visited:", error);
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === "processing" && (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <ActivityIndicator size="large" color={THEME.aqua} />
              </View>
            </View>

            <Text style={styles.title}>Processing Payment</Text>
            <Text style={styles.subtitle}>Please wait while we process your payment</Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBg}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>${params.fare}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>
                  {params.paymentMethod === "card" ? "Credit Card" : "Mobile Money"}
                </Text>
              </View>

              {params.paymentMethod === "card" && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Card</Text>
                  <Text style={styles.detailValue}>
                    •••• {params.cardNumber?.slice(-4)}
                  </Text>
                </View>
              )}

              {params.paymentMethod === "mobilemoney" && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{params.phoneNumber}</Text>
                </View>
              )}
            </View>

            <Text style={styles.secureText}>
              <Ionicons name="shield-checkmark" size={14} color="#5EC6C6" />
              {" "}Secured by end-to-end encryption
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(46,204,113,0.2)" }]}>
                <Ionicons name="checkmark-circle" size={80} color="#2ecc71" />
              </View>
            </View>

            <Text style={styles.title}>Payment Successful!</Text>
            <Text style={styles.subtitle}>Your ride has been booked</Text>
          </>
        )}

        {status === "failed" && (
          <>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(231,76,60,0.2)" }]}>
                <Ionicons name="close-circle" size={80} color="#e74c3c" />
              </View>
            </View>

            <Text style={styles.title}>Payment Failed</Text>
            <Text style={styles.subtitle}>
              There was an error processing your payment. Please try again.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.dark,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(94,198,198,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#9AA4B2",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  progressContainer: {
    width: "100%",
    marginBottom: 32,
  },
  progressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: THEME.aqua,
    borderRadius: 999,
  },

  detailsCard: {
    width: "100%",
    backgroundColor: "#2D313A",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    color: "#9AA4B2",
    fontSize: 14,
    fontWeight: "700",
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  secureText: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
