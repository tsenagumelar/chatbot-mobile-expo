import SpeedMeter from "@/src/components/SpeedMeter";
import { getTrafficInfo } from "@/src/services/api";
import { useStore } from "@/src/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

export default function HomeScreen() {
  const {
    location,
    speed,
    address,
    traffic,
    setLocation,
    setSpeed,
    setAddress,
    setTraffic,
    setTrafficLoading,
  } = useStore();

  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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

    // Reverse geocode
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
    } catch (err) {
      console.error("Geocode error:", err);
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
    } catch (err) {
      Alert.alert("Error", "Failed to refresh location");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💬 Chat Assistant</Text>
          <TouchableOpacity
            onPress={refreshLocation}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, isTracking && styles.statusActive]}
            />
            <Text style={styles.statusText}>
              {isTracking ? "Tracking Active" : "Not Tracking"}
            </Text>
          </View>
          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Location Card */}
        <View style={styles.card}>
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
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8E8E93",
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: "#34C759",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  lastUpdate: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
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
});
