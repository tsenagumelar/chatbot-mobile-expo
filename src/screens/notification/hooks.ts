import { useStore } from "@/src/store/useStore";
import { router } from "expo-router";
import { useMemo, useState } from "react";

export default function useNotificationScreen() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const orderedNotifications = useMemo(
    () => [...notifications].sort((a, b) => b.receivedAt - a.receivedAt),
    [notifications]
  );

  const filteredNotifications =
    filter === "all"
      ? orderedNotifications
      : orderedNotifications.filter((n) => !n.read);

  const unreadCount = orderedNotifications.filter((n) => !n.read).length;

  const handleOpenNotification = (id: string) => {
    markNotificationRead(id);
    router.push(`/notifications/${id}`);
  };

  const handleBack = () => router.back();

  return {
    filter,
    setFilter,
    orderedNotifications,
    filteredNotifications,
    unreadCount,
    markAllNotificationsRead,
    handleOpenNotification,
    handleBack,
  };
}
