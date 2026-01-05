import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME = {
  primary: "#35736E",
  aqua: "#5EC6C6",
  accent: "#FFA726",
  dark: "#23272F",
  ink: "#0f1a19",
};

interface Shortcut {
  id: string;
  title: string;
  address: string;
  icon: string;
  iconColor: string;
  type: "home" | "work" | "favorite" | "custom";
}

const SHORTCUT_ICONS = [
  { name: "home", icon: "home", color: "#5EC6C6" },
  { name: "work", icon: "briefcase", color: "#FFA726" },
  { name: "location", icon: "location-pin", color: "#E040FB" },
  { name: "star", icon: "star", color: "#FFD700" },
  { name: "school", icon: "school", color: "#FF6B6B" },
  { name: "restaurant", icon: "restaurant", color: "#4ECDC4" },
  { name: "shopping", icon: "shopping-bag", color: "#95E1D3" },
  { name: "gym", icon: "fitness-center", color: "#F38181" },
];

export default function ShortcutsScreen() {
  const router = useRouter();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(SHORTCUT_ICONS[0]);

  useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = async () => {
    try {
      const stored = await AsyncStorage.getItem("move_shortcuts");
      if (stored) {
        setShortcuts(JSON.parse(stored));
      } else {
        // Set default shortcuts
        const defaultShortcuts: Shortcut[] = [
          {
            id: "1",
            title: "Home",
            address: "Add your home address",
            icon: "home",
            iconColor: "#5EC6C6",
            type: "home",
          },
          {
            id: "2",
            title: "Work",
            address: "Add your work address",
            icon: "briefcase",
            iconColor: "#FFA726",
            type: "work",
          },
        ];
        setShortcuts(defaultShortcuts);
        await AsyncStorage.setItem("move_shortcuts", JSON.stringify(defaultShortcuts));
      }
    } catch (error) {
      console.error("Error loading shortcuts:", error);
    }
  };

  const saveShortcuts = async (newShortcuts: Shortcut[]) => {
    try {
      await AsyncStorage.setItem("move_shortcuts", JSON.stringify(newShortcuts));
      setShortcuts(newShortcuts);
    } catch (error) {
      console.error("Error saving shortcuts:", error);
    }
  };

  const openAddModal = () => {
    setEditingShortcut(null);
    setFormTitle("");
    setFormAddress("");
    setSelectedIcon(SHORTCUT_ICONS[2]);
    setModalVisible(true);
  };

  const openEditModal = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setFormTitle(shortcut.title);
    setFormAddress(shortcut.address);
    const iconData = SHORTCUT_ICONS.find((i) => i.icon === shortcut.icon) || SHORTCUT_ICONS[0];
    setSelectedIcon(iconData);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formAddress.trim()) {
      Alert.alert("Missing Information", "Please enter both title and address");
      return;
    }

    if (editingShortcut) {
      // Update existing
      const updated = shortcuts.map((s) =>
        s.id === editingShortcut.id
          ? {
              ...s,
              title: formTitle,
              address: formAddress,
              icon: selectedIcon.name,
              iconColor: selectedIcon.color,
            }
          : s
      );
      await saveShortcuts(updated);
    } else {
      // Add new
      const newShortcut: Shortcut = {
        id: Date.now().toString(),
        title: formTitle,
        address: formAddress,
        icon: selectedIcon.name,
        iconColor: selectedIcon.color,
        type: "custom",
      };
      await saveShortcuts([...shortcuts, newShortcut]);
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Shortcut", "Are you sure you want to delete this shortcut?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const filtered = shortcuts.filter((s) => s.id !== id);
          await saveShortcuts(filtered);
        },
      },
    ]);
  };

  const useShortcut = (shortcut: Shortcut) => {
    if (shortcut.address.includes("Add")) {
      openEditModal(shortcut);
    } else {
      router.push({
        pathname: "/rides",
        params: { destination: shortcut.address },
      });
    }
  };

  const getIconComponent = (iconName: string, color: string, size: number = 24) => {
    switch (iconName) {
      case "home":
        return <Ionicons name="home" size={size} color={color} />;
      case "briefcase":
        return <FontAwesome5 name="briefcase" size={size - 4} color={color} />;
      case "location-pin":
        return <MaterialIcons name="location-pin" size={size} color={color} />;
      case "star":
        return <Ionicons name="star" size={size} color={color} />;
      case "school":
        return <MaterialIcons name="school" size={size} color={color} />;
      case "restaurant":
        return <MaterialIcons name="restaurant" size={size} color={color} />;
      case "shopping-bag":
        return <MaterialIcons name="shopping-bag" size={size} color={color} />;
      case "fitness-center":
        return <MaterialIcons name="fitness-center" size={size} color={color} />;
      default:
        return <MaterialIcons name="location-pin" size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shortcuts</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn} activeOpacity={0.9}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Save your frequently visited places for quick access. Tap to book a ride instantly.
        </Text>

        {shortcuts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="location-off" size={48} color="#9AA4B2" />
            </View>
            <Text style={styles.emptyTitle}>No Shortcuts Yet</Text>
            <Text style={styles.emptyText}>
              Add your favorite places like home, work, or anywhere you visit often
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal} activeOpacity={0.9}>
              <Ionicons name="add-circle" size={20} color={THEME.ink} />
              <Text style={styles.emptyBtnText}>Add First Shortcut</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.shortcutsList}>
            {shortcuts.map((shortcut) => (
              <TouchableOpacity
                key={shortcut.id}
                style={styles.shortcutCard}
                activeOpacity={0.9}
                onPress={() => useShortcut(shortcut)}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: `${shortcut.iconColor}20` }]}>
                  {getIconComponent(shortcut.icon, shortcut.iconColor, 24)}
                </View>

                <View style={styles.shortcutContent}>
                  <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                  <Text style={styles.shortcutAddress} numberOfLines={1}>
                    {shortcut.address}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      openEditModal(shortcut);
                    }}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="create-outline" size={20} color="#9AA4B2" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(shortcut.id);
                    }}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={THEME.aqua} />
          <Text style={styles.infoText}>
            Tap a shortcut to book a ride instantly. Long press for quick actions.
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingShortcut ? "Edit Shortcut" : "Add Shortcut"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.9}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Home, Work, Gym"
                placeholderTextColor="#6B7280"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter full address"
                placeholderTextColor="#6B7280"
                value={formAddress}
                onChangeText={setFormAddress}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {SHORTCUT_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon.name}
                    style={[
                      styles.iconOption,
                      selectedIcon.name === icon.name && styles.iconOptionActive,
                      { borderColor: icon.color },
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                    activeOpacity={0.9}
                  >
                    {getIconComponent(icon.icon, icon.color, 28)}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
                <Text style={styles.saveBtnText}>
                  {editingShortcut ? "Update" : "Add Shortcut"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.dark },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 16,
    backgroundColor: THEME.dark,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.aqua,
    alignItems: "center",
    justifyContent: "center",
  },

  content: { flex: 1, padding: 16 },

  description: {
    color: "#9AA4B2",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 20,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyText: {
    color: "#9AA4B2",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: THEME.aqua,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  emptyBtnText: { color: THEME.ink, fontSize: 15, fontWeight: "900" },

  shortcutsList: { gap: 12 },

  shortcutCard: {
    backgroundColor: "#2D313A",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutContent: { flex: 1 },
  shortcutTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  shortcutAddress: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "rgba(94,198,198,0.1)",
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(94,198,198,0.2)",
  },
  infoText: {
    flex: 1,
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2D313A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  label: {
    color: "#9AA4B2",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 14,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  iconOption: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconOptionActive: {
    borderWidth: 2,
    backgroundColor: "rgba(94,198,198,0.1)",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: THEME.aqua,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    color: THEME.ink,
    fontSize: 15,
    fontWeight: "900",
  },
});
