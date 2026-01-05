import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

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
      const bookingData = {
        pickup_location: params.pickup,
        destination: params.destination,
        ride_type: params.rideType,
        fare: parseFloat(params.fare as string),
        distance: parseFloat(params.distance as string),
        duration: parseInt(params.duration as string),
        payment_method: params.paymentMethod,
        status: "pending",
      };

      const response = await fetch("http://192.168.1.31:8000/api/bookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const booking = await response.json();
        setStatus("success");
        
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
        setStatus("failed");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      setStatus("failed");
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
