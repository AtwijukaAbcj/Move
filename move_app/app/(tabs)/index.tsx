

import React, { useEffect, useState } from "react";
import { Image, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import Swiper from 'react-native-swiper';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withSpring } from 'react-native-reanimated';

import { useRouter } from "expo-router";

export default function HomeScreen() {
    // Example user data (replace with real user data if available)
    const userName = "Alex";
    const avatarUrl = null; // Set to a URL string for a real avatar, or null for initials
    const userInitials = userName ? userName[0] : "U";
    // Motivational quotes
    const quotes = [
      "Every journey begins with a single step.",
      "Go where you feel most alive.",
      "The world is yours to explore.",
      "Travel. Explore. Discover."
    ];
    const [quote, setQuote] = useState(quotes[0]);
    useEffect(() => {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);
  const router = useRouter();
  // No animated logo, replaced with image.png in rectangle card

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Top bar: Avatar, Greeting, Menu */}
        <View style={styles.topBar}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarInitials}><Text style={styles.avatarInitialsText}>{userInitials}</Text></View>
            )}
          </View>
          <View style={styles.greetingWrapper}>
            <Text style={styles.greetingText}>Good day, {userName}!</Text>
          </View>
          <View style={styles.menuRow}>
            <Text style={styles.menuDots}>•••</Text>
          </View>
        </View>


        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={22} color="#aaa" style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchBar}
            placeholder="Where are you going?"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionBtn}>
            <MaterialIcons name="event-available" size={20} color="#fff" />
            <Text style={styles.quickActionText}>Schedule ahead</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <MaterialIcons name="person-outline" size={20} color="#fff" />
            <Text style={styles.quickActionText}>Change rider</Text>
          </TouchableOpacity>
        </View>

        {/* Favorite Locations */}
        <View style={styles.favLocationRow}>
          <MaterialIcons name="location-pin" size={22} color="#E040FB" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.favLocationTitle}>Massachusetts Registery of Motor Vehicles</Text>
            <Text style={styles.favLocationSubtitle}>50 Southwest Cutoff, Worcester</Text>
          </View>
        </View>
        <View style={styles.favLocationRow}>
          <FontAwesome5 name="briefcase" size={20} color="#E040FB" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.favLocationTitle}>Work</Text>
            <Text style={styles.favLocationSubtitle}>Add shortcut</Text>
          </View>
        </View>
            {/* Swiper for adverts (dynamic from API) */}
            <View style={styles.rectangleCard}>
              <AdvertSwiper />
            </View>
            // Fetch and display adverts from backend API
            function AdvertSwiper() {
              const [adverts, setAdverts] = React.useState([]);
              const [loading, setLoading] = React.useState(true);
              const [error, setError] = React.useState(null);

              React.useEffect(() => {
                const fetchAdverts = async () => {
                  try {
                    const response = await fetch("http://127.0.0.1:8000/api/corporate/adverts/");
                    if (!response.ok) throw new Error("Failed to fetch adverts");
                    const data = await response.json();
                    setAdverts(data);
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchAdverts();
              }, []);

              if (loading) {
                return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Loading adverts...</Text></View>;
              }
              if (error) {
                return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Error: {error}</Text></View>;
              }
              if (!adverts.length) {
                return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>No adverts available</Text></View>;
              }

              return (
                <Swiper
                  style={{ height: 220, borderRadius: 18 }}
                  showsPagination={true}
                  autoplay={true}
                  autoplayTimeout={4}
                  dotColor="#ccc"
                  activeDotColor="#FFA726"
                >
                  {adverts.map((ad) => (
                    <View style={{ flex: 1 }} key={ad.id}>
                      <Image
                        source={{ uri: ad.image }}
                        style={styles.rectangleImage}
                        resizeMode="cover"
                      />
                      <View style={styles.captionContainer}>
                        <Text style={styles.rectangleCaption}>{ad.caption}</Text>
                      </View>
                    </View>
                  ))}
                </Swiper>
              );
            }
            {/* Adventure awaits label */}
            <View style={styles.leftLabelContainer}>
              <Text style={styles.leftLabelText}>Adventure awaits!</Text>
            </View>
        
        {/* Motivational Quote */}
        <Text style={styles.quoteText}>{quote}</Text>

        {/* Main buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.mainButton} onPress={() => router.push("/rides") }>
            <Image source={{ uri: "https://img.icons8.com/ios-filled/100/000000/car--v1.png" }} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>GET A RIDE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainButton} onPress={() => router.push("/services") }>
            <Image source={{ uri: "https://img.icons8.com/ios-filled/100/000000/car-rental.png" }} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>INTERCITY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    leftLabelContainer: {
      alignSelf: 'flex-start',
      marginLeft: 24,
      marginBottom: 8,
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingVertical: 4,
      paddingHorizontal: 14,
      shadowColor: '#222',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 4,
    },
    leftLabelText: {
      color: '#35736E',
      fontWeight: 'bold',
      fontSize: 15,
      letterSpacing: 0.5,
    },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#35736E',
  },
  container: {
    flex: 1,
    backgroundColor: '#35736E',
    alignItems: 'center',
    paddingTop: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  avatarWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#5EC6C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarInitials: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFA726',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 26,
  },
  greetingWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  greetingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  menuRow: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  menuDots: {
    fontSize: 10,
    color: '#fff',
    letterSpacing: 4,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D313A',
    borderRadius: 16,
    marginTop: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  searchBar: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginHorizontal: 8,
    marginBottom: 8,
    gap: 12,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  favLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginRight: 0,
    marginBottom: 4,
  },
  favLocationTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  favLocationSubtitle: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '400',
  },
  quoteText: {
    color: '#FFA726',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  rectangleCard: {
    width: 350,
    height: 220,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 18,
    borderRadius: 18,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  captionContainer: {
    position: 'absolute',
    top: 10,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    maxWidth: '70%',
    alignSelf: 'flex-end',
  },
  rectangleImage: {
    width: 350,
    height: 220,
    borderRadius: 18,
  },
  rectangleCaption: {
    color: '#FFA726',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 16,
  },
  mainButton: {
     backgroundColor: '#5EC6C6',
     borderRadius: 20,
     paddingVertical: 36,
     paddingHorizontal: 28,
     alignItems: 'center',
     justifyContent: 'center',
     width: 160,
     marginHorizontal: 12,
     marginBottom: 20,
     shadowColor: '#222',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.12,
     shadowRadius: 8,
  },
  buttonIcon: {
     width: 56,
     height: 56,
     marginBottom: 12,
     tintColor: '#222',
  },
  buttonText: {
     color: '#222',
     fontWeight: 'bold',
     fontSize: 20,
     letterSpacing: 0.5,
  },
});