import { AppHeader } from "@/src/components/AppHeader";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import useBerandaScreen, { getScenarioIcon } from "./hooks";

export default function HomeScreen() {
  const {
    address,
    location,
    speed,
    isTracking,
    lastUpdate,
    refreshLocation,
    handleLogout,
    handleLocationCardPress,
    transportModes,
    selectedMode,
    setSelectedMode,
    selectedModeIcon,
    showModePicker,
    setShowModePicker,
    activeScenarioId,
    setActiveScenarioId,
    activeScenario,
    scenarioMarkers,
    restArea,
    restAreaScenarioIds,
    uturnPoint,
    safeDestination,
    route,
    setRoute,
    showRoutePicker,
    setShowRoutePicker,
    routeOptions,
    notificationData,
    LIBRARY_PREVIEW,
    handleOpenPdf,
    handleOpenLibrary,
  } = useBerandaScreen();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <AppHeader onLogout={handleLogout} />

        <View style={styles.quickRow}>
          <View style={styles.quickCard}>
            <View style={styles.quickIconWrapper}>
              <Ionicons name="locate" size={18} color="#0B57D0" />
            </View>
            <View>
              <Text style={styles.quickLabel}>Tracking</Text>
              <Text style={styles.quickValue}>{isTracking ? "Aktif" : "Idle"}</Text>
            </View>
          </View>
          <View style={styles.quickCard}>
            <View style={[styles.quickIconWrapper, { backgroundColor: "#FFF4E5" }]}>
              <Ionicons name="speedometer" size={18} color="#FB923C" />
            </View>
            <View>
              <Text style={styles.quickLabel}>Kecepatan</Text>
              <Text style={styles.quickValue}>{speed > 0 ? speed : 0} km/j</Text>
            </View>
          </View>
          <View style={styles.quickCard}>
            <View style={[styles.quickIconWrapper, { backgroundColor: "#E4F8ED" }]}>
              <Ionicons name="time" size={18} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.quickLabel}>Terakhir</Text>
              <Text style={styles.quickValue}>
                {lastUpdate ? moment(lastUpdate).format("HH:mm") : "-"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.locationCard}
          onPress={handleLocationCardPress}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Current Location</Text>
            <View style={styles.notifBadge}>
              <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
                <Ionicons name="refresh" size={22} color="#0B57D0" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.addressText}>{address}</Text>
          <View style={styles.coordsRow}>
            {location && (
              <Text style={styles.coordsText}>
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            )}
            <Text style={styles.accuracyTextInline}>
              ±{location?.accuracy?.toFixed(0) || "N/A"}m
            </Text>
          </View>
        </TouchableOpacity>

        {location && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="map" size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Map View</Text>
              <View style={styles.modeFloatingContainer}>
                <TouchableOpacity
                  onPress={() => setShowModePicker((prev) => !prev)}
                  style={styles.modeFloatingButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name={selectedModeIcon} size={18} color="#FFFFFF" />
                  <Text style={styles.modeFloatingText}>{selectedMode}</Text>
                </TouchableOpacity>
                {showModePicker && (
                  <View style={styles.modePicker}>
                    {transportModes.map((mode) => (
                      <TouchableOpacity
                        key={mode.label}
                        style={[
                          styles.modeOption,
                          selectedMode === mode.label && styles.modeOptionActive,
                        ]}
                        onPress={() => {
                          setSelectedMode(mode.label);
                          setShowModePicker(false);
                        }}
                      >
                        <Ionicons
                          name={mode.icon}
                          size={16}
                          color={selectedMode === mode.label ? "#FFFFFF" : "#1D4ED8"}
                        />
                        <Text
                          style={[
                            styles.modeOptionText,
                            selectedMode === mode.label && styles.modeOptionTextActive,
                          ]}
                        >
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scenarioScrollerContent}
              style={styles.scenarioScroller}
            >
              {notificationData.map((item) => {
                const isActive = item.id === activeScenarioId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.scenarioChip, isActive && styles.scenarioChipActive]}
                    onPress={() => setActiveScenarioId(item.id)}
                  >
                    <Ionicons
                      name={getScenarioIcon(item)}
                      size={14}
                      color={isActive ? "#FFFFFF" : "#0B57D0"}
                    />
                    <Text
                      style={[
                        styles.scenarioChipText,
                        isActive && styles.scenarioChipTextActive,
                      ]}
                    >
                      {item.sapaan_ringkas}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {activeScenario && (
              <View style={styles.scenarioHint}>
                <Text style={styles.scenarioHintTitle}>{activeScenario.kategori}</Text>
                <Text style={styles.scenarioHintText}>
                  Trigger: {activeScenario.trigger}
                </Text>
              </View>
            )}
            <View style={styles.mapContainer}>
              <MapView
                key={`map-${activeScenarioId ?? "default"}`}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                mapType="standard"
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
              >
                {scenarioMarkers.map((marker) => (
                  <Marker key={marker.id} coordinate={marker.coord} title={marker.title}>
                    <View style={[styles.scenarioMarker, { borderColor: marker.color }]}>
                      <Ionicons name={marker.icon} size={18} color={marker.color} />
                    </View>
                  </Marker>
                ))}

                {restArea &&
                  activeScenarioId &&
                  restAreaScenarioIds.has(activeScenarioId) && (
                    <Marker coordinate={restArea.coord} title={restArea.name}>
                      <View style={styles.restMarker}>
                        <Text style={styles.restIcon}>🅿️</Text>
                      </View>
                    </Marker>
                  )}

                {uturnPoint &&
                  (activeScenarioId === "wrong_way_detected" ||
                    activeScenarioId === "illegal_uturn_zone") && (
                    <Marker coordinate={uturnPoint.coord} title={uturnPoint.name}>
                      <View style={styles.uturnMarker}>
                        <Ionicons name="return-down-back" size={18} color="#DC2626" />
                      </View>
                    </Marker>
                  )}

                {safeDestination && (
                  <Marker coordinate={safeDestination} title="Tujuan Akhir">
                    <View style={styles.safeMarker}>
                      <Text style={styles.safeIcon}>🏁</Text>
                    </View>
                  </Marker>
                )}

                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Location"
                  description={address}
                  pinColor="#007AFF"
                />

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
                    {routeOptions.length === 0 ? (
                      <View style={styles.routeOption}>
                        <Ionicons name="alert-circle" size={16} color="#9CA3AF" />
                        <Text style={styles.routeOptionText}>
                          Rute belum tersedia untuk notifikasi ini
                        </Text>
                      </View>
                    ) : (
                      routeOptions.map((option) => (
                        <TouchableOpacity
                          key={option.key}
                          style={styles.routeOption}
                          onPress={() => {
                            setShowRoutePicker(false);
                            option.onPress();
                          }}
                        >
                          <Ionicons name={option.icon} size={16} color="#1D4ED8" />
                          <Text style={styles.routeOptionText}>{option.label}</Text>
                        </TouchableOpacity>
                      ))
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
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="library" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Perpustakaan</Text>
          </View>
          <Text style={styles.librarySubtitle}>
            Akses dokumen dan panduan lalu lintas
          </Text>

          {LIBRARY_PREVIEW.map((pdf) => (
            <TouchableOpacity
              key={pdf.id}
              style={styles.pdfItem}
              onPress={() => handleOpenPdf(pdf.id)}
            >
              <View style={styles.pdfIconContainer}>
                <Ionicons name="document-text" size={24} color="#EF4444" />
              </View>
              <View style={styles.pdfInfo}>
                <Text style={styles.pdfTitle}>{pdf.name}</Text>
                <Text style={styles.pdfDescription}>{pdf.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.viewAllButton} onPress={handleOpenLibrary}>
            <Text style={styles.viewAllText}>Lihat Semua</Text>
            <Ionicons name="arrow-forward" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  subGreeting: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E8F0FE",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  quickValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B1E6B",
  },
  refreshRow: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationCard: {
    backgroundColor: "#F0F9FF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  notifBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressText: {
    fontSize: 15,
    color: "#111827",
    marginBottom: 6,
    fontWeight: "600",
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coordsText: {
    fontSize: 12,
    color: "#4B5563",
  },
  accuracyTextInline: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  mapContainer: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  map: {
    width: "100%",
    height: 280,
  },
  scenarioScroller: {
    marginTop: 6,
  },
  scenarioScrollerContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  scenarioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  scenarioChipActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  scenarioChipText: {
    color: "#1E3A8A",
    fontSize: 12,
    fontWeight: "700",
  },
  scenarioChipTextActive: {
    color: "#FFFFFF",
  },
  scenarioHint: {
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  scenarioHintTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E3A8A",
  },
  scenarioHintText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  scenarioMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  restMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#16A34A",
  },
  restIcon: {
    fontSize: 16,
  },
  uturnMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  safeMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0284C7",
  },
  safeIcon: {
    fontSize: 16,
  },
  modeFloatingContainer: {
    position: "relative",
    alignItems: "flex-end",
  },
  modeFloatingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0B57D0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modeFloatingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modePicker: {
    position: "absolute",
    top: 38,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 140,
    gap: 6,
    zIndex: 10,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
  },
  modeOptionActive: {
    backgroundColor: "#1D4ED8",
  },
  modeOptionText: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  modeOptionTextActive: {
    color: "#FFFFFF",
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
  librarySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  pdfItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  pdfIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  pdfDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
  },
});
