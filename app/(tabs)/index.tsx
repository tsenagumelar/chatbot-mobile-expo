/* eslint-disable react-hooks/exhaustive-deps */
import { AppHeader } from "@/src/components/AppHeader";
import SpeedMeter from "@/src/components/SpeedMeter";
import WarningToast from "@/src/components/WarningToast";
import { PDF_LIBRARY } from "@/src/data/pdfLibrary";
import { getTrafficInfo } from "@/src/services/api";
import { useStore } from "@/src/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const LIBRARY_PREVIEW = PDF_LIBRARY.slice(0, 3);

export default function HomeScreen() {
  const {
    location,
    speed,
    address,
    traffic,
    logout,
    setLocation,
    setSpeed,
    setAddress,
    setTraffic,
    setTrafficLoading,
  } = useStore();

  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastGeocodeAt, setLastGeocodeAt] = useState<number>(0);
  const [showWarningToast, setShowWarningToast] = useState(false);

  useEffect(() => {
    startLocationTracking();
  }, []);

  // Fetch traffic every 30 seconds
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
        console.error("Traffic fetch error:", error);
      } finally {
        setTrafficLoading(false);
      }
    };

    const timeout = setTimeout(fetchTraffic, 2000);
    const interval = setInterval(fetchTraffic, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [location?.latitude, location?.longitude]);

  const startLocationTracking = async () => {
    try {
      console.log("🔄 Requesting location permission...");

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission required");
        setMockLocation();
        return;
      }

      console.log("✅ Permission granted, getting location...");

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log("✅ Got location:", position.coords);

      updateLocation(position);
      setIsTracking(true);

      // Start watching (update every 5 seconds)
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 20,
        },
        (pos) => {
          updateLocation(pos);
        }
      );
    } catch (err: any) {
      console.error("❌ Location error:", err);
      Alert.alert("Location Error", "Using mock location for demo");
      setMockLocation();
    }
  };

  const updateLocation = async (position: Location.LocationObject) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      accuracy: position.coords.accuracy ?? 0,
      timestamp: position.timestamp,
    });

    const speedKmh = position.coords.speed ? position.coords.speed * 3.6 : 0;
    setSpeed(Math.round(speedKmh));
    setLastUpdate(new Date());

    // Reverse geocode (throttled to avoid rate limits)
    const now = Date.now();
    if (now - lastGeocodeAt > 30000) {
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          const formatted = [addr.street, addr.city, addr.region, addr.country]
            .filter(Boolean)
            .join(", ");
          setAddress(formatted || "Unknown Location");
        }
        setLastGeocodeAt(now);
      } catch (err) {
        console.error("Geocode error:", err);
      }
    }
  };

  const setMockLocation = () => {
    setLocation({
      latitude: -6.9175,
      longitude: 107.6191,
      speed: 15,
      heading: 0,
      accuracy: 10,
      timestamp: Date.now(),
    });
    setSpeed(54);
    setAddress("Bandung, West Java, Indonesia (Mock)");
    setIsTracking(true);
  };

  const getTrafficColor = () => {
    if (!traffic) return "#8E8E93";
    switch (traffic.condition) {
      case "light":
        return "#34C759";
      case "moderate":
        return "#FF9500";
      case "heavy":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const refreshLocation = async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      updateLocation(position);
    } catch {
      Alert.alert("Error", "Failed to refresh location");
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleLocationCardPress = () => {
    setShowWarningToast(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Warning Toast */}
      <WarningToast
        visible={showWarningToast}
        onHide={() => setShowWarningToast(false)}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <AppHeader onLogout={handleLogout} />

        {/* Quick stats */}
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

        {/* Refresh row replaces old status */}
        <View style={styles.refreshRow}>
          <Text style={styles.subGreeting}>Perbarui data lokasi & lalu lintas</Text>
          <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color="#0B57D0" />
          </TouchableOpacity>
        </View>

        {/* Location Card */}
        <TouchableOpacity style={styles.card} onPress={handleLocationCardPress} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Current Location</Text>
          </View>
          <Text style={styles.addressText}>{address}</Text>
          {location && (
            <Text style={styles.coordsText}>
              📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          )}
          <Text style={styles.accuracyText}>
            Accuracy: ±{location?.accuracy?.toFixed(0) || "N/A"}m
          </Text>
        </TouchableOpacity>

        {/* Speed Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Speed Monitor</Text>
          </View>
          <View style={styles.speedMeterContainer}>
            <SpeedMeter speed={speed} />
          </View>
        </View>

        {/* Traffic Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Traffic Condition</Text>
          </View>
          {traffic ? (
            <>
              <View style={styles.trafficRow}>
                <Text
                  style={[
                    styles.trafficBadge,
                    { backgroundColor: getTrafficColor() },
                  ]}
                >
                  {traffic.condition_emoji} {traffic.condition.toUpperCase()}
                </Text>
              </View>
              <View style={styles.trafficDetails}>
                <View style={styles.trafficItem}>
                  <Ionicons name="navigate" size={16} color="#8E8E93" />
                  <Text style={styles.trafficLabel}>
                    Distance: {traffic.distance}
                  </Text>
                </View>
                <View style={styles.trafficItem}>
                  <Ionicons name="time" size={16} color="#8E8E93" />
                  <Text style={styles.trafficLabel}>
                    Duration: {traffic.duration}
                  </Text>
                </View>
                {traffic.avg_speed && (
                  <View style={styles.trafficItem}>
                    <Ionicons name="speedometer" size={16} color="#8E8E93" />
                    <Text style={styles.trafficLabel}>
                      Avg Speed: {traffic.avg_speed}
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>Loading traffic info...</Text>
          )}
        </View>

        {/* Map View */}
        {location && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="map" size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Map View</Text>
            </View>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
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
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Location"
                  description={address}
                  pinColor="#007AFF"
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Library Section */}
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
              onPress={() => router.push({ pathname: "/pdf-viewer", params: { id: pdf.id } })}
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

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push("/library")}
          >
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  coordsText: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  speedMeterContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  trafficRow: {
    marginBottom: 12,
  },
  trafficBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  trafficDetails: {
    gap: 8,
  },
  trafficItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  trafficLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
  },
  noDataText: {
    fontSize: 14,
    color: "#8E8E93",
    fontStyle: "italic",
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 12,
    backgroundColor: "#E5F1FF",
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#007AFF",
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  librarySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 12,
  },
  pdfItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pdfIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  pdfDescription: {
    fontSize: 13,
    color: "#8E8E93",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#E8F0FE",
    borderRadius: 12,
    gap: 8,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#007AFF",
  },
});
