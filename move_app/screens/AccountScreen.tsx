import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../app/auth-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.31:8000";

export default function AccountScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
      loadProfilePicture();
    }
  }, [user]);

  const loadProfilePicture = async () => {
    try {
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) return;

      const response = await fetch(`${BASE_URL}/api/corporate/customer/${customerId}/profile/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile_picture) {
          setAvatarUrl(data.profile_picture);
        }
      }
    } catch (error) {
      console.error("Error loading profile picture:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to upload a profile picture.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      await uploadProfilePicture(imageUri);
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploading(true);
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) {
        Alert.alert("Error", "Customer ID not found. Please login again.");
        return;
      }

      // Create form data
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profile_picture', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      const response = await fetch(`${BASE_URL}/api/corporate/customer/${customerId}/profile-picture/`, {
        method: "POST",
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.profile_picture);
        Alert.alert("Success", "Profile picture updated successfully!");
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      Alert.alert("Error", "Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  // Example user data
  const userName = user?.full_name || user?.name || 'Alex Johnson';
  const userEmail = user?.email || 'alex.johnson@email.com';
  const userInitials = userName ? userName.split(' ').map((n: string) => n[0]).join('') : 'U';

  // Example balance, should be synced with WalletScreen in a real app
  const [balance] = useState(2500);

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity 
            style={styles.avatarTouchable} 
            onPress={pickImage} 
            activeOpacity={0.8}
            disabled={uploading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarInitials}>
                <Text style={styles.avatarInitialsText}>{userInitials}</Text>
              </View>
            )}
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={styles.cameraIconOverlay}>
                <MaterialIcons name="photo-camera" size={22} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
        <TouchableOpacity style={styles.editBtn}>
          <MaterialIcons name="edit" size={20} color="#FFA726" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Credit Balance Section */}
      <View style={styles.creditSection}>
        <View style={styles.creditBalanceRow}>
          <MaterialIcons name="account-balance-wallet" size={28} color="#5EC6C6" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.creditLabel}>Credit Balance</Text>
            <Text style={styles.creditAmount}>₦{balance.toLocaleString()}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addCreditBtn}
          onPress={() => router.push("/wallet")}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add-circle" size={20} color="#fff" />
          <Text style={styles.addCreditBtnText}>Add More Credit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionRow}>
          <MaterialIcons name="lock" size={22} color="#5EC6C6" style={{ marginRight: 10 }} />
          <Text style={styles.sectionText}>Change Password</Text>
        </View>
        <TouchableOpacity
          style={styles.sectionRow}
          onPress={async () => {
            // Use logout from context, then redirect
            if (typeof user?.logout === 'function') {
              await user.logout();
            } else {
              // fallback to context logout
              const { logout } = require('../app/auth-context');
              if (logout) await logout();
            }
            router.replace("/login");
          }}
        >
          <MaterialIcons name="logout" size={22} color="#E040FB" style={{ marginRight: 10 }} />
          <Text style={styles.sectionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  creditSection: {
    backgroundColor: '#2D313A',
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    width: '88%',
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  creditBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creditLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  creditAmount: {
    color: '#5EC6C6',
    fontWeight: '900',
    fontSize: 22,
  },
  addCreditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5EC6C6',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
  },
  addCreditBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
    marginLeft: 8,
  },
  avatarTouchable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#5EC6C6',
    overflow: 'hidden',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#35736E',
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#23272F',
    alignItems: 'center',
    paddingTop: 48,
  },
  profileCard: {
    backgroundColor: '#35736E',
    borderRadius: 22,
    alignItems: 'center',
    padding: 28,
    marginBottom: 32,
    width: '88%',
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5EC6C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitials: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFA726',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  userEmail: {
    color: '#B0BEC5',
    fontSize: 15,
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  editBtnText: {
    color: '#FFA726',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#2D313A',
    borderRadius: 18,
    padding: 20,
    width: '88%',
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  sectionTitle: {
    color: '#FFA726',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
