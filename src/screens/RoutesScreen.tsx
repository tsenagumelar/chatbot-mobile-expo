import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRoutesByAddress, getRoutesByCoords } from "../services/api";
import { useStore } from "../store/useStore";
import type { RouteData } from "../types";
import { COLORS } from "../utils/constants";

export default function RoutesScreen() {
  const { location, routes, routesLoading, setRoutes, setRoutesLoading } =
    useStore();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  const handleSearch = async () => {
    if (!destination.trim()) {
      Alert.alert("Error", "Masukkan tujuan Anda");
      return;
    }

    setRoutesLoading(true);
    setRoutes([]);

    try {
      let response;

      if (useCurrentLocation && location) {
        // Use current location as origin
        response = await getRoutesByCoords({
          origin_lat: location.latitude,
          origin_lng: location.longitude,
          destination_lat: 0, // Will be geocoded by backend
          destination_lng: 0,
        });

        // Fallback: use address-based search
        response = await getRoutesByAddress("Lokasi Saat Ini", destination);
      } else {
        if (!origin.trim()) {
          Alert.alert("Error", "Masukkan lokasi asal");
          return;
        }
        response = await getRoutesByAddress(origin, destination);
      }

      setRoutes(response.routes);

      if (response.routes.length === 0) {
        Alert.alert("Info", "Tidak ada rute yang ditemukan");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal mencari rute");
      console.error("Route search error:", error);
    } finally {
      setRoutesLoading(false);
    }
  };

  const renderRoute = (route: RouteData, index: number) => {
    const trafficColor =
      route.traffic_condition === "light"
        ? COLORS.TRAFFIC_LIGHT
        : route.traffic_condition === "moderate"
        ? COLORS.TRAFFIC_MODERATE
        : COLORS.TRAFFIC_HEAVY;

    return (
      <View key={index} style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <View style={styles.routeNumber}>
            <Text style={styles.routeNumberText}>{route.route_number}</Text>
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeSummary}>{route.summary}</Text>
            <View style={styles.routeStats}>
              <View style={styles.statItem}>
                <Ionicons
                  name="navigate"
                  size={16}
                  color={COLORS.TEXT_SECONDARY}
                />
                <Text style={styles.statText}>{route.distance}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={COLORS.TEXT_SECONDARY} />
                <Text style={styles.statText}>{route.duration}</Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.trafficBadge,
                    { backgroundColor: trafficColor },
                  ]}
                >
                  {route.condition_emoji}{" "}
                  {route.traffic_condition.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Steps */}
        {route.steps && route.steps.length > 0 && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Langkah-langkah:</Text>
            {route.steps.slice(0, 3).map((step, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={styles.stepBullet} />
                <Text style={styles.stepText}>{step.instruction}</Text>
              </View>
            ))}
            {route.total_steps > 3 && (
              <Text style={styles.moreSteps}>
                +{route.total_steps - 3} langkah lainnya
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        {/* Search Form */}
        <View style={styles.searchContainer}>
          <Text style={styles.title}>Cari Rute 🗺️</Text>

          {/* Current Location Toggle */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setUseCurrentLocation(!useCurrentLocation)}
          >
            <Ionicons
              name={useCurrentLocation ? "checkbox" : "square-outline"}
              size={24}
              color={COLORS.PRIMARY}
            />
            <Text style={styles.toggleText}>Gunakan lokasi saat ini</Text>
          </TouchableOpacity>

          {/* Origin Input */}
          {!useCurrentLocation && (
            <View style={styles.inputGroup}>
              <Ionicons
                name="location"
                size={20}
                color={COLORS.TEXT_SECONDARY}
              />
              <TextInput
                style={styles.input}
                placeholder="Dari mana?"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                value={origin}
                onChangeText={setOrigin}
                editable={!routesLoading}
              />
            </View>
          )}

          {/* Destination Input */}
          <View style={styles.inputGroup}>
            <Ionicons name="flag" size={20} color={COLORS.TEXT_SECONDARY} />
            <TextInput
              style={styles.input}
              placeholder="Mau ke mana?"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              value={destination}
              onChangeText={setDestination}
              editable={!routesLoading}
            />
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={[
              styles.searchButton,
              routesLoading && styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={routesLoading}
          >
            {routesLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="white" />
                <Text style={styles.searchButtonText}>Cari Rute</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Routes List */}
        {routes.length > 0 && (
          <View style={styles.routesContainer}>
            <Text style={styles.routesTitle}>
              {routes.length} Rute Ditemukan
            </Text>
            {routes.map((route, index) => renderRoute(route, index))}
          </View>
        )}

        {/* Empty State */}
        {!routesLoading && routes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="map-outline"
              size={64}
              color={COLORS.TEXT_SECONDARY}
            />
            <Text style={styles.emptyText}>
              Cari rute untuk melihat alternatif perjalanan
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.CARD,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  input: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  routesContainer: {
    padding: 16,
  },
  routesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: "row",
  },
  routeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  routeNumberText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  routeInfo: {
    flex: 1,
  },
  routeSummary: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  trafficBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  stepsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  stepBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.PRIMARY,
    marginTop: 6,
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  moreSteps: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
