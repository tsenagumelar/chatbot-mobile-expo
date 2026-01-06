import { useStore } from "@/src/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  onLogout?: () => void;
}

export const AppHeader: React.FC<Props> = ({ onLogout }) => {
  const { user } = useStore();
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  const handleViewAllNotifications = () => {
    setNotificationModalVisible(false);
    router.push("/notifications");
  };

  return (
    <>
    <View style={styles.container}>
      <View style={styles.nameBlock}>
        <Text style={styles.greeting}>
          Halo{user?.name ? "," : ""} {user?.name || "Pengguna"}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => setNotificationModalVisible(true)}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={18} color="#0C3AC5" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>

      {/* Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.notificationPanel}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifikasi</Text>
              <TouchableOpacity
                onPress={() => setNotificationModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationList}>
              <View style={styles.notificationItem}>
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: "#FEE2E2" },
                  ]}
                >
                  <Ionicons name="speedometer" size={20} color="#DC2626" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>
                    Kecepatan Berlebih
                  </Text>
                  <Text style={styles.notificationItemText}>
                    Kecepatan Anda melebihi batas. Harap kurangi kecepatan.
                  </Text>
                  <Text style={styles.notificationTime}>5 menit lalu</Text>
                </View>
              </View>

              <View style={styles.notificationItem}>
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: "#FEF3C7" },
                  ]}
                >
                  <Ionicons name="warning" size={20} color="#D97706" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>
                    Kecelakaan Terdeteksi
                  </Text>
                  <Text style={styles.notificationItemText}>
                    Terjadi kecelakaan di daerah Anda, jarak 300m dari lokasi
                    Anda.
                  </Text>
                  <Text style={styles.notificationTime}>15 menit lalu</Text>
                </View>
              </View>

              <View style={styles.notificationItem}>
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: "#DBEAFE" },
                  ]}
                >
                  <Ionicons name="close-circle" size={20} color="#2563EB" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>
                    Penutupan Jalan
                  </Text>
                  <Text style={styles.notificationItemText}>
                    Jarak 500m dari lokasi Anda ada penutupan jalan. Gunakan
                    rute alternatif.
                  </Text>
                  <Text style={styles.notificationTime}>30 menit lalu</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAllNotifications}
            >
              <Text style={styles.viewAllButtonText}>Lihat Semua</Text>
              <Ionicons name="chevron-forward" size={18} color="#0C3AC5" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  nameBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0B1E6B",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#DC2626",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  notificationPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  notificationList: {
    maxHeight: 320,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  notificationItemText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0C3AC5",
  },
});

export default AppHeader;
