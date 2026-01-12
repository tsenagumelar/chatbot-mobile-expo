import { useStore } from "@/src/store/useStore";
import { formatRelativeTime, getNotificationDisplay } from "@/src/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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
  const { user, notifications, markNotificationRead } = useStore();
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  const orderedNotifications = useMemo(
    () => [...notifications].sort((a, b) => b.receivedAt - a.receivedAt),
    [notifications]
  );
  const unreadCount = orderedNotifications.filter((item) => !item.read).length;
  const previewNotifications = orderedNotifications.slice(0, 3);

  const handleViewAllNotifications = () => {
    setNotificationModalVisible(false);
    router.push("/notifications");
  };

  const handleOpenNotification = (id: string) => {
    markNotificationRead(id);
    setNotificationModalVisible(false);
    router.push(`/notifications/${id}`);
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
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
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
              {previewNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={36}
                    color="#9CA3AF"
                  />
                  <Text style={styles.emptyStateTitle}>Belum ada notifikasi</Text>
                  <Text style={styles.emptyStateText}>
                    Notifikasi terbaru akan muncul di sini.
                  </Text>
                </View>
              ) : (
                previewNotifications.map((notification) => {
                  const style = getNotificationDisplay(notification);
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={styles.notificationItem}
                      onPress={() => handleOpenNotification(notification.id)}
                    >
                      <View
                        style={[
                          styles.notificationIcon,
                          { backgroundColor: style.backgroundColor },
                        ]}
                      >
                        <Ionicons
                          name={style.icon}
                          size={20}
                          color={style.iconColor}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationItemTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationItemText} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatRelativeTime(notification.receivedAt)}
                        </Text>
                      </View>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  );
                })
              )}
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    alignSelf: "center",
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
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
