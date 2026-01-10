import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NotificationType = "warning" | "danger" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const allNotifications: Notification[] = [
  {
    id: "1",
    type: "danger",
    title: "Kecepatan Berlebih",
    message: "Kecepatan Anda melebihi batas. Harap kurangi kecepatan.",
    time: "5 menit lalu",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Kecelakaan Terdeteksi",
    message: "Terjadi kecelakaan di daerah Anda, jarak 300m dari lokasi Anda.",
    time: "15 menit lalu",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Penutupan Jalan",
    message:
      "Jarak 500m dari lokasi Anda ada penutupan jalan. Gunakan rute alternatif.",
    time: "30 menit lalu",
    read: false,
  },
  {
    id: "4",
    type: "warning",
    title: "Kemacetan Parah",
    message: "Kemacetan parah di Jl. Sudirman. Estimasi waktu 45 menit.",
    time: "1 jam lalu",
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Rute Alternatif Tersedia",
    message:
      "Sistem telah menemukan rute alternatif yang 10 menit lebih cepat.",
    time: "2 jam lalu",
    read: true,
  },
  {
    id: "6",
    type: "danger",
    title: "Peringatan Cuaca Buruk",
    message: "Hujan lebat di area tujuan Anda. Berkendara dengan hati-hati.",
    time: "3 jam lalu",
    read: true,
  },
  {
    id: "7",
    type: "info",
    title: "Pemeliharaan Jalan",
    message: "Pemeliharaan jalan di Jl. Asia Afrika dari pukul 22:00-05:00.",
    time: "5 jam lalu",
    read: true,
  },
  {
    id: "8",
    type: "warning",
    title: "Kendaraan Mogok",
    message: "Ada kendaraan mogok di jalur kanan Tol Pasteur KM 12.",
    time: "6 jam lalu",
    read: true,
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(allNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => !n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case "danger":
        return {
          backgroundColor: "#FEE2E2",
          iconColor: "#DC2626",
          icon: "speedometer" as const,
        };
      case "warning":
        return {
          backgroundColor: "#FEF3C7",
          iconColor: "#D97706",
          icon: "warning" as const,
        };
      case "info":
        return {
          backgroundColor: "#DBEAFE",
          iconColor: "#2563EB",
          icon: "information-circle" as const,
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifikasi</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Tandai Dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "all" && styles.filterActive]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            Semua ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "unread" && styles.filterActive,
          ]}
          onPress={() => setFilter("unread")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "unread" && styles.filterTextActive,
            ]}
          >
            Belum Dibaca ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color="#9CA3AF"
            />
            <Text style={styles.emptyTitle}>Tidak Ada Notifikasi</Text>
            <Text style={styles.emptyText}>
              {filter === "unread"
                ? "Semua notifikasi sudah dibaca"
                : "Belum ada notifikasi untuk Anda"}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => {
            const style = getNotificationStyle(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: style.backgroundColor },
                  ]}
                >
                  <Ionicons
                    name={style.icon}
                    size={24}
                    color={style.iconColor}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0C3AC5",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterActive: {
    backgroundColor: "#0C3AC5",
    borderColor: "#0C3AC5",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0C3AC5",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
});
