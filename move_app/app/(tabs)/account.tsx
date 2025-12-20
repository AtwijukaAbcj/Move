import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

export default function AccountScreen() {
  // Example user data
  const userName = 'Alex Johnson';
  const userEmail = 'alex.johnson@email.com';
  const [avatarUrl, setAvatarUrl] = useState(null);
  const userInitials = userName ? userName.split(' ').map(n => n[0]).join('') : 'U';

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity style={styles.avatarTouchable} onPress={pickImage} activeOpacity={0.8}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarInitials}><Text style={styles.avatarInitialsText}>{userInitials}</Text></View>
            )}
            <View style={styles.cameraIconOverlay}>
              <MaterialIcons name="photo-camera" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
        <TouchableOpacity style={styles.editBtn}>
          <MaterialIcons name="edit" size={20} color="#FFA726" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionRow}>
          <MaterialIcons name="lock" size={22} color="#5EC6C6" style={{ marginRight: 10 }} />
          <Text style={styles.sectionText}>Change Password</Text>
        </View>
        <View style={styles.sectionRow}>
          <MaterialIcons name="logout" size={22} color="#E040FB" style={{ marginRight: 10 }} />
          <Text style={styles.sectionText}>Logout</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
