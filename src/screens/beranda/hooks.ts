/* eslint-disable react-hooks/exhaustive-deps */
import { PDF_LIBRARY } from "@/src/data/pdfLibrary";
import { getTrafficInfo } from "@/src/services/api";
import notificationData from "@/src/services/notification.json";
import { useStore } from "@/src/store/useStore";
import { pickSeverityFromColor } from "@/src/utils/notifications";
import { sanitizeSpeechText } from "@/src/utils/speech";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";

const LIBRARY_PREVIEW = PDF_LIBRARY.slice(0, 3);
const NOTIFICATION_CHANNEL_ID = "alerts";
const NOTIFICATION_SOUND_ANDROID = "notification_bell";
const NOTIFICATION_SOUND_IOS = "notification_bell.wav";

type NotificationPayload = (typeof notificationData)[number];
type ScenarioMarker = {
  id: string;
  title: string;
  coord: LatLng;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type LatLng = { latitude: number; longitude: number };

function buildVoiceText(payload: NotificationPayload): string {
  const customText = payload.voice_text?.trim();
  if (customText) {
    return `Hai Sobat Lantas, ${customText}`;
  }
  const title = payload.title?.trim();
  if (title) {
    return `Hai Sobat Lantas, ${title}. Tetap hati-hati di jalan.`;
  }
  return "Hai Sobat Lantas, tetap hati-hati di jalan.";
}

function getIoniconName(name?: string): keyof typeof Ionicons.glyphMap {
  if (name && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, name)) {
    return name as keyof typeof Ionicons.glyphMap;
  }
  return "alert-circle";
}

export function getScenarioIcon(
  payload: NotificationPayload
): keyof typeof Ionicons.glyphMap {
  switch (payload.id) {
    case "school_zone_active":
      return "school";
    case "blackspot_enter":
      return "warning";
    case "wrong_way_detected":
      return "swap-vertical";
    case "illegal_uturn_zone":
      return "return-down-back";
    case "rain_slippery_road":
    case "rain_active_general":
      return "rainy";
    case "fatigue_detected":
      return "bed";
    case "high_risk_hour":
      return "time";
    case "traffic_operation_active":
    case "roadwork_active":
      return "construct";
    case "traffic_density_high":
      return "stats-chart";
    case "helmet_education":
      return "shield-checkmark";
    case "steep_descent_ahead":
      return "arrow-down";
    case "big_intersection":
      return "git-branch";
    case "low_light_area":
      return "flash";
    case "safe_trip_completed":
      return "happy";
    case "bike_unfriendly_route":
    case "bike_night_no_light":
      return "bicycle";
    case "crime_prone_area":
      return "alert-circle";
    case "unsafe_crossing":
      return "walk";
    case "sidewalk_disrupted":
      return "trail-sign";
    case "public_transport_dropoff_risk":
    case "route_changed":
      return "bus";
    case "event_or_demo_area":
      return "megaphone";
    default:
      return getIoniconName(payload.icon);
  }
}

function getModeForScenario(payload: NotificationPayload) {
  const users = payload.pengguna ?? [];
  if (users.includes("pejalan_kaki")) return "Jalan Kaki";
  if (users.includes("pesepeda")) return "Sepeda";
  if (users.includes("angkutan_umum")) return "Penumpang";
  if (users.includes("motor")) return "Motor";
  if (users.includes("mobil")) return "Mobil";
  return "Mobil";
}

function offsetLatLng(origin: LatLng, northMeters: number, eastMeters: number): LatLng {
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

export default function useBerandaScreen() {
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
  const [showModePicker, setShowModePicker] = useState(false);
  const [selectedMode, setSelectedMode] = useState<
    "Mobil" | "Motor" | "Sepeda" | "Jalan Kaki" | "Penumpang"
  >("Mobil");
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(
    notificationData[0]?.id ?? null
  );

  const transportModes: {
    label: "Mobil" | "Motor" | "Sepeda" | "Jalan Kaki" | "Penumpang";
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { label: "Mobil", icon: "car" },
    { label: "Motor", icon: "speedometer" },
    { label: "Sepeda", icon: "bicycle" },
    { label: "Jalan Kaki", icon: "walk" },
    { label: "Penumpang", icon: "people" },
  ];
  const selectedModeIcon =
    transportModes.find((mode) => mode.label === selectedMode)?.icon ??
    "navigate";

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

  const uturnPoint = useMemo(() => {
    if (!userCoord) return null;
    return {
      id: "uturn-1",
      name: "U-turn Aman Terdekat",
      coord: offsetLatLng(userCoord, +140, -180),
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
  const activeScenario = useMemo(
    () => notificationData.find((item) => item.id === activeScenarioId) ?? null,
    [activeScenarioId]
  );
  const scenarioMarkers = useMemo<ScenarioMarker[]>(() => {
    if (!userCoord || !activeScenario) return [];

    const id = activeScenario.id;
    const base = userCoord;
    const offset = (north: number, east: number) => offsetLatLng(base, north, east);

    const icon = getScenarioIcon(activeScenario);
    const color = activeScenario.color ?? "#0B57D0";
    const mapOffset = activeScenario.map_offset ?? { north: 120, east: 140 };

    if (
      [
        "blackspot_enter",
        "school_zone_active",
        "wrong_way_detected",
        "illegal_uturn_zone",
        "traffic_operation_active",
        "traffic_density_high",
        "low_light_area",
        "roadwork_active",
        "big_intersection",
        "event_or_demo_area",
        "rain_slippery_road",
        "rain_active_general",
        "unsafe_crossing",
        "sidewalk_disrupted",
        "public_transport_dropoff_risk",
        "route_changed",
        "bike_unfriendly_route",
        "bike_night_no_light",
        "crime_prone_area",
      ].includes(id)
    ) {
      return [
        {
          id,
          title: activeScenario.title,
          coord: offset(mapOffset.north, mapOffset.east),
          color,
          icon,
        },
      ];
    }

    if (id === "fatigue_detected" && restArea) {
      return [
        {
          id,
          title: "Rest Area Terdekat",
          coord: restArea.coord,
          color: "#34C759",
          icon: "bed",
        },
      ];
    }

    return [];
  }, [userCoord, activeScenario, restArea]);
  const schoolRouteTarget = useMemo(() => {
    if (!schoolArea) return null;
    if (activeScenarioId === "school_zone_active") {
      return scenarioMarkers[0]?.coord ?? centroid(schoolArea.coords);
    }
    return centroid(schoolArea.coords);
  }, [activeScenarioId, scenarioMarkers, schoolArea]);
  const safeDestination = useMemo(() => {
    if (!dangerArea) return null;
    const dangerCenter = centroid(dangerArea.coords);
    return offsetLatLng(dangerCenter, +300, 0);
  }, [dangerArea]);

  useEffect(() => {
    startLocationTracking();
  }, []);

  useEffect(() => {
    if (!location) return;

    const fetchTraffic = async () => {
      try {
        setTrafficLoading(true);
        const response = await getTrafficInfo(location.latitude, location.longitude);
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
    sendSampleNotification();
  };

  const sendSampleNotification = async () => {
    if (!notificationData.length) return;
    const { status: currentStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = currentStatus;
    if (currentStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert(
        "Izin Notifikasi",
        "Aktifkan izin notifikasi untuk menerima pemberitahuan."
      );
      return;
    }

    const randomIndex = Math.floor(Math.random() * notificationData.length);
    const payload: NotificationPayload =
      activeScenario ?? notificationData[randomIndex];
    const scenarioCoord = scenarioMarkers[0]?.coord;
    const coords = scenarioCoord
      ? `${scenarioCoord.latitude.toFixed(6)}, ${scenarioCoord.longitude.toFixed(6)}`
      : location
      ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      : "Lokasi tidak tersedia";

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
          NOTIFICATION_CHANNEL_ID,
          {
            name: "alerts",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#007AFF",
            sound: NOTIFICATION_SOUND_ANDROID,
          }
        );
      }
      const voiceText = buildVoiceText(payload);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Polantas Menyapa Digital",
          subtitle: payload.title,
          body: `${payload.message}\n\nLokasi: ${address}\n${coords}`,
          sound: Platform.OS === "ios" ? NOTIFICATION_SOUND_IOS : undefined,
          data: {
            id: payload.id,
            kategori: payload.kategori,
            trigger: payload.trigger,
            data_utama: payload.data_utama,
            sapaan_ringkas: payload.sapaan_ringkas,
            pengguna: payload.pengguna,
            icon: payload.icon,
            color: payload.color,
            type: pickSeverityFromColor(payload.color),
            cta: payload.cta,
            address,
            coords,
            latitude: scenarioCoord?.latitude ?? location?.latitude,
            longitude: scenarioCoord?.longitude ?? location?.longitude,
            voiceText,
          },
        },
        trigger: null,
      });
      Speech.stop();
      Speech.speak(sanitizeSpeechText(voiceText), {
        language: "id-ID",
        rate: 0.9,
        pitch: 1.1,
      });
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  useEffect(() => {
    if (!activeScenario) return;
    const nextMode = getModeForScenario(activeScenario);
    setSelectedMode(nextMode);
  }, [activeScenario?.id]);

  useEffect(() => {
    setRoute(null);
  }, [activeScenarioId]);

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
    if (!userCoord || !schoolRouteTarget) return;
    try {
      setLoadingRoute(true);
      const pts = await fetchRouteOSRM(userCoord, schoolRouteTarget);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const onPressScenarioRoute = async () => {
    const target = scenarioMarkers[0]?.coord;
    if (!userCoord || !target) return;
    try {
      setLoadingRoute(true);
      const pts = await fetchRouteOSRM(userCoord, target);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const onPressUturnRoute = async () => {
    if (!userCoord || !uturnPoint) return;
    try {
      setLoadingRoute(true);
      const pts = await fetchRouteOSRM(userCoord, uturnPoint.coord);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const restAreaScenarioIds = useMemo(
    () =>
      new Set<string>([
        "fatigue_detected",
        "traffic_density_high",
        "traffic_operation_active",
        "high_risk_hour",
      ]),
    []
  );

  const routeOptions = useMemo(() => {
    const options: {
      key: "rest" | "school" | "safe" | "uturn" | "destination";
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
      onPress: () => void;
    }[] = [];

    const ctaType = activeScenario?.cta?.type ?? "";
    const ctaLabel = activeScenario?.cta?.label;
    const isRouteCta =
      ctaType.includes("route") ||
      ctaType.includes("navigate") ||
      ctaType.includes("reroute");
    const destinationLabel = isRouteCta && ctaLabel ? ctaLabel : "Arahkan ke lokasi";

    const hasSchool = Boolean(userCoord && schoolArea);
    const hasRest = Boolean(userCoord && restArea);
    const hasUturn = Boolean(userCoord && uturnPoint);
    const hasScenarioTarget = Boolean(userCoord && scenarioMarkers[0]?.coord);

    if (activeScenarioId === "school_zone_active") {
      if (hasSchool) {
        options.push({
          key: "school",
          label: ctaLabel ?? "Rute ke Zona Sekolah",
          icon: "school",
          onPress: onPressSchoolRoute,
        });
      }
      return options;
    }

    if (activeScenarioId === "fatigue_detected") {
      if (hasRest) {
        options.push({
          key: "rest",
          label:
            loadingRoute
              ? "Mencari rute..."
              : ctaType.includes("rest_area") && ctaLabel
              ? ctaLabel
              : "Rest Area Terdekat",
          icon: "navigate",
          onPress: onPressRestRoute,
        });
      }
      return options;
    }

    if (
      activeScenarioId === "wrong_way_detected" ||
      activeScenarioId === "illegal_uturn_zone"
    ) {
      if (hasUturn) {
        options.push({
          key: "uturn",
          label: ctaLabel
            ? ctaLabel
            : activeScenarioId === "illegal_uturn_zone"
            ? "U-turn Resmi Terdekat"
            : "Putar Balik Aman",
          icon: "return-down-back",
          onPress: onPressUturnRoute,
        });
      }
      return options;
    }

    if (hasRest && activeScenarioId && restAreaScenarioIds.has(activeScenarioId)) {
      options.push({
        key: "rest",
        label:
          loadingRoute
            ? "Mencari rute..."
            : ctaType.includes("rest_area") && ctaLabel
            ? ctaLabel
            : "Rest Area Terdekat",
        icon: "navigate",
        onPress: onPressRestRoute,
      });
      return options;
    }

    if (hasScenarioTarget) {
      options.push({
        key: "destination",
        label: loadingRoute ? "Mencari rute..." : destinationLabel,
        icon: "navigate",
        onPress: onPressScenarioRoute,
      });
    }

    return options;
  }, [
    activeScenarioId,
    activeScenario?.cta?.label,
    activeScenario?.cta?.type,
    loadingRoute,
    onPressScenarioRoute,
    onPressRestRoute,
    onPressSchoolRoute,
    onPressUturnRoute,
    restArea,
    safeDestination,
    schoolArea,
    scenarioMarkers,
    uturnPoint,
    userCoord,
  ]);

  const handleOpenPdf = (id: string) => {
    router.push({ pathname: "/pdf-viewer", params: { id } });
  };

  const handleOpenLibrary = () => {
    router.push("/library");
  };

  return {
    address,
    location,
    speed,
    isTracking,
    lastUpdate,
    refreshLocation,
    handleLogout,
    handleLocationCardPress,
    transportModes,
    selectedMode,
    setSelectedMode,
    selectedModeIcon,
    showModePicker,
    setShowModePicker,
    activeScenarioId,
    setActiveScenarioId,
    activeScenario,
    scenarioMarkers,
    restArea,
    restAreaScenarioIds,
    uturnPoint,
    safeDestination,
    route,
    setRoute,
    showRoutePicker,
    setShowRoutePicker,
    routeOptions,
    notificationData,
    LIBRARY_PREVIEW,
    handleOpenPdf,
    handleOpenLibrary,
  };
}
