import { getRoutesByAddress, searchLocation } from "@/src/services/api";
import { useStore } from "@/src/store/useStore";
import type { RouteData } from "@/src/types";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
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
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

export default function RoutesScreen() {
  const { location, routes, routesLoading, setRoutes, setRoutesLoading } =
    useStore();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());

  // Autocomplete states
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    { name: string; lat: number; lon: number }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  // Debounce search for destination
  useEffect(() => {
    if (destination.length < 3) {
      setDestinationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocation(destination);
      setDestinationSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [destination]);

  const handleSuggestionSelect = (suggestion: {
    name: string;
    lat: number;
    lon: number;
  }) => {
    setDestination(suggestion.name);
    setSelectedDestination({ lat: suggestion.lat, lon: suggestion.lon });
    setShowSuggestions(false);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedDestination({ lat: latitude, lon: longitude });
    setDestination(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    if (!destination.trim()) {
      Alert.alert("Error", "Masukkan tujuan Anda");
      return;
    }

    if (!useCurrentLocation && !origin.trim()) {
      Alert.alert("Error", "Masukkan lokasi asal");
      return;
    }

    if (useCurrentLocation && !location) {
      Alert.alert("Error", "Lokasi belum tersedia. Tunggu sebentar.");
      return;
    }

    setRoutesLoading(true);
    setRoutes([]);

    try {
      // If using current location, format coordinates as string
      const originText = useCurrentLocation && location
        ? `${location.latitude},${location.longitude}`
        : origin;

      // If destination was selected from map/autocomplete, use coordinates
      // Otherwise use the text input
      let destinationText = destination;
      if (selectedDestination) {
        // Use coordinates format that backend expects
        destinationText = `${selectedDestination.lat},${selectedDestination.lon}`;
      }

      console.log("🔍 Searching routes:", {
        origin: originText,
        destination: destinationText,
        useCurrentLocation,
        hasSelectedDestination: !!selectedDestination,
      });

      const response = await getRoutesByAddress(originText, destinationText);

      console.log("📍 Routes response:", response);

      setRoutes(response.routes);

      if (response.routes.length === 0) {
        Alert.alert("Info", "Tidak ada rute yang ditemukan");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal mencari rute");
      console.error("❌ Route search error:", error);
    } finally {
      setRoutesLoading(false);
    }
  };

  const toggleRouteExpansion = (index: number) => {
    setExpandedRoutes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const renderRoute = (route: RouteData, index: number) => {
    const trafficColor =
      route.traffic_condition === "light"
        ? COLORS.TRAFFIC_LIGHT
        : route.traffic_condition === "moderate"
        ? COLORS.TRAFFIC_MODERATE
        : COLORS.TRAFFIC_HEAVY;

    const isExpanded = expandedRoutes.has(index);
    const stepsToShow = isExpanded ? route.steps : route.steps?.slice(0, 3);

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

        {route.steps && route.steps.length > 0 && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Langkah-langkah:</Text>
            {stepsToShow.map((step, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={styles.stepBullet} />
                <Text style={styles.stepText}>{step.instruction}</Text>
              </View>
            ))}
            {route.total_steps > 3 && (
              <TouchableOpacity
                style={styles.moreStepsButton}
                onPress={() => toggleRouteExpansion(index)}
              >
                <Text style={styles.moreStepsText}>
                  {isExpanded
                    ? "Sembunyikan detail"
                    : `+${route.total_steps - 3} langkah lainnya`}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={COLORS.PRIMARY}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.searchContainer}>
          <Text style={styles.title}>Cari Rute 🗺️</Text>

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

          <View>
            <View style={styles.inputGroup}>
              <Ionicons name="flag" size={20} color={COLORS.TEXT_SECONDARY} />
              <TextInput
                style={styles.input}
                placeholder="Mau ke mana?"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                value={destination}
                onChangeText={(text) => {
                  setDestination(text);
                  // Clear selected destination when user types
                  if (selectedDestination) {
                    setSelectedDestination(null);
                  }
                }}
                editable={!routesLoading}
                onFocus={() => {
                  if (destinationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {isSearching && (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              )}
              {selectedDestination && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDestination(null);
                    setDestination("");
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>

            {/* Autocomplete Suggestions */}
            {showSuggestions && destinationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {destinationSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionSelect(suggestion)}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={COLORS.PRIMARY}
                    />
                    <Text
                      style={styles.suggestionText}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {suggestion.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

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

        {/* Map View - Always show if location is available */}
        {location && (
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Ionicons name="map" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.mapTitle}>
                {routes.length > 0 ? "Lokasi Rute" : "Lokasi Anda"}
              </Text>
            </View>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                mapType="standard"
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsTraffic={true}
                onPress={handleMapPress}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Location"
                  description="Starting Point"
                  pinColor={COLORS.PRIMARY}
                />
                {selectedDestination && (
                  <Marker
                    coordinate={{
                      latitude: selectedDestination.lat,
                      longitude: selectedDestination.lon,
                    }}
                    title="Destination"
                    description="Tap to select"
                    pinColor="#FF3B30"
                  />
                )}
              </MapView>
            </View>
            <View style={styles.mapHint}>
              <Ionicons
                name={selectedDestination ? "checkmark-circle" : "information-circle"}
                size={16}
                color={selectedDestination ? "#34C759" : COLORS.PRIMARY}
              />
              <Text style={[
                styles.mapHintText,
                selectedDestination && { color: "#34C759" }
              ]}>
                {selectedDestination
                  ? `Tujuan dipilih: ${selectedDestination.lat.toFixed(4)}, ${selectedDestination.lon.toFixed(4)}`
                  : "Tap map untuk memilih lokasi tujuan"}
              </Text>
            </View>
          </View>
        )}

        {routes.length > 0 && (
          <View style={styles.routesContainer}>
            <Text style={styles.routesTitle}>
              {routes.length} Rute Ditemukan
            </Text>
            {routes.map((route, index) => renderRoute(route, index))}
          </View>
        )}

        {!routesLoading && routes.length === 0 && !location && (
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
  moreStepsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E5F1FF",
    borderRadius: 8,
    gap: 6,
  },
  moreStepsText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: "600",
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
  mapCard: {
    backgroundColor: COLORS.CARD,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
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
  suggestionsContainer: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#E5F1FF",
    borderRadius: 8,
    gap: 6,
  },
  mapHintText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
  },
});
