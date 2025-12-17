import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapComponent from "../components/MapView";
import SpeedMeter from "../components/SpeedMeter";
import { getTrafficInfo } from "../services/api";
import {
  calculateSpeedKmh,
  reverseGeocode,
  startLocationTracking,
  stopLocationTracking,
} from "../services/location";
import { useStore } from "../store/useStore";
import { COLORS } from "../utils/constants";

export default function HomeScreen() {
  const {
    location,
    address,
    speed,
    traffic,
    setLocation,
    setAddress,
    setSpeed,
    setTraffic,
    setTrafficLoading,
  } = useStore();

  const [isTracking, setIsTracking] = useState(false);

  // Start location tracking on mount
  useEffect(() => {
    const initLocationTracking = async () => {
      const started = await startLocationTracking((loc) => {
        setLocation(loc);
        const speedKmh = calculateSpeedKmh(loc.speed);
        setSpeed(speedKmh);
      });

      if (started) {
        setIsTracking(true);
      } else {
        Alert.alert(
          "Izin Lokasi",
          "Aplikasi membutuhkan izin lokasi untuk bekerja dengan baik.",
          [{ text: "OK" }]
        );
      }
    };

    initLocationTracking();

    return () => {
      stopLocationTracking();
    };
  }, []);

  // Update address when location changes
  useEffect(() => {
    if (location) {
      reverseGeocode(location.latitude, location.longitude).then(setAddress);
    }
  }, [location?.latitude, location?.longitude]);

  // Fetch traffic info every 30 seconds
  useEffect(() => {
    if (!location) return;

    const fetchTraffic = async () => {
      try {
        setTrafficLoading(true);
        const response = await getTrafficInfo(
          location.latitude,
          location.longitude
        );
        setTraffic(response.traffic);
      } catch (error) {
        console.error("Failed to fetch traffic:", error);
      } finally {
        setTrafficLoading(false);
      }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 30000);

    return () => clearInterval(interval);
  }, [location?.latitude, location?.longitude]);

  const getTrafficColor = () => {
    if (!traffic) return COLORS.TEXT_SECONDARY;
    switch (traffic.condition) {
      case "light":
        return COLORS.TRAFFIC_LIGHT;
      case "moderate":
        return COLORS.TRAFFIC_MODERATE;
      case "heavy":
        return COLORS.TRAFFIC_HEAVY;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <MapComponent location={location} />
      </View>

      {/* Info Overlay */}
      <View style={styles.overlay}>
        {/* Top Info Card */}
        <View style={styles.topCard}>
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.addressText} numberOfLines={2}>
              {address}
            </Text>
          </View>

          {traffic && (
            <View style={styles.trafficInfo}>
              <Text style={styles.trafficLabel}>Traffic:</Text>
              <Text style={[styles.trafficValue, { color: getTrafficColor() }]}>
                {traffic.condition_emoji} {traffic.condition.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Speed Meter */}
        <View style={styles.speedContainer}>
          <SpeedMeter speed={speed} />
        </View>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, isTracking && styles.statusActive]} />
          <Text style={styles.statusText}>
            {isTracking ? "Tracking Active" : "Not Tracking"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  mapContainer: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },
  topCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "500",
  },
  trafficInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  trafficLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginRight: 8,
  },
  trafficValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  speedContainer: {
    position: "absolute",
    right: 16,
    bottom: 100,
  },
  statusContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.TEXT_SECONDARY,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },
});
