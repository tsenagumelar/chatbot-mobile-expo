import { Ionicons } from "@expo/vector-icons";
import type { AppNotification, NotificationSeverity } from "@/src/types";

const TYPE_STYLES: Record<
  NotificationSeverity,
  { backgroundColor: string; iconColor: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  danger: {
    backgroundColor: "#FEE2E2",
    iconColor: "#DC2626",
    icon: "warning",
  },
  warning: {
    backgroundColor: "#FEF3C7",
    iconColor: "#D97706",
    icon: "warning",
  },
  info: {
    backgroundColor: "#DBEAFE",
    iconColor: "#2563EB",
    icon: "information-circle",
  },
};

const DEFAULT_STYLE = TYPE_STYLES.info;

function resolveIonicon(name?: string): keyof typeof Ionicons.glyphMap {
  if (name && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, name)) {
    return name as keyof typeof Ionicons.glyphMap;
  }
  return DEFAULT_STYLE.icon;
}

export function getNotificationDisplay(notification: AppNotification) {
  const type = notification.data?.type ?? "info";
  const base = TYPE_STYLES[type] ?? DEFAULT_STYLE;
  const icon = resolveIonicon(notification.data?.icon) ?? base.icon;
  const iconColor = notification.data?.color ?? base.iconColor;

  return {
    backgroundColor: base.backgroundColor,
    iconColor,
    icon,
  };
}

export function formatRelativeTime(timestamp: number, now = Date.now()) {
  const diffMs = Math.max(0, now - timestamp);
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function pickSeverityFromColor(color?: string): NotificationSeverity {
  if (!color) return "info";
  const normalized = color.toLowerCase();
  if (normalized.startsWith("#ef") || normalized.includes("red")) return "danger";
  if (normalized.startsWith("#f5") || normalized.startsWith("#fe")) return "warning";
  return "info";
}
