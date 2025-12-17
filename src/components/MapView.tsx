import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import type { LocationData } from "../types";
import { COLORS, DEFAULT_MAP_TILE } from "../utils/constants";

interface MapComponentProps {
  location: LocationData | null;
  onMapReady?: () => void;
  tileUrl?: string;
}

export default function MapComponent({
  location,
  onMapReady,
  tileUrl = DEFAULT_MAP_TILE,
}: MapComponentProps) {
  const mapRef = useRef<MapView>(null);

  // Center map on location when it changes
  useEffect(() => {
    if (location && mapRef.current) {
      // Validate coordinates
      if (
        isFinite(location.latitude) &&
        isFinite(location.longitude) &&
        location.latitude >= -90 &&
        location.latitude <= 90 &&
        location.longitude >= -180 &&
        location.longitude <= 180
      ) {
        mapRef.current.animateToRegion(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }
    }
  }, [location?.latitude, location?.longitude]);

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsCompass={true}
      showsScale={true}
      loadingEnabled={true}
      onMapReady={onMapReady}
      mapType={Platform.OS === "android" ? "none" : "standard"} // Use 'none' to enable custom tiles
    >
      {/* OpenStreetMap Tiles - FREE! */}
      <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} zIndex={-1} />

      {/* User location marker */}
      <Marker
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        title="Lokasi Anda"
        description={`Kecepatan: ${Math.round(
          (location.speed || 0) * 3.6
        )} km/h`}
        pinColor={COLORS.PRIMARY}
      >
        {/* Custom car icon marker */}
        <View style={styles.markerContainer}>
          <View style={styles.carMarker}>
            <View style={styles.carIcon} />
          </View>
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  carMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  carIcon: {
    width: 20,
    height: 20,
    backgroundColor: "white",
    borderRadius: 4,
  },
});
