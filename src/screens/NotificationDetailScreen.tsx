import { COLORS, DEFAULT_MAP_TILE } from "@/src/utils/constants";
import { useStore } from "@/src/store/useStore";
import { formatRelativeTime, getNotificationDisplay } from "@/src/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polygon, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const FALLBACK_COORDS = {
  latitude: -6.2,
  longitude: 106.816666,
};

type LatLng = { latitude: number; longitude: number };

function getScenarioIconForId(scenarioId?: string, fallback?: keyof typeof Ionicons.glyphMap) {
  switch (scenarioId) {
    case "school_zone_active":
      return "school";
    case "wrong_way_detected":
      return "swap-vertical";
    case "illegal_uturn_zone":
      return "return-down-back";
    case "blackspot_enter":
      return "warning";
    case "low_light_area":
      return "flash";
    case "event_or_demo_area":
      return "megaphone";
    case "crime_prone_area":
      return "alert-circle";
    default:
      return fallback ?? "alert-circle";
  }
}

function offsetLatLng(origin: LatLng, northMeters: number, eastMeters: number): LatLng {
  const dLat = northMeters / 111_320;
  const dLng = eastMeters / (111_320 * Math.cos((origin.latitude * Math.PI) / 180));
  return { latitude: origin.latitude + dLat, longitude: origin.longitude + dLng };
}

function squarePolygon(center: LatLng, halfSizeMeters: number): LatLng[] {
  return [
    offsetLatLng(center, +halfSizeMeters, -halfSizeMeters),
    offsetLatLng(center, +halfSizeMeters, +halfSizeMeters),
    offsetLatLng(center, -halfSizeMeters, +halfSizeMeters),
    offsetLatLng(center, -halfSizeMeters, -halfSizeMeters),
  ];
}

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notifications, location, markNotificationRead } = useStore();

  const notification = useMemo(
    () => notifications.find((item) => item.id === id),
    [notifications, id]
  );

  useEffect(() => {
    if (notification && !notification.read) {
      markNotificationRead(notification.id);
    }
  }, [notification, markNotificationRead]);

  const userCoords = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : undefined;
  const scenarioCoords = notification?.data?.coords;
  const mapCenter = scenarioCoords ?? userCoords ?? FALLBACK_COORDS;
  const mapRegion = {
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
  const scenarioId = notification.data?.scenarioId ?? "";
  const showWrongWay = scenarioId === "wrong_way_detected" && Boolean(scenarioCoords);
  const showSchoolZone = scenarioId === "school_zone_active" && Boolean(scenarioCoords);
  const schoolZoneCoords = scenarioCoords
    ? squarePolygon(scenarioCoords, 90)
    : [];

  const displayStyle = notification
    ? getNotificationDisplay(notification)
    : null;
  const markerIcon = getScenarioIconForId(scenarioId, displayStyle?.icon);

  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Notifikasi</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={56} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Notifikasi tidak ditemukan</Text>
          <Text style={styles.emptyText}>
            Notifikasi ini sudah dihapus atau belum tersimpan di perangkat.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Notifikasi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            region={mapRegion}
            showsUserLocation={Boolean(userCoords)}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
          >
            <UrlTile urlTemplate={DEFAULT_MAP_TILE} maximumZ={19} />
            {showSchoolZone && (
              <Polygon
                coordinates={schoolZoneCoords}
                strokeColor="#1D4ED8"
                fillColor="rgba(59, 130, 246, 0.18)"
                strokeWidth={2}
              />
            )}
            {scenarioCoords && displayStyle && !showWrongWay && (
              <Marker coordinate={scenarioCoords} title={notification.title}>
                <View
                  style={[
                    styles.marker,
                    { borderColor: displayStyle.iconColor },
                  ]}
                >
                  <Ionicons
                    name={markerIcon}
                    size={18}
                    color={displayStyle.iconColor}
                  />
                </View>
              </Marker>
            )}
            {showWrongWay && scenarioCoords && (
              <Marker coordinate={scenarioCoords} title="Lawan Arah">
                <View style={[styles.marker, { borderColor: "#DC2626" }]}>
                  <Ionicons name="swap-vertical" size={18} color="#DC2626" />
                </View>
              </Marker>
            )}
            {showSchoolZone && scenarioCoords && (
              <Marker coordinate={scenarioCoords} title="Zona Sekolah">
                <View style={[styles.marker, { borderColor: "#2563EB" }]}>
                  <Ionicons name="school" size={18} color="#2563EB" />
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            {displayStyle && (
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: displayStyle.backgroundColor },
                ]}
              >
                <Ionicons
                  name={displayStyle.icon}
                  size={20}
                  color={displayStyle.iconColor}
                />
              </View>
            )}
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.time}>
                {formatRelativeTime(notification.receivedAt)}
              </Text>
            </View>
          </View>
          <Text style={styles.message}>{notification.message}</Text>

          <View style={styles.divider} />

          {notification.data?.kategori && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Kategori</Text>
              <Text style={styles.detailValue}>{notification.data.kategori}</Text>
            </View>
          )}
          {notification.data?.trigger && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trigger</Text>
              <Text style={styles.detailValue}>{notification.data.trigger}</Text>
            </View>
          )}
          {notification.data?.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lokasi</Text>
              <Text style={styles.detailValue}>{notification.data.address}</Text>
            </View>
          )}
          {scenarioCoords && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Koordinat</Text>
              <Text style={styles.detailValue}>
                {scenarioCoords.latitude.toFixed(5)}, {scenarioCoords.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  map: {
    width: "100%",
    height: 260,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    color: "#374151",
    marginTop: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
