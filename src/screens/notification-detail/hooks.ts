import { useStore } from "@/src/store/useStore";
import { getNotificationDisplay } from "@/src/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Dimensions } from "react-native";

const FALLBACK_COORDS = {
  latitude: -6.2,
  longitude: 106.816666,
};

type LatLng = { latitude: number; longitude: number };

function getScenarioIconForId(
  scenarioId?: string,
  fallback?: keyof typeof Ionicons.glyphMap
) {
  switch (scenarioId) {
    case "school_zone_active":
      return "school";
    case "wrong_way_detected":
      return "swap-vertical";
    case "illegal_uturn_zone":
      return "return-down-back";
    case "blackspot_enter":
      return "warning";
    case "low_light_area":
      return "flash";
    case "event_or_demo_area":
      return "megaphone";
    case "crime_prone_area":
      return "alert-circle";
    default:
      return fallback ?? "alert-circle";
  }
}

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

const TRIP_TYPE_ICONS: { id: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "motor", icon: "speedometer" },
  { id: "mobil", icon: "car" },
  { id: "pesepeda", icon: "bicycle" },
  { id: "pejalan_kaki", icon: "walk" },
  { id: "angkutan_umum", icon: "bus" },
];

export default function useNotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notifications, markNotificationRead } = useStore();
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [staticUserCoords, setStaticUserCoords] = useState<LatLng | undefined>(
    undefined
  );

  const notification = useMemo(
    () => notifications.find((item) => item.id === id),
    [notifications, id]
  );

  useEffect(() => {
    if (notification && !notification.read) {
      markNotificationRead(notification.id);
    }
  }, [notification, markNotificationRead]);

  useEffect(() => {
    const storedLat = notification?.data?.user_latitude;
    const storedLng = notification?.data?.user_longitude;
    if (typeof storedLat === "number" && typeof storedLng === "number") {
      setStaticUserCoords({ latitude: storedLat, longitude: storedLng });
    }
  }, [notification?.data?.user_latitude, notification?.data?.user_longitude]);

  const scenarioCoords = notification?.data?.coords;
  const mapCenter = scenarioCoords ?? staticUserCoords ?? FALLBACK_COORDS;
  const mapRegion = {
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
  const scenarioId = notification?.data?.scenarioId ?? "";
  const showWrongWay = scenarioId === "wrong_way_detected" && Boolean(scenarioCoords);
  const showSchoolZone = scenarioId === "school_zone_active" && Boolean(scenarioCoords);
  const schoolZoneCoords = scenarioCoords ? squarePolygon(scenarioCoords, 90) : [];
  const showDangerZone = scenarioId === "blackspot_enter" && Boolean(scenarioCoords);
  const dangerZoneCoords = scenarioCoords ? squarePolygon(scenarioCoords, 120) : [];
  const showRestArea = scenarioId === "fatigue_detected" && Boolean(staticUserCoords);
  const restAreaCoord = useMemo(() => {
    if (!staticUserCoords) return null;
    return offsetLatLng(staticUserCoords, 80, 400);
  }, [staticUserCoords]);

  const displayStyle = notification ? getNotificationDisplay(notification) : null;
  const markerIcon = getScenarioIconForId(scenarioId, displayStyle?.icon);
  const tripTypes = notification?.data?.pengguna ?? [];
  const highlightAll = tripTypes.length === 0 || tripTypes.includes("semua");
  const mapHeight = Math.round(Dimensions.get("window").height * 0.5);

  const routeTarget =
    showRestArea && restAreaCoord
      ? { label: "Rest Area Terdekat", coord: restAreaCoord }
      : scenarioCoords
      ? { label: "Lokasi Notifikasi", coord: scenarioCoords }
      : null;

  const handleRouteToTarget = async () => {
    if (!staticUserCoords || !routeTarget) return;
    try {
      setLoadingRoute(true);
      const pts = await fetchRouteOSRM(staticUserCoords, routeTarget.coord);
      setRoute(pts);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleBack = () => router.back();

  return {
    notification,
    mapRegion,
    mapHeight,
    showDangerZone,
    dangerZoneCoords,
    showSchoolZone,
    schoolZoneCoords,
    showWrongWay,
    showRestArea,
    staticUserCoords,
    scenarioCoords,
    displayStyle,
    markerIcon,
    route,
    loadingRoute,
    showRoutePicker,
    setShowRoutePicker,
    routeTarget,
    handleRouteToTarget,
    setRoute,
    restAreaCoord,
    tripTypes,
    highlightAll,
    tripTypeIcons: TRIP_TYPE_ICONS,
    handleBack,
  };
}
