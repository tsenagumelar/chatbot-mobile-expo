import { COLORS } from "@/src/utils/constants";
import { formatRelativeTime } from "@/src/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import useNotificationDetailScreen from "./hooks";

export default function NotificationDetailScreen() {
  const {
    notification,
    mapRegion,
    mapHeight,
    showDangerZone,
    dangerZoneCoords,
    showSchoolZone,
    schoolZoneCoords,
    showWrongWay,
    showRestArea,
    staticUserCoords,
    scenarioCoords,
    displayStyle,
    markerIcon,
    route,
    loadingRoute,
    showRoutePicker,
    setShowRoutePicker,
    routeTarget,
    handleRouteToTarget,
    setRoute,
    restAreaCoord,
    tripTypes,
    highlightAll,
    tripTypeIcons,
    handleBack,
  } = useNotificationDetailScreen();

  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Notifikasi</Text>
      </View>

      <View style={styles.tripTypeBanner}>
        {tripTypeIcons.map((item) => {
          const isActive = highlightAll || tripTypes.includes(item.id);
          return (
            <View
              key={item.id}
              style={[
                styles.tripTypeIconBadge,
                isActive && styles.tripTypeIconBadgeActive,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={isActive ? "#FFFFFF" : "#94A3B8"}
              />
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapCard}>
          <MapView
            style={[styles.map, { height: mapHeight }]}
            provider={PROVIDER_GOOGLE}
            mapType="standard"
            region={mapRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
          >
            {showDangerZone && (
              <Polygon
                coordinates={dangerZoneCoords}
                strokeColor="#F59E0B"
                fillColor="rgba(245, 158, 11, 0.2)"
                strokeWidth={2}
              />
            )}
            {showSchoolZone && (
              <Polygon
                coordinates={schoolZoneCoords}
                strokeColor="#1D4ED8"
                fillColor="rgba(59, 130, 246, 0.18)"
                strokeWidth={2}
              />
            )}
            {staticUserCoords && (
              <Marker coordinate={staticUserCoords} title="Lokasi Anda">
                <View style={styles.userMarker}>
                  <Ionicons name="person" size={16} color="#0B57D0" />
                </View>
              </Marker>
            )}
            {scenarioCoords && displayStyle && !showWrongWay && !showRestArea && (
              <Marker coordinate={scenarioCoords} title={notification.title}>
                <View style={[styles.marker, { borderColor: displayStyle.iconColor }]}>
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
            {showRestArea && restAreaCoord && (
              <Marker coordinate={restAreaCoord} title="Rest Area Terdekat">
                <View style={[styles.marker, { borderColor: "#34C759" }]}>
                  <Ionicons name="bed" size={18} color="#34C759" />
                </View>
              </Marker>
            )}
            {route && (
              <Polyline
                coordinates={route}
                strokeWidth={5}
                strokeColor="rgba(0,122,255,0.95)"
              />
            )}
          </MapView>
          <View style={styles.routeFloatingContainer}>
            <TouchableOpacity
              onPress={() => setShowRoutePicker((prev) => !prev)}
              style={styles.routeFloatingButton}
              activeOpacity={0.8}
            >
              <Ionicons name="trail-sign" size={18} color="#FFFFFF" />
              <Text style={styles.routeFloatingText}>Pilih Rute</Text>
            </TouchableOpacity>
            {showRoutePicker && (
              <View style={styles.routePicker}>
                {routeTarget ? (
                  <TouchableOpacity
                    style={styles.routeOption}
                    onPress={() => {
                      setShowRoutePicker(false);
                      handleRouteToTarget();
                    }}
                  >
                    <Ionicons name="navigate" size={16} color="#1D4ED8" />
                    <Text style={styles.routeOptionText}>
                      {loadingRoute ? "Mencari rute..." : routeTarget.label}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.routeOption}>
                    <Ionicons name="alert-circle" size={16} color="#9CA3AF" />
                    <Text style={styles.routeOptionText}>
                      Rute belum tersedia untuk notifikasi ini
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.routeOption, styles.routeOptionDanger]}
                  onPress={() => {
                    setRoute(null);
                    setShowRoutePicker(false);
                  }}
                >
                  <Ionicons name="close-circle" size={16} color="#DC2626" />
                  <Text style={[styles.routeOptionText, styles.routeOptionTextDanger]}>
                    Hapus Rute
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  tripTypeBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  tripTypeIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5F5",
  },
  tripTypeIconBadgeActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0B57D0",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  routeFloatingContainer: {
    position: "absolute",
    right: 16,
    bottom: 16,
    alignItems: "flex-end",
    gap: 8,
  },
  routeFloatingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0B57D0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  routeFloatingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  routePicker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    minWidth: 210,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    gap: 8,
  },
  routeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  routeOptionText: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "600",
    flexShrink: 1,
  },
  routeOptionDanger: {
    backgroundColor: "#FEE2E2",
  },
  routeOptionTextDanger: {
    color: "#DC2626",
  },
});
