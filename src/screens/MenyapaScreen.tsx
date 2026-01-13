import { AppHeader } from "@/src/components/AppHeader";
import { startLocationTracking, stopLocationTracking } from "@/src/services/location";
import notifData from "@/src/services/notif.json";
import { useStore } from "@/src/store/useStore";
import { sanitizeSpeechText } from "@/src/utils/speech";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MenyapaScreen() {
  const {
    location,
    onboarding,
    setOnboarding,
    setLocation,
    setSpeed,
    setLocationPermission,
    logout,
    notificationIntervalSeconds,
  } = useStore();
  const mapRef = useRef<MapView>(null);
  const [zoomDelta, setZoomDelta] = useState(0.01);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [hotspotCenter, setHotspotCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [hotspotRadius, setHotspotRadius] = useState(120);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const latestLocationRef = useRef(location);
  const activeVehicleRef = useRef(onboarding.primary_vehicle);
  const simulatedLocationRef = useRef(location);
  const moveCounterRef = useRef(0);
  const notifIndexRef = useRef<Record<string, number>>({});
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [typedOverlayText, setTypedOverlayText] = useState("");
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayTypingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vehicleOptions = useMemo(
    () => [
      { value: "motor", label: "Motor", icon: "speedometer" as const },
      { value: "mobil", label: "Mobil", icon: "car" as const },
      { value: "sepeda", label: "Sepeda", icon: "bicycle" as const },
      { value: "public", label: "Angkutan Umum", icon: "bus" as const },
      { value: "walk", label: "Jalan Kaki", icon: "walk" as const },
    ],
    []
  );
  const activeVehicle =
    vehicleOptions.find((option) => option.value === onboarding.primary_vehicle) ??
    vehicleOptions[0];

  useEffect(() => {
    let isActive = true;
    let hasInitial = false;

    const startTracking = async () => {
      const started = await startLocationTracking((nextLocation) => {
        if (!isActive) return;
        setLocation(nextLocation);
        setSpeed(Math.max(0, Math.round((nextLocation.speed ?? 0) * 3.6)));
        setIsLocationReady(true);
        if (!hasInitial) {
          hasInitial = true;
          stopLocationTracking();
        }
      });
      if (isActive) {
        setLocationPermission(started);
      }
    };

    startTracking();
    return () => {
      isActive = false;
      stopLocationTracking();
    };
  }, [setLocation, setLocationPermission, setSpeed]);

  useEffect(() => {
    latestLocationRef.current = location;
  }, [location]);

  useEffect(() => {
    activeVehicleRef.current = onboarding.primary_vehicle;
  }, [onboarding.primary_vehicle]);

  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      },
      400
    );
  }, [location, zoomDelta]);

  useEffect(() => {
    if (!showOverlay) return;

    setTypedOverlayText("");
    let index = 0;
    const durationMs = Math.max(1000, (notificationIntervalSeconds - 10) * 1000);
    const typingInterval = 80;
    if (overlayTypingRef.current) {
      clearInterval(overlayTypingRef.current);
    }
    overlayTypingRef.current = setInterval(() => {
      index += 1;
      setTypedOverlayText(overlayText.slice(0, index));
      if (index >= overlayText.length) {
        if (overlayTypingRef.current) {
          clearInterval(overlayTypingRef.current);
          overlayTypingRef.current = null;
        }
      }
    }, typingInterval);

    const speechText = sanitizeSpeechText(overlayText);
    Speech.stop();
    Speech.speak(speechText, {
      language: "id-ID",
      rate: 0.85,
      pitch: 1.05,
    });

    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlay(false);
    }, durationMs);

    return () => {
      if (overlayTypingRef.current) {
        clearInterval(overlayTypingRef.current);
        overlayTypingRef.current = null;
      }
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
    };
  }, [notificationIntervalSeconds, overlayText, showOverlay]);

  useEffect(() => {
    if (!isLocationReady) return;
    const interval = setInterval(() => {
      const base =
        simulatedLocationRef.current ??
        latestLocationRef.current ?? {
          latitude: -6.914744,
          longitude: 107.60981,
          accuracy: 10,
          heading: 0,
          speed: 0,
          timestamp: Date.now(),
        };
      const deltaLat = (Math.random() - 0.5) * 0.0006;
      const deltaLng = (Math.random() - 0.5) * 0.0006;
      const nextLocation = {
        ...base,
        latitude: base.latitude + deltaLat,
        longitude: base.longitude + deltaLng,
        timestamp: Date.now(),
      };
      simulatedLocationRef.current = nextLocation;
      setLocation(nextLocation);
      moveCounterRef.current += 1;

      const intervalSeconds = Math.max(2, notificationIntervalSeconds);
      const steps = Math.max(1, Math.round(intervalSeconds / 2));
      if (moveCounterRef.current % steps === 0) {
        const rawVehicle = activeVehicleRef.current ?? "motor";
        const vehicle =
          rawVehicle === "public" ? "angkutan_umum" : rawVehicle;
        const candidates = (notifData as any[]).filter(
          (item) => Array.isArray(item.pengguna) && item.pengguna.includes(vehicle)
        );
        if (!candidates.length) return;
        const nextIndex =
          (notifIndexRef.current[vehicle] ?? 0) % candidates.length;
        const notifItem = candidates[nextIndex];
        notifIndexRef.current[vehicle] = nextIndex + 1;

        if (latestLocationRef.current) {
          setHotspotCenter({
            latitude: latestLocationRef.current.latitude,
            longitude: latestLocationRef.current.longitude,
          });
          setHotspotRadius(120 + Math.floor(Math.random() * 60));
        }
        setOverlayText(notifItem.message);
        setShowOverlay(true);

        Notifications.scheduleNotificationAsync({
          content: {
            title: notifItem.title,
            subtitle: notifItem.kategori,
            body: notifItem.message,
              data: {
              id: notifItem.id,
              kategori: notifItem.kategori,
              trigger: notifItem.trigger,
              data_utama: notifItem.data_utama,
              pengguna: notifItem.pengguna,
              icon: notifItem.icon,
              color: notifItem.color,
              cta: notifItem.cta,
              voiceText: notifItem.message,
            },
          },
          trigger: null,
        }).catch(() => null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLocationReady, notificationIntervalSeconds, setLocation]);

  const handleZoom = (direction: "in" | "out") => {
    const nextDelta =
      direction === "in"
        ? Math.max(0.0025, zoomDelta * 0.7)
        : Math.min(0.08, zoomDelta * 1.4);
    setZoomDelta(nextDelta);
    mapRef.current?.animateToRegion(
      {
        latitude: location?.latitude ?? -6.914744,
        longitude: location?.longitude ?? 107.60981,
        latitudeDelta: nextDelta,
        longitudeDelta: nextDelta,
      },
      250
    );
  };

  const handleFocusLocation = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: location?.latitude ?? -6.914744,
        longitude: location?.longitude ?? 107.60981,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      },
      300
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <AppHeader
          onLogout={() => {
            logout();
            router.replace("/onboarding");
          }}
        />
      </View>
      <View style={styles.mapWrapper}>
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
          showsUserLocation={Boolean(location)}
          showsMyLocationButton={Boolean(location)}
          showsCompass={true}
          showsScale={true}
        >
          {hotspotCenter && showOverlay && (
            <Circle
              center={hotspotCenter}
              radius={hotspotRadius}
              fillColor="rgba(12, 58, 197, 0.12)"
              strokeColor="rgba(12, 58, 197, 0.45)"
              strokeWidth={2}
            />
          )}
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Lokasi Anda"
            />
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
          {showVehiclePicker && (
            <View style={styles.vehiclePicker}>
              {vehicleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.vehicleOption,
                    option.value === activeVehicle.value &&
                      styles.vehicleOptionActive,
                  ]}
                  onPress={() => {
                    setOnboarding({ primary_vehicle: option.value });
                    setShowVehiclePicker(false);
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={
                      option.value === activeVehicle.value
                        ? "#FFFFFF"
                        : "#0B1E6B"
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.vehicleButton}
            onPress={() => setShowVehiclePicker((prev) => !prev)}
            activeOpacity={0.9}
          >
            <Ionicons name={activeVehicle.icon} size={20} color="#0B1E6B" />
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
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <View style={styles.overlayBadgeRow}>
              <View style={styles.overlayBadge}>
                <Ionicons name="radio" size={14} color="#0C3AC5" />
                <Text style={styles.overlayBadgeText}>Polantas Menyapa</Text>
                <Image
                  source={require("@/assets/images/Polantas Logo.png")}
                  style={styles.overlayBadgeLogo}
                />
              </View>
            </View>
            <LottieView
              source={require("@/src/services/voice.json")}
              autoPlay
              loop
              style={styles.overlayLottie}
            />
            <Text style={styles.overlayText}>{typedOverlayText}</Text>
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
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    justifyContent: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  overlayCard: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#DDE7FF",
    shadowColor: "#0B1E6B",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  overlayBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overlayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  overlayBadgeLogo: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  overlayBadgeText: {
    color: "#0C3AC5",
    fontSize: 11,
    fontWeight: "700",
  },
  overlayLottie: {
    width: 110,
    height: 110,
    marginTop: -40,
    marginBottom: -40,
  },
  overlayText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
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
