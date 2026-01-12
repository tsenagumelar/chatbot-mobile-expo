import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

type LatLng = { latitude: number; longitude: number };

function offsetLatLng(origin: LatLng, northMeters: number, eastMeters: number): LatLng {
  const dLat = northMeters / 111_320;
  const dLng = eastMeters / (111_320 * Math.cos((origin.latitude * Math.PI) / 180));
  return { latitude: origin.latitude + dLat, longitude: origin.longitude + dLng };
}

function squarePolygon(center: LatLng, halfSizeMeters: number): LatLng[] {
  return [
    offsetLatLng(center, +halfSizeMeters, -halfSizeMeters),
    offsetLatLng(center, +halfSizeMeters, +halfSizeMeters),
    offsetLatLng(center, -halfSizeMeters, +halfSizeMeters),
    offsetLatLng(center, -halfSizeMeters, -halfSizeMeters),
  ];
}

function centroid(coords: LatLng[]): LatLng {
  let lat = 0, lng = 0;
  coords.forEach(p => { lat += p.latitude; lng += p.longitude; });
  return { latitude: lat / coords.length, longitude: lng / coords.length };
}

// decode polyline (Google polyline format) -> LatLng[]
function decodePolyline(encoded: string): LatLng[] {
  let index = 0, lat = 0, lng = 0;
  const coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coordinates;
}

async function fetchRouteOSRM(from: LatLng, to: LatLng): Promise<LatLng[]> {
  // OSRM format: lon,lat
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=polyline`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal mengambil rute");
  const json = await res.json();

  const encoded = json?.routes?.[0]?.geometry;
  if (!encoded) throw new Error("Rute tidak ditemukan");
  return decodePolyline(encoded);
}

export default function MapZonesAndRestRoute() {
  const mapRef = useRef<MapView>(null);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newUserLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLoc(newUserLoc);
      
      // Fokus langsung ke lokasi user
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: newUserLoc,
          zoom: 15,
        }, { duration: 1000 });
      }
    })();
  }, []);

  const areas = useMemo(() => {
    if (!userLoc) return [];

    const dangerCenter = offsetLatLng(userLoc, +250, +120);
    const schoolCenter = offsetLatLng(userLoc, -150, -200);

    return [
      { id: "rawan", name: "Rawan Kecelakaan", kind: "danger" as const, coords: squarePolygon(dangerCenter, 120) },
      { id: "sekolah", name: "Zona Sekolah", kind: "school" as const, coords: squarePolygon(schoolCenter, 90) },
    ];
  }, [userLoc]);

  const restArea = useMemo(() => {
    if (!userLoc) return null;
    // contoh: rest area 400m ke timur dan 80m ke utara dari user
    return {
      id: "rest-1",
      name: "Rest Area Terdekat",
      coord: offsetLatLng(userLoc, +80, +400),
    };
  }, [userLoc]);

  const initialRegion = {
    latitude: userLoc?.latitude ?? -6.2,
    longitude: userLoc?.longitude ?? 106.8,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const onPressRestRoute = async () => {
    if (!userLoc || !restArea) return;
    try {
      setLoadingRoute(true);
      const pts = await fetchRouteOSRM(userLoc, restArea.coord);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView 
        ref={mapRef}
        style={{ flex: 1 }} 
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        initialRegion={initialRegion}
      >

        {/* User location dengan icon khusus (biru) */}
        {userLoc && (
          <Marker coordinate={userLoc} title="Lokasi Kamu">
            <View style={styles.userMarker}>
              <View style={styles.userDot} />
            </View>
          </Marker>
        )}

        {/* Rest area dengan icon khusus (hijau) */}
        {restArea && (
          <Marker coordinate={restArea.coord} title={restArea.name}>
            <View style={styles.restMarker}>
              <Text style={styles.restIcon}>🅿️</Text>
            </View>
          </Marker>
        )}

        {areas.map(a => {
          const c = centroid(a.coords);
          const fill = a.kind === "danger" ? "rgba(255,140,0,0.25)" : "rgba(0,122,255,0.18)";
          const stroke = a.kind === "danger" ? "rgba(255,140,0,0.9)" : "rgba(0,122,255,0.9)";
          return (
            <React.Fragment key={a.id}>
              <Polygon coordinates={a.coords} fillColor={fill} strokeColor={stroke} strokeWidth={2} />
              {/* Marker dengan icon berbeda per tipe */}
              <Marker coordinate={c} title={a.name}>
                {a.kind === "danger" ? (
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

      {/* Panel tombol sederhana */}
      <View style={styles.panel}>
        <TouchableOpacity
          style={[styles.btn, loadingRoute && { opacity: 0.6 }]}
          disabled={loadingRoute}
          onPress={onPressRestRoute}
        >
          <Text style={styles.btnText}>
            {loadingRoute ? "Mencari rute..." : "Rest Area Terdekat"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} onPress={() => setRoute(null)}>
          <Text style={styles.btnGhostText}>Hapus Rute</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 16, right: 16, bottom: 18,
    gap: 10,
  },
  btn: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  btnText: { fontWeight: "800", color: "#0A285A" },
  btnGhost: {
    backgroundColor: "rgba(10,40,90,0.9)",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  btnGhostText: { fontWeight: "800", color: "white" },
  // Icon markers
  userMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
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
  userDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
  },
  dangerMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF8C00",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  dangerIcon: {
    fontSize: 20,
  },
  schoolMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  schoolIcon: {
    fontSize: 18,
  },
  restMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#34C759",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  restIcon: {
    fontSize: 22,
  },
});