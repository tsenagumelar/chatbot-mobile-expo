/* eslint-disable react-hooks/exhaustive-deps */
import { AppHeader } from "@/src/components/AppHeader";
import WarningToast from "@/src/components/WarningToast";
import { PDF_LIBRARY } from "@/src/data/pdfLibrary";
import { getTrafficInfo } from "@/src/services/api";
import { useStore } from "@/src/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, {
    Marker,
    Polygon,
    Polyline,
    PROVIDER_DEFAULT,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const LIBRARY_PREVIEW = PDF_LIBRARY.slice(0, 3);

const SAFETY_NOTIFICATIONS = [
  {
    icon: "warning" as const,
    title: "Area Rawan Kecelakaan",
    message:
      "Waspada ya Sobat! Kamu sedang melewati area rawan kecelakaan. Di lokasi ini sering terjadi tabrakan karena kecepatan tinggi. Yuk, kurangi laju kendaraan dan tetap fokus. Keselamatanmu nomor satu!\n👉 Mau saya tampilkan rute alternatif yang lebih aman dari lokasi kamu sekarang?",
    color: "#F59E0B",
  },
  {
    icon: "alert-circle" as const,
    title: "Riwayat Kecelakaan Beruntun",
    message:
      "Sobat, hati-hati ya. Jalur yang kamu lewati memiliki riwayat kecelakaan beruntun. Jaga jarak aman dan patuhi rambu di sekitar.\n👉 Perlu saya ingatkan jarak aman berkendara sesuai kecepatan kamu saat ini?",
    color: "#EF4444",
  },
  {
    icon: "rainy" as const,
    title: "Hujan & Jalan Licin",
    message:
      "Halo Sobat! Saat ini cuaca hujan dan jalanan licin. Kurangi kecepatan dan hindari pengereman mendadak ya.\n👉 Mau saya aktifkan mode berkendara aman saat hujan?",
    color: "#3B82F6",
  },
  {
    icon: "water" as const,
    title: "Rawan Genangan / Banjir",
    message:
      "Sobat, di jalur ini sering terjadi genangan saat hujan deras. Tetap waspada dan perhatikan kondisi jalan.\n👉 Perlu saya carikan jalur alternatif yang minim genangan?",
    color: "#0EA5E9",
  },
  {
    icon: "construct" as const,
    title: "Rekayasa Lalu Lintas",
    message:
      "Info Sobat! Saat ini sedang diberlakukan rekayasa lalu lintas di sekitar lokasi kamu. Ikuti rambu dan petunjuk ya.\n👉 Mau saya arahkan ke jalur yang sudah disesuaikan dengan rekayasa lalu lintas ini?",
    color: "#F59E0B",
  },
  {
    icon: "close-circle" as const,
    title: "Penutupan Jalan",
    message:
      "Perhatian Sobat! Jalan di depan ditutup sementara. Tenang, kamu tetap bisa lanjut dengan aman.\n👉 Mau saya carikan rute alternatif tercepat dari posisi kamu sekarang?",
    color: "#DC2626",
  },
  {
    icon: "speedometer" as const,
    title: "Kecepatan Terlalu Tinggi",
    message:
      "Sobat, kecepatan kamu terdeteksi cukup tinggi di area padat. Yuk, kurangi laju kendaraan demi keselamatan bersama.\n👉 Perlu saya ingatkan batas kecepatan maksimal di jalan ini?",
    color: "#EF4444",
  },
  {
    icon: "time" as const,
    title: "Jam Rawan Kecelakaan",
    message:
      "Halo Sobat! Kamu sedang berkendara di jam rawan kecelakaan. Tetap fokus dan jaga jarak aman ya.\n👉 Mau saya aktifkan pengingat keselamatan selama perjalanan ini?",
    color: "#F59E0B",
  },
  {
    icon: "bed" as const,
    title: "Potensi Mengantuk",
    message:
      "Sobat, kamu sudah berkendara cukup lama. Jika merasa mengantuk, jangan dipaksakan ya.\n👉 Mau saya carikan rest area terdekat untuk istirahat?",
    color: "#8B5CF6",
  },
  {
    icon: "car" as const,
    title: "Perjalanan Jarak Jauh",
    message:
      "Perjalanan jauh terdeteksi, Sobat. Istirahat rutin bisa mencegah kecelakaan.\n👉 Perlu saya atur pengingat istirahat setiap 2 jam?",
    color: "#06B6D4",
  },
  {
    icon: "shield-checkmark" as const,
    title: "Pengingat Helm & Sabuk Pengaman",
    message:
      "Sedikit pengingat ya Sobat 😊 Helm dan sabuk pengaman bukan sekadar aturan, tapi pelindung utama di jalan.\n👉 Mau saya jelaskan risiko kecelakaan tanpa perlengkapan keselamatan?",
    color: "#10B981",
  },
  {
    icon: "happy" as const,
    title: "Ajakan Positif",
    message:
      "Terima kasih sudah tertib berlalu lintas, Sobat! Perjalanan aman dimulai dari kepatuhan kita bersama.\n👉 Mau saya kirimkan tips keselamatan singkat sesuai rute perjalanan kamu?",
    color: "#10B981",
  },
];

type LatLng = { latitude: number; longitude: number };

function offsetLatLng(
  origin: LatLng,
  northMeters: number,
  eastMeters: number
): LatLng {
  const dLat = northMeters / 111_320;
  const dLng =
    eastMeters / (111_320 * Math.cos((origin.latitude * Math.PI) / 180));
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
  let lat = 0;
  let lng = 0;
  coords.forEach((p) => {
    lat += p.latitude;
    lng += p.longitude;
  });
  return { latitude: lat / coords.length, longitude: lng / coords.length };
}

function decodePolyline(encoded: string): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coordinates;
}

async function fetchRouteOSRM(from: LatLng, to: LatLng): Promise<LatLng[]> {
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

export default function HomeScreen() {
  const {
    location,
    speed,
    address,
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
  const [currentNotification, setCurrentNotification] = useState(
    SAFETY_NOTIFICATIONS[0]
  );
  const [showModePicker, setShowModePicker] = useState(false);
  const [selectedMode, setSelectedMode] = useState<
    "Mobil" | "Motor" | "Sepeda" | "Jalan Kaki" | "Kereta"
  >("Mobil");
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);

  const transportModes: {
    label: "Mobil" | "Motor" | "Sepeda" | "Jalan Kaki" | "Kereta";
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { label: "Mobil", icon: "car" },
    { label: "Motor", icon: "speedometer" },
    { label: "Sepeda", icon: "bicycle" },
    { label: "Jalan Kaki", icon: "walk" },
    { label: "Kereta", icon: "train" },
  ];

  const userCoord = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null;

  const areas = useMemo(() => {
    if (!userCoord) return [];

    const dangerCenter = offsetLatLng(userCoord, +250, +120);
    const schoolCenter = offsetLatLng(userCoord, -150, -200);

    return [
      {
        id: "rawan",
        name: "Rawan Kecelakaan",
        kind: "danger" as const,
        coords: squarePolygon(dangerCenter, 120),
      },
      {
        id: "sekolah",
        name: "Zona Sekolah",
        kind: "school" as const,
        coords: squarePolygon(schoolCenter, 90),
      },
    ];
  }, [userCoord?.latitude, userCoord?.longitude]);

  const restArea = useMemo(() => {
    if (!userCoord) return null;
    return {
      id: "rest-1",
      name: "Rest Area Terdekat",
      coord: offsetLatLng(userCoord, +80, +400),
    };
  }, [userCoord?.latitude, userCoord?.longitude]);

  const schoolArea = useMemo(
    () => areas.find((area) => area.kind === "school") ?? null,
    [areas]
  );
  const dangerArea = useMemo(
    () => areas.find((area) => area.kind === "danger") ?? null,
    [areas]
  );
  const safeDestination = useMemo(() => {
    if (!dangerArea) return null;
    const dangerCenter = centroid(dangerArea.coords);
    return offsetLatLng(dangerCenter, +300, 0);
  }, [dangerArea]);

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
    const randomIndex = Math.floor(Math.random() * SAFETY_NOTIFICATIONS.length);
    setCurrentNotification(SAFETY_NOTIFICATIONS[randomIndex]);
    setShowWarningToast(true);
  };

  const onPressRestRoute = async () => {
    if (!userCoord || !restArea) return;
    try {
      setLoadingRoute(true);
      const pts = await fetchRouteOSRM(userCoord, restArea.coord);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const onPressSchoolRoute = async () => {
    if (!userCoord || !schoolArea) return;
    try {
      setLoadingRoute(true);
      const schoolCenter = centroid(schoolArea.coords);
      const pts = await fetchRouteOSRM(userCoord, schoolCenter);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const onPressSafeRoute = async () => {
    if (!userCoord || !safeDestination) return;
    try {
      setLoadingRoute(true);
      const pts = await fetchRouteOSRM(userCoord, safeDestination);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Overlay Background */}
      {showWarningToast && <View style={styles.notificationOverlay} />}

      {/* Warning Toast */}
      <WarningToast
        visible={showWarningToast}
        onHide={() => setShowWarningToast(false)}
        icon={currentNotification.icon}
        title={currentNotification.title}
        message={currentNotification.message}
        color={currentNotification.color}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
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
              <Text style={styles.quickValue}>
                {isTracking ? "Aktif" : "Idle"}
              </Text>
            </View>
          </View>
          <View style={styles.quickCard}>
            <View
              style={[styles.quickIconWrapper, { backgroundColor: "#FFF4E5" }]}
            >
              <Ionicons name="speedometer" size={18} color="#FB923C" />
            </View>
            <View>
              <Text style={styles.quickLabel}>Kecepatan</Text>
              <Text style={styles.quickValue}>
                {speed > 0 ? speed : 0} km/j
              </Text>
            </View>
          </View>
          <View style={styles.quickCard}>
            <View
              style={[styles.quickIconWrapper, { backgroundColor: "#E4F8ED" }]}
            >
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

        {/* Location Card */}
        <TouchableOpacity
          style={styles.locationCard}
          onPress={handleLocationCardPress}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.cardTitle}>Current Location</Text>
            <View style={styles.notifBadge}>
              <TouchableOpacity
                onPress={refreshLocation}
                style={styles.refreshButton}
              >
                <Ionicons name="refresh" size={22} color="#0B57D0" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.addressText}>{address}</Text>
          <View style={styles.coordsRow}>
            {location && (
              <Text style={styles.coordsText}>
                📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
            )}
            <Text style={styles.accuracyTextInline}>
              ±{location?.accuracy?.toFixed(0) || "N/A"}m
            </Text>
          </View>
        </TouchableOpacity>

        {/* Map View */}
        {location && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="map" size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Map View</Text>
              <View style={styles.modeFloatingContainer}>
                <TouchableOpacity
                  onPress={() => setShowModePicker((prev) => !prev)}
                  style={styles.modeFloatingButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={18} color="#FFFFFF" />
                  <Text style={styles.modeFloatingText}>{selectedMode}</Text>
                </TouchableOpacity>
                {showModePicker && (
                  <View style={styles.modePicker}>
                    {transportModes.map((mode) => (
                      <TouchableOpacity
                        key={mode.label}
                        style={[
                          styles.modeOption,
                          selectedMode === mode.label && styles.modeOptionActive,
                        ]}
                        onPress={() => {
                          setSelectedMode(mode.label);
                          setShowModePicker(false);
                        }}
                      >
                        <Ionicons
                          name={mode.icon}
                          size={16}
                          color={selectedMode === mode.label ? "#FFFFFF" : "#1D4ED8"}
                        />
                        <Text
                          style={[
                            styles.modeOptionText,
                            selectedMode === mode.label && styles.modeOptionTextActive,
                          ]}
                        >
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
                {areas.map((area) => {
                  const center = centroid(area.coords);
                  return (
                    <Marker key={area.id} coordinate={center} title={area.name}>
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
                  );
                })}

                {restArea && (
                  <Marker coordinate={restArea.coord} title={restArea.name}>
                    <View style={styles.restMarker}>
                      <Text style={styles.restIcon}>🅿️</Text>
                    </View>
                  </Marker>
                )}

                {safeDestination && (
                  <Marker coordinate={safeDestination} title="Tujuan Akhir">
                    <View style={styles.safeMarker}>
                      <Text style={styles.safeIcon}>🏁</Text>
                    </View>
                  </Marker>
                )}

                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Location"
                  description={address}
                  pinColor="#007AFF"
                />

                {route && (
                  <Polyline
                    coordinates={route}
                    strokeWidth={5}
                    strokeColor="rgba(0,122,255,0.95)"
                  />
                )}
              </MapView>
              <View style={styles.routeFloatingContainer}>
                <TouchableOpacity
                  onPress={() => setShowRoutePicker((prev) => !prev)}
                  style={styles.routeFloatingButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trail-sign" size={18} color="#FFFFFF" />
                  <Text style={styles.routeFloatingText}>Pilih Rute</Text>
                </TouchableOpacity>
                {showRoutePicker && (
                  <View style={styles.routePicker}>
                    <TouchableOpacity
                      style={styles.routeOption}
                      onPress={() => {
                        setShowRoutePicker(false);
                        onPressRestRoute();
                      }}
                    >
                      <Ionicons name="navigate" size={16} color="#1D4ED8" />
                      <Text style={styles.routeOptionText}>
                        {loadingRoute ? "Mencari rute..." : "Rest Area Terdekat"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.routeOption}
                      onPress={() => {
                        setShowRoutePicker(false);
                        onPressSchoolRoute();
                      }}
                    >
                      <Ionicons name="school" size={16} color="#1D4ED8" />
                      <Text style={styles.routeOptionText}>
                        Rute ke Zona Sekolah
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.routeOption}
                      onPress={() => {
                        setShowRoutePicker(false);
                        onPressSafeRoute();
                      }}
                    >
                      <Ionicons name="shield" size={16} color="#1D4ED8" />
                      <Text style={styles.routeOptionText}>
                        Rute Aman
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.routeOption, styles.routeOptionDanger]}
                      onPress={() => {
                        setRoute(null);
                        setShowRoutePicker(false);
                      }}
                    >
                      <Ionicons name="close-circle" size={16} color="#DC2626" />
                      <Text style={[styles.routeOptionText, styles.routeOptionTextDanger]}>
                        Hapus Rute
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
              onPress={() =>
                router.push({ pathname: "/pdf-viewer", params: { id: pdf.id } })
              }
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
  notificationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
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
  locationCard: {
    backgroundColor: "#F0F9FF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  notifBadge: {
    marginLeft: "auto",
    backgroundColor: "#3B82F6",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  accuracyTextInline: {
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
    height: 400,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  routeFloatingContainer: {
    position: "absolute",
    right: 12,
    bottom: 12,
    alignItems: "flex-end",
  },
  routeFloatingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  routeFloatingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  routePicker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    position: "absolute",
    bottom: 46,
    right: 0,
    zIndex: 10,
  },
  routeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
  },
  routeOptionText: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  routeOptionDanger: {
    backgroundColor: "#FEE2E2",
  },
  routeOptionTextDanger: {
    color: "#DC2626",
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
  safeMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0EA5E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  safeIcon: {
    fontSize: 20,
  },
  modeFloatingContainer: {
    marginLeft: "auto",
    alignItems: "flex-end",
    gap: 6,
    position: "relative",
  },
  modeFloatingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  modeFloatingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modePicker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: "absolute",
    top: 38,
    right: 0,
    zIndex: 10,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
  },
  modeOptionActive: {
    backgroundColor: "#1D4ED8",
  },
  modeOptionText: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  modeOptionTextActive: {
    color: "#FFFFFF",
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
