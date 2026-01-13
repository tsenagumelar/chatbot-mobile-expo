import { AppHeader } from "@/src/components/AppHeader";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import useMenyapaScreen from "./hooks";

export default function MenyapaScreen() {
  const {
    mapRef,
    location,
    zoomDelta,
    showDestinationPicker,
    setShowDestinationPicker,
    selectedDestination,
    destinationQuery,
    setDestinationQuery,
    destinationResults,
    destinationError,
    handleSelectDestination,
    handleClearDestination,
    hotspotCenter,
    hotspotRadius,
    showOverlay,
    routePoints,
    routeZones,
    routeOrigin,
    handleFocusLocation,
    handleZoom,
    showVehiclePicker,
    setShowVehiclePicker,
    vehicleOptions,
    activeVehicle,
    setOnboarding,
    isLocationReady,
    overlayTitle,
    typedOverlayText,
    handleLogout,
    isTravelActive,
    setIsTravelActive,
    silentMode,
    setSilentMode,
  } = useMenyapaScreen();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <AppHeader onLogout={handleLogout} />
      </View>
      <View style={styles.mapWrapper}>
        {/* {isMotorMode && ( */}
          <View style={styles.destinationBox}>
            <TouchableOpacity
              style={styles.destinationInput}
              onPress={() => setShowDestinationPicker((prev) => !prev)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={16} color="#0B1E6B" />
              <Text style={styles.destinationText}>
                {selectedDestination?.label ?? "Pilih tujuan..."}
              </Text>
              {selectedDestination ? (
                <TouchableOpacity
                  style={styles.destinationClearButton}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleClearDestination();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
            {showDestinationPicker && (
              <View style={styles.destinationList}>
                <View style={styles.destinationSearchRow}>
                  <Ionicons name="search" size={16} color="#64748B" />
                  <TextInput
                    style={styles.destinationSearchInput}
                    value={destinationQuery}
                    onChangeText={setDestinationQuery}
                    placeholder="Cari lokasi..."
                    placeholderTextColor="#94A3B8"
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                  />
                  {destinationQuery.length > 0 ? (
                    <TouchableOpacity
                      style={styles.destinationSearchClear}
                      onPress={() => setDestinationQuery("")}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.destinationResults}>
                  {destinationResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.destinationItem}
                      onPress={() => handleSelectDestination(item.id)}
                    >
                      <Text style={styles.destinationItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {destinationResults.length === 0 && destinationQuery.length >= 3 && (
                    <Text style={styles.destinationEmpty}>
                      {destinationError || "Tidak ada hasil."}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        {/* )} */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={{
            latitude: location?.latitude ?? -6.914744,
            longitude: location?.longitude ?? 107.60981,
            latitudeDelta: zoomDelta,
            longitudeDelta: zoomDelta,
          }}
          showsMyLocationButton={Boolean(location)}
          showsCompass={true}
          showsScale={true}
        >
          {routeOrigin && (
            <Marker coordinate={routeOrigin} title="Titik Start">
              <View style={styles.routeMarkerStart}>
                <Ionicons name="flag" size={14} color="#FFFFFF" />
              </View>
            </Marker>
          )}
          {hotspotCenter && showOverlay && (
            <Circle
              center={hotspotCenter}
              radius={hotspotRadius}
              fillColor="rgba(12, 58, 197, 0.12)"
              strokeColor="rgba(12, 58, 197, 0.45)"
              strokeWidth={2}
            />
          )}
          {routePoints.length > 1 && (
            <Polyline coordinates={routePoints} strokeWidth={4} strokeColor="#0C3AC5" />
          )}
          {routeZones.map((zone, index) => (
            <Marker
              key={`route-zone-marker-${index}`}
              coordinate={zone.center}
              title={zone.title}
            >
              <View style={styles.routeMarkerZone}>
                <Ionicons name={zone.icon as any} size={12} color="#FFFFFF" />
              </View>
            </Marker>
          ))}
          {routeZones.map((zone, index) => (
            <Circle
              key={`route-zone-${index}`}
              center={zone.center}
              radius={zone.radius}
              fillColor="rgba(12, 58, 197, 0.08)"
              strokeColor="rgba(12, 58, 197, 0.35)"
              strokeWidth={2}
            />
          ))}
          {selectedDestination && (
            <Marker
              coordinate={{
                latitude: selectedDestination.latitude,
                longitude: selectedDestination.longitude,
              }}
              title={selectedDestination.label}
            >
              <View style={styles.routeMarkerFinish}>
                <Ionicons name="location" size={14} color="#FFFFFF" />
              </View>
            </Marker>
          )}
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Lokasi Anda"
              tracksViewChanges={true}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={10}
            >
              <View style={styles.userMarker}>
                <Ionicons name="navigate" size={14} color="#FFFFFF" />
              </View>
            </Marker>
          )}
        </MapView>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={handleFocusLocation}
            activeOpacity={0.85}
          >
            <Ionicons name="locate" size={20} color="#0B1E6B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom("in")}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#0B1E6B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom("out")}
            activeOpacity={0.85}
          >
            <Ionicons name="remove" size={20} color="#0B1E6B" />
          </TouchableOpacity>
        </View>
        <View style={styles.floatingStack}>
          <TouchableOpacity
            style={styles.silentButton}
            onPress={() => setSilentMode(!silentMode)}
            activeOpacity={0.9}
          >
            <Ionicons
              name={silentMode ? "volume-mute" : "volume-high"}
              size={18}
              color="#0B1E6B"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.travelButton,
              isTravelActive && styles.travelButtonActive,
            ]}
            onPress={() => setIsTravelActive((prev) => !prev)}
            activeOpacity={0.9}
          >
            <Ionicons
              name={isTravelActive ? "pause" : "play"}
              size={18}
              color={isTravelActive ? "#FFFFFF" : "#0B1E6B"}
            />
          </TouchableOpacity>
          {showVehiclePicker && (
            <View style={styles.vehiclePicker}>
              {vehicleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.vehicleOption,
                    option.value === activeVehicle.value && styles.vehicleOptionActive,
                  ]}
                  onPress={() => {
                    setOnboarding({ primary_vehicle: option.value });
                    setShowVehiclePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.vehicleEmoji,
                      option.value === activeVehicle.value && styles.vehicleEmojiActive,
                    ]}
                  >
                    {option.emoji}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.vehicleButton}
            onPress={() => setShowVehiclePicker((prev) => !prev)}
            activeOpacity={0.9}
          >
            <Text style={styles.vehicleEmoji}>{activeVehicle.emoji}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingButton} activeOpacity={0.9}>
            <Image
              source={require("@/assets/images/Polantas Logo.png")}
              style={styles.floatingLogo}
            />
          </TouchableOpacity>
        </View>
        {!isLocationReady && (
          <View style={styles.locationLoading}>
            <View style={styles.locationLoadingCard}>
              <Text style={styles.locationLoadingTitle}>Mencari lokasi...</Text>
              <Text style={styles.locationLoadingSubtitle}>
                Menunggu sinyal GPS untuk menampilkan posisi kamu.
              </Text>
            </View>
          </View>
        )}
      </View>

      {showOverlay && (
        <View style={styles.globalOverlayContainer} pointerEvents="none">
          <LinearGradient
            colors={[
              "rgba(12, 58, 197, 0.95)",
              "rgba(12, 58, 197, 0.85)",
              "rgba(12, 58, 197, 0.7)",
              "rgba(12, 58, 197, 0.4)",
              "rgba(12, 58, 197, 0.15)",
              "transparent",
            ]}
            locations={[0, 0.2, 0.4, 0.65, 0.85, 1]}
            style={styles.overlayTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[
              "transparent",
              "rgba(12, 58, 197, 0.15)",
              "rgba(12, 58, 197, 0.4)",
              "rgba(12, 58, 197, 0.7)",
              "rgba(12, 58, 197, 0.85)",
              "rgba(12, 58, 197, 0.95)",
            ]}
            locations={[0, 0.15, 0.35, 0.6, 0.8, 1]}
            style={styles.overlayBottom}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[
              "rgba(12, 58, 197, 0.95)",
              "rgba(12, 58, 197, 0.85)",
              "rgba(12, 58, 197, 0.7)",
              "rgba(12, 58, 197, 0.4)",
              "rgba(12, 58, 197, 0.15)",
              "transparent",
            ]}
            locations={[0, 0.2, 0.4, 0.65, 0.85, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.overlayLeft}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[
              "transparent",
              "rgba(12, 58, 197, 0.15)",
              "rgba(12, 58, 197, 0.4)",
              "rgba(12, 58, 197, 0.7)",
              "rgba(12, 58, 197, 0.85)",
              "rgba(12, 58, 197, 0.95)",
            ]}
            locations={[0, 0.15, 0.35, 0.6, 0.8, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.overlayRight}
            pointerEvents="none"
          />
        </View>
      )}

      {showOverlay && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <View style={styles.overlayPill}>
              <Image
                source={require("@/assets/images/logo-baru.png")}
                style={styles.overlayPillLogo}
              />
              <Text style={styles.overlayPillText}>{overlayTitle || "Notifikasi"}</Text>
              <Ionicons name="radio" size={14} color="#0C3AC5" />
            </View>
            <Text style={styles.overlayText}>{typedOverlayText}</Text>
            <LottieView
              source={require("@/src/services/voice.json")}
              autoPlay
              loop
              style={styles.overlayLottie}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  globalOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  overlayLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "40%",
  },
  overlayRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "40%",
  },
  header: {
    paddingHorizontal: 0,
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  floatingStack: {
    position: "absolute",
    right: 20,
    bottom: 24,
    alignItems: "center",
    gap: 10,
  },
  silentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  travelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  travelButtonActive: {
    backgroundColor: "#0C3AC5",
    borderColor: "#0C3AC5",
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  floatingLogo: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  zoomControls: {
    position: "absolute",
    left: 16,
    top: 16,
    gap: 8,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  destinationBox: {
    position: "absolute",
    left: 72,
    right: 16,
    top: 12,
    zIndex: 2,
  },
  destinationInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  destinationText: {
    color: "#0B1E6B",
    fontWeight: "600",
    flex: 1,
  },
  destinationClearButton: {
    paddingLeft: 6,
  },
  destinationList: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  destinationSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  destinationSearchClear: {
    paddingLeft: 6,
  },
  destinationSearchInput: {
    flex: 1,
    color: "#0B1E6B",
    fontWeight: "600",
    paddingVertical: 0,
  },
  destinationItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  destinationItemText: {
    color: "#1A2351",
    fontWeight: "600",
  },
  destinationEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
  destinationResults: {
    maxHeight: 200,
  },
  vehicleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E7FF",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  vehiclePicker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    gap: 8,
  },
  vehicleOption: {
    width: 46,
    height: 46,
    borderRadius: 23,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  vehicleOptionActive: {
    backgroundColor: "#0C3AC5",
    borderColor: "#0C3AC5",
  },
  vehicleEmoji: {
    fontSize: 20,
  },
  vehicleEmojiActive: {
    transform: [{ scale: 1.05 }],
  },
  locationLoading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  locationLoadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    alignItems: "center",
    gap: 6,
  },
  locationLoadingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B1E6B",
  },
  locationLoadingSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
    zIndex: 999,
  },
  overlayCard: {
    borderRadius: 24,
    paddingVertical: 100,
    paddingHorizontal: 20,
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    overflow: "hidden",
  },
  overlayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  overlayPillLogo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  overlayPillText: {
    color: "#0C3AC5",
    fontSize: 22,
    fontWeight: "900",
  },
  overlayLottie: {
    width: 200,
    height: 96,
    marginTop: 2,
    alignSelf: "center",
  },
  overlayText: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "left",
    lineHeight: 30,
  },
  overlayCta: {
    fontSize: 16,
    color: "#F8FAFC",
    fontWeight: "700",
    textAlign: "center",
  },
  routeMarkerStart: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  routeMarkerZone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  routeMarkerFinish: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  vehicleTooltip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0B1E6B",
  },
  vehicleTooltipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
