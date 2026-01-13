import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import useRoutesScreen from "./hooks";

export default function MapZonesAndRestRoute() {
  const {
    mapRef,
    userLoc,
    route,
    loadingRoute,
    areas,
    restArea,
    initialRegion,
    onPressRestRoute,
    centroid,
  } = useRoutesScreen();

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        initialRegion={initialRegion}
      >
        {userLoc && (
          <Marker coordinate={userLoc} title="Lokasi Kamu">
            <View style={styles.userMarker}>
              <View style={styles.userDot} />
            </View>
          </Marker>
        )}

        {restArea && (
          <Marker coordinate={restArea.coord} title={restArea.name}>
            <View style={styles.restMarker}>
              <Text style={styles.restIcon}>🅿️</Text>
            </View>
          </Marker>
        )}

        {areas.map((area) => {
          const center = centroid(area.coords);
          const fill =
            area.kind === "danger"
              ? "rgba(255,140,0,0.25)"
              : "rgba(0,122,255,0.18)";
          const stroke =
            area.kind === "danger"
              ? "rgba(255,140,0,0.9)"
              : "rgba(0,122,255,0.9)";
          return (
            <React.Fragment key={area.id}>
              <Polygon
                coordinates={area.coords}
                fillColor={fill}
                strokeColor={stroke}
                strokeWidth={2}
              />
              <Marker coordinate={center} title={area.name}>
                {area.kind === "danger" ? (
                  <View style={styles.dangerMarker}>
                    <Text style={styles.dangerIcon}>⚠️</Text>
                  </View>
                ) : (
                  <View style={styles.schoolMarker}>
                    <Text style={styles.schoolIcon}>🏫</Text>
                  </View>
                )}
              </Marker>
            </React.Fragment>
          );
        })}

        {route && (
          <Polyline
            coordinates={route}
            strokeWidth={5}
            strokeColor="rgba(0,122,255,0.95)"
          />
        )}
      </MapView>

      <View style={styles.routeButtonContainer}>
        <TouchableOpacity
          style={styles.routeButton}
          onPress={onPressRestRoute}
          disabled={loadingRoute}
        >
          {loadingRoute ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.routeButtonText}>Rute ke Rest Area</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2563EB",
  },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },
  restMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#16A34A",
  },
  restIcon: {
    fontSize: 16,
  },
  dangerMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  dangerIcon: {
    fontSize: 16,
  },
  schoolMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  schoolIcon: {
    fontSize: 16,
  },
  routeButtonContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  routeButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 180,
    alignItems: "center",
  },
  routeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
