/* eslint-disable react-hooks/exhaustive-deps */
import { startLocationTracking, stopLocationTracking } from "@/src/services/location";
import notifData from "@/src/services/notif.json";
import { useStore } from "@/src/store/useStore";
import { sanitizeSpeechText } from "@/src/utils/speech";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "react-native-maps";

type LatLng = { latitude: number; longitude: number };
type Destination = { label: string; latitude: number; longitude: number };

const decodePolyline = (encoded: string): LatLng[] => {
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
};

const isValidLatLng = (point?: LatLng | null) => {
  if (!point) return false;
  const { latitude, longitude } = point;
  return Number.isFinite(latitude) && Number.isFinite(longitude);
};

const distanceMeters = (a: LatLng, b: LatLng) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(hav));
};

const getOverlaySpeechText = (notifItem?: any) => notifItem?.message ?? "";
const ARRIVAL_MESSAGE =
  "Kamu sudah sampai dengan selamat. Terima kasih untuk perjalanan kali ini. Jika kamu butuh bantuan jangan ragu untuk menghubungi saya ya.";

const MIN_ZONE_DISTANCE_FROM_START_METERS = 300;
const MIN_ZONE_DISTANCE_FROM_END_METERS = 300;
const MIN_ZONE_DISTANCE_BETWEEN_METERS = 350;

export default function useMenyapaScreen() {
  const {
    location,
    onboarding,
    setOnboarding,
    setLocation,
    setSpeed,
    setLocationPermission,
    logout,
    notificationIntervalSeconds,
    silentMode,
    setSilentMode,
  } = useStore();
  const mapRef = useRef<MapView>(null);
  const [zoomDelta, setZoomDelta] = useState(0.01);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [isTravelActive, setIsTravelActive] = useState(false);
  const [hotspotCenter, setHotspotCenter] = useState<LatLng | null>(null);
  const [hotspotRadius, setHotspotRadius] = useState(120);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(
    null
  );
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState<
    { id: string; label: string }[]
  >([]);
  const [destinationError, setDestinationError] = useState("");
  const notificationsEnabled = false;
  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
  const [routeOrigin, setRouteOrigin] = useState<LatLng | null>(null);
  const [routeZones, setRouteZones] = useState<
    {
      id: string;
      center: LatLng;
      radius: number;
      icon: string;
      title: string;
      notifItem: any;
    }[]
  >([]);
  const latestLocationRef = useRef(location);
  const activeVehicleRef = useRef(onboarding.primary_vehicle);
  const simulatedLocationRef = useRef(location);
  const moveCounterRef = useRef(0);
  const notifIndexRef = useRef<Record<string, number>>({});
  const routeIndexRef = useRef(0);
  const travelIndexRef = useRef(0);
  const hasSyncedOriginRef = useRef(false);
  const triggeredZoneIdsRef = useRef<Set<string>>(new Set());
  const isTravelPausedRef = useRef(false);
  const arrivedNotifiedRef = useRef(false);
  const locationUpdateCountRef = useRef(0);
  const isTravelActiveRef = useRef(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [typedOverlayText, setTypedOverlayText] = useState("");
  const [overlayTitle, setOverlayTitle] = useState("");
  const [overlayCategory, setOverlayCategory] = useState("");
  const [overlayCtaLabel, setOverlayCtaLabel] = useState("");
  const [overlayId, setOverlayId] = useState(0);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayTypingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlaySpokenRef = useRef(false);
  const overlayIdRef = useRef(0);
  const lastSpokenOverlayIdRef = useRef(0);
  const lastSpeechRef = useRef<{ text: string; at: number } | null>(null);
  const lastOverlayTriggerRef = useRef<{ text: string; at: number } | null>(null);
  const speechLockRef = useRef(false);

  const vehicleOptions = useMemo(
    () => [
      { value: "motor", label: "Motor", emoji: "🛵" },
      { value: "mobil", label: "Mobil", emoji: "🚗" },
      { value: "sepeda", label: "Sepeda", emoji: "🚲" },
      { value: "public", label: "Angkutan Umum", emoji: "🚌" },
      { value: "walk", label: "Jalan Kaki", emoji: "🚶" },
    ],
    []
  );

  const bumpOverlayId = () => {
    overlayIdRef.current += 1;
    setOverlayId(overlayIdRef.current);
  };

  const triggerOverlay = (payload: {
    text: string;
    title?: string;
    category?: string;
    ctaLabel?: string;
  }) => {
    const now = Date.now();
    const normalizedText = sanitizeSpeechText(payload.text);
    const lastTrigger = lastOverlayTriggerRef.current;
    if (
      lastTrigger &&
      lastTrigger.text === normalizedText &&
      now - lastTrigger.at < 4000
    ) {
      return;
    }
    lastOverlayTriggerRef.current = { text: normalizedText, at: now };
    setOverlayText(payload.text);
    setOverlayTitle(payload.title ?? "");
    setOverlayCategory(payload.category ?? "");
    setOverlayCtaLabel(payload.ctaLabel ?? "");
    setShowOverlay(true);
    bumpOverlayId();
  };
  const activeVehicle =
    vehicleOptions.find((option) => option.value === onboarding.primary_vehicle) ??
    vehicleOptions[0];
  const isMotorMode = activeVehicle.value === "motor";
  const placesApiKey =
    Constants.expoConfig?.extra?.googlePlacesApiKey ??
    (Constants as any).manifest?.extra?.googlePlacesApiKey ??
    Constants.expoConfig?.ios?.config?.googleMapsApiKey ??
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ??
    "";

  useEffect(() => {
    let isActive = true;

    const startTracking = async () => {
      const started = await startLocationTracking((nextLocation) => {
        if (!isActive) return;
        setLocation(nextLocation);
        setSpeed(Math.max(0, Math.round((nextLocation.speed ?? 0) * 3.6)));
        setIsLocationReady(true);
        locationUpdateCountRef.current += 1;
        if (locationUpdateCountRef.current >= 3) {
          stopLocationTracking();
        }
      });
      if (isActive) {
        setLocationPermission(started);
      }
    };

    startTracking();
    return () => {
      isActive = false;
      stopLocationTracking();
    };
  }, [setLocation, setLocationPermission, setSpeed]);

  useEffect(() => {
    latestLocationRef.current = location;
  }, [location]);

  useEffect(() => {
    activeVehicleRef.current = onboarding.primary_vehicle;
  }, [onboarding.primary_vehicle]);

  useEffect(() => {
    notifIndexRef.current = {};
    routeIndexRef.current = 0;
    travelIndexRef.current = 0;
    setRouteZones([]);
    triggeredZoneIdsRef.current = new Set();
    arrivedNotifiedRef.current = false;
    setIsTravelActive(false);
    if (routeOrigin || routePoints.length) {
      const startPoint = routeOrigin ?? routePoints[0];
      if (startPoint) {
        setLocation({
          latitude: startPoint.latitude,
          longitude: startPoint.longitude,
          accuracy: 6,
          heading: 0,
          speed: 0,
          timestamp: Date.now(),
        });
      }
    }
  }, [onboarding.primary_vehicle, routeOrigin, routePoints, setLocation]);

  useEffect(() => {
    isTravelActiveRef.current = isTravelActive;
  }, [isTravelActive]);

  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      },
      400
    );
  }, [location, zoomDelta]);

  useEffect(() => {
    if (!showDestinationPicker || destinationQuery.trim().length < 3) {
      setDestinationResults([]);
      setDestinationError("");
      return;
    }
    if (!placesApiKey) {
      setDestinationError("API key belum tersedia.");
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setDestinationError("");
        const input = encodeURIComponent(destinationQuery.trim());
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${input}&language=id&components=country:id&key=${placesApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status !== "OK") {
          setDestinationResults([]);
          setDestinationError("Lokasi tidak ditemukan.");
          return;
        }
        const items = (data.predictions ?? []).map((item: any) => ({
          id: item.place_id as string,
          label: item.description as string,
        }));
        setDestinationResults(items);
      } catch {
        setDestinationError("Gagal mencari lokasi.");
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [destinationQuery, placesApiKey, showDestinationPicker]);

  useEffect(() => {
    if (!onboarding.destination_latitude || !onboarding.destination_longitude) {
      return;
    }
    if (!routeOrigin && location) {
      setRouteOrigin(location);
      hasSyncedOriginRef.current = false;
    }
    setSelectedDestination((prev) => {
      if (
        prev &&
        prev.latitude === onboarding.destination_latitude &&
        prev.longitude === onboarding.destination_longitude
      ) {
        return prev;
      }
      const label = onboarding.city || "Tujuan";
      setDestinationQuery(label);
      return {
        label,
        latitude: onboarding.destination_latitude!,
        longitude: onboarding.destination_longitude!,
      };
    });
  }, [
    onboarding.city,
    onboarding.destination_latitude,
    onboarding.destination_longitude,
    location,
    routeOrigin,
  ]);

  useEffect(() => {
    hasSyncedOriginRef.current = false;
  }, [selectedDestination?.latitude, selectedDestination?.longitude]);

  const requestRoute = async (target: Destination, originOverride?: LatLng) => {
    const originPoint = originOverride ?? routeOrigin ?? location;
    if (!placesApiKey || !originPoint) return;
    try {
      const origin = `${originPoint.latitude},${originPoint.longitude}`;
      const destination = `${target.latitude},${target.longitude}`;
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin}&destination=${destination}&mode=driving&language=id&key=${placesApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      const points = data?.routes?.[0]?.overview_polyline?.points;
      if (!points) {
        setDestinationError("Rute tidak ditemukan.");
        setRoutePoints([]);
        return;
      }
      const decoded = decodePolyline(points);
      setRoutePoints(decoded);
    } catch {
      setDestinationError("Gagal mengambil rute.");
      setRoutePoints([]);
    }
  };

  useEffect(() => {
    if (!selectedDestination) return;
    if (routePoints.length > 1) return;
    const originPoint = routeOrigin ?? location;
    if (!originPoint) return;
    requestRoute(selectedDestination, originPoint);
  }, [
    onboarding.primary_vehicle,
    selectedDestination?.latitude,
    selectedDestination?.longitude,
    routeOrigin,
    location,
    routePoints.length,
  ]);

  useEffect(() => {
    if (!selectedDestination || !isLocationReady || !location) return;
    if (hasSyncedOriginRef.current) return;
    setRouteOrigin(location);
    requestRoute(selectedDestination, location);
    hasSyncedOriginRef.current = true;
  }, [isLocationReady, location, selectedDestination]);

  useEffect(() => {
    if (!routePoints.length) {
      setRouteZones([]);
      triggeredZoneIdsRef.current = new Set();
      arrivedNotifiedRef.current = false;
      return;
    }
    const validRoutePoints = routePoints.filter(isValidLatLng);
    if (!validRoutePoints.length) {
      setRouteZones([]);
      return;
    }

    const rawVehicle =
      onboarding.primary_vehicle ?? activeVehicle.value ?? "motor";
    const vehicle = rawVehicle === "public" ? "angkutan_umum" : rawVehicle;
    const candidates = (notifData as any[])
      .filter(
        (item) => Array.isArray(item.pengguna) && item.pengguna.includes(vehicle)
      )
      .sort((a, b) => {
        const na = Number(a?.no ?? 0);
        const nb = Number(b?.no ?? 0);
        if (Number.isFinite(na) && Number.isFinite(nb)) {
          return na - nb;
        }
        return 0;
      });
    if (!candidates.length) {
      setRouteZones([]);
      return;
    }

    const getZoneIcon = (item: any) => {
      const id = String(item?.id ?? "").toLowerCase();
      const kategori = String(item?.kategori ?? "").toLowerCase();
      const fallbackIcon = String(item?.icon ?? "").toLowerCase();

      if (id.includes("bicycle_fast_lane")) return "bicycle";
      if (id.includes("bicycle_overspeed")) return "speedometer";
      if (id.includes("public_transport_traffic")) return "bus";
      if (id.includes("long_drive") || id.includes("long_ride")) return "hourglass";
      if (id.includes("blackspot")) return "skull";
      if (id.includes("rain") || id.includes("slippery")) return "rainy";
      if (id.includes("overspeed")) return "speedometer";

      if (id.includes("overspeed") || kategori.includes("kecepatan"))
        return "speedometer";
      if (id.includes("blackspot") || kategori.includes("rawan"))
        return "skull";
      if (id.includes("school") || kategori.includes("sekolah"))
        return "school";
      if (id.includes("rain") || kategori.includes("cuaca") || kategori.includes("licin"))
        return "rainy";
      if (id.includes("fatigue") || kategori.includes("kelelahan"))
        return "hourglass";
      if (id.includes("bicycle")) return "bicycle";
      if (id.includes("public_transport") || kategori.includes("angkutan"))
        return "bus";
      if (id.includes("traffic") || kategori.includes("kemacetan"))
        return "car";

      if (fallbackIcon === "traffic") return "car";
      if (fallbackIcon === "warning") return "alert";
      return "alert-circle";
    };

    const originPoint = routeOrigin ?? validRoutePoints[0] ?? null;
    const destinationPoint = selectedDestination
      ? {
          latitude: selectedDestination.latitude,
          longitude: selectedDestination.longitude,
        }
      : validRoutePoints[validRoutePoints.length - 1] ?? null;
    const eligiblePoints = validRoutePoints.filter((point) => {
      if (
        originPoint &&
        distanceMeters(originPoint, point) < MIN_ZONE_DISTANCE_FROM_START_METERS
      ) {
        return false;
      }
      if (
        destinationPoint &&
        distanceMeters(destinationPoint, point) < MIN_ZONE_DISTANCE_FROM_END_METERS
      ) {
        return false;
      }
      return true;
    });
    const pointsSource =
      eligiblePoints.length >= candidates.length ? eligiblePoints : validRoutePoints;
    const count = Math.min(candidates.length, pointsSource.length);
    const step = Math.max(1, Math.floor(pointsSource.length / count));

    const selectedCenters: LatLng[] = [];
    for (let i = 0; i < pointsSource.length && selectedCenters.length < count; i += step) {
      const point = pointsSource[i];
      const tooClose = selectedCenters.some(
        (center) => distanceMeters(center, point) < MIN_ZONE_DISTANCE_BETWEEN_METERS
      );
      if (!tooClose) {
        selectedCenters.push(point);
      }
    }
    if (selectedCenters.length < count) {
      for (let i = 0; i < pointsSource.length && selectedCenters.length < count; i += 1) {
        const point = pointsSource[i];
        const tooClose = selectedCenters.some(
          (center) => distanceMeters(center, point) < MIN_ZONE_DISTANCE_BETWEEN_METERS
        );
        if (!tooClose) {
          selectedCenters.push(point);
        }
      }
    }
    if (selectedCenters.length < count) {
      for (let i = 0; i < count; i += 1) {
        const idx = Math.min(i * step, pointsSource.length - 1);
        if (!selectedCenters.includes(pointsSource[idx])) {
          selectedCenters.push(pointsSource[idx]);
        }
      }
    }

    const finalCenters = selectedCenters.slice(0, count);
    const zones = finalCenters.map((center, index) => {
      const notifItem = candidates[index];
      return {
        id: `${notifItem.id ?? "zone"}-${index}`,
        center,
        radius: 120 + index * 20,
        icon: getZoneIcon(notifItem),
        title: notifItem.kategori ?? notifItem.title ?? `Area ${index + 1}`,
        notifItem,
      };
    });
    setRouteZones(zones);
  }, [
    routePoints,
    activeVehicle.value,
    onboarding.primary_vehicle,
    routeOrigin,
    selectedDestination,
  ]);

  const handleSelectDestination = async (placeId: string) => {
    if (!placesApiKey) return;
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}&fields=geometry,name,formatted_address&key=${placesApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== "OK") {
        setDestinationError("Detail lokasi gagal diambil.");
        return;
      }
      const result = data.result;
      const coords = result.geometry?.location;
      if (!coords) {
        setDestinationError("Koordinat tidak tersedia.");
        return;
      }
      const label = result.name ?? result.formatted_address ?? "Tujuan";
      const nextDestination = {
        label,
        latitude: coords.lat,
        longitude: coords.lng,
      };
      const originPoint =
        location ??
        latestLocationRef.current ?? {
          latitude: -6.914744,
          longitude: 107.60981,
        };
      hasSyncedOriginRef.current = Boolean(location);
      setRouteOrigin(originPoint);
      setSelectedDestination(nextDestination);
      setDestinationQuery(label);
      setOnboarding({
        city: label,
        destination_latitude: coords.lat,
        destination_longitude: coords.lng,
      });
      setDestinationResults([]);
      setShowDestinationPicker(false);
      await requestRoute(nextDestination, originPoint);
    } catch {
      setDestinationError("Gagal mengambil detail lokasi.");
    }
  };

  const handleClearDestination = () => {
    setSelectedDestination(null);
    setDestinationQuery("");
    setDestinationResults([]);
    setDestinationError("");
    setShowDestinationPicker(false);
    setRoutePoints([]);
    setRouteOrigin(null);
    hasSyncedOriginRef.current = false;
    arrivedNotifiedRef.current = false;
    setOnboarding({
      city: undefined,
      destination_latitude: undefined,
      destination_longitude: undefined,
    });
  };

  useEffect(() => {
    if (!selectedDestination) return;
    requestRoute(selectedDestination);
  }, [routeOrigin, selectedDestination?.latitude, selectedDestination?.longitude]);

  useEffect(() => {
    if (!showOverlay) {
      overlaySpokenRef.current = false;
      speechLockRef.current = false;
      return;
    }
    if (silentMode) {
      Speech.stop();
      overlaySpokenRef.current = true;
      speechLockRef.current = true;
    }
    const durationMs = 15_000;

    let index = 0;
    if (overlayTypingRef.current) {
      clearInterval(overlayTypingRef.current);
    }
    overlayTypingRef.current = setInterval(() => {
      index += 1;
      setTypedOverlayText(overlayText.slice(0, index));
      if (index >= overlayText.length) {
        if (overlayTypingRef.current) {
          clearInterval(overlayTypingRef.current);
          overlayTypingRef.current = null;
        }
      }
    }, 50);

    if (
      !silentMode &&
      !overlaySpokenRef.current &&
      overlayId > 0 &&
      !speechLockRef.current
    ) {
      if (lastSpokenOverlayIdRef.current === overlayId) {
        return;
      }
      const speechText = sanitizeSpeechText(overlayText);
      if (speechText) {
        const now = Date.now();
        if (
          lastSpeechRef.current &&
          lastSpeechRef.current.text === speechText &&
          now - lastSpeechRef.current.at < 2000
        ) {
          return;
        }
        Speech.stop();
        Speech.speak(speechText, {
          language: "id-ID",
          rate: 0.95,
        });
        overlaySpokenRef.current = true;
        lastSpokenOverlayIdRef.current = overlayId;
        lastSpeechRef.current = { text: speechText, at: now };
        speechLockRef.current = true;
      }
    }

    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlay(false);
      setTypedOverlayText("");
      setOverlayText("");
      setOverlayTitle("");
      setOverlayCategory("");
      setOverlayCtaLabel("");
      if (overlayTypingRef.current) {
        clearInterval(overlayTypingRef.current);
        overlayTypingRef.current = null;
      }
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
    }, durationMs);
  }, [notificationIntervalSeconds, overlayId, overlayText, showOverlay, silentMode]);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!isLocationReady || !isMotorMode || routePoints.length > 0) return;

    const interval = setInterval(() => {
      const base =
        simulatedLocationRef.current ??
        latestLocationRef.current ?? {
          latitude: -6.914744,
          longitude: 107.60981,
          accuracy: 10,
          heading: 0,
          speed: 0,
          timestamp: Date.now(),
        };
      const deltaLat = (Math.random() - 0.5) * 0.0006;
      const deltaLng = (Math.random() - 0.5) * 0.0006;
      const nextLocation = {
        ...base,
        latitude: base.latitude + deltaLat,
        longitude: base.longitude + deltaLng,
        timestamp: Date.now(),
      };
      simulatedLocationRef.current = nextLocation;
      setLocation(nextLocation);
      moveCounterRef.current += 1;

      const intervalSeconds = Math.max(2, notificationIntervalSeconds);
      const steps = Math.max(1, Math.round(intervalSeconds / 2));
      if (moveCounterRef.current % steps === 0) {
        const rawVehicle = activeVehicleRef.current ?? "motor";
        const vehicle = rawVehicle === "public" ? "angkutan_umum" : rawVehicle;
        const candidates = (notifData as any[]).filter(
          (item) => Array.isArray(item.pengguna) && item.pengguna.includes(vehicle)
        );
        if (!candidates.length) return;
        const nextIndex =
          (notifIndexRef.current[vehicle] ?? 0) % candidates.length;
        const notifItem = candidates[nextIndex];
        notifIndexRef.current[vehicle] = nextIndex + 1;

        if (latestLocationRef.current) {
          setHotspotCenter({
            latitude: latestLocationRef.current.latitude,
            longitude: latestLocationRef.current.longitude,
          });
          setHotspotRadius(120 + Math.floor(Math.random() * 60));
        }
        triggerOverlay({
          text: getOverlaySpeechText(notifItem),
          title: notifItem.title ?? "Notifikasi",
          category: notifItem.kategori ?? "",
          ctaLabel: notifItem.cta?.label ?? "",
        });

        const baseLocation =
          latestLocationRef.current ?? {
            latitude: -6.914744,
            longitude: 107.60981,
          };
        const isRestCta =
          notifItem.cta?.type === "find_rest_spot" ||
          notifItem.cta?.type === "find_rest_area";
        const targetCoords = isRestCta
          ? {
              latitude: baseLocation.latitude + 0.0024,
              longitude: baseLocation.longitude + 0.0018,
            }
          : {
              latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.0015,
              longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.0015,
            };
        const targetAddress = isRestCta
          ? "Rest Area terdekat (simulasi)"
          : "Lokasi kejadian (simulasi)";

        Notifications.scheduleNotificationAsync({
          content: {
            title: notifItem.title,
            subtitle: notifItem.kategori,
            body: notifItem.message,
            data: {
              id: notifItem.id,
              kategori: notifItem.kategori,
              trigger: notifItem.trigger,
              data_utama: notifItem.data_utama,
              pengguna: notifItem.pengguna,
              icon: notifItem.icon,
              color: notifItem.color,
              cta: notifItem.cta,
              voiceText: notifItem.message,
              address: targetAddress,
              latitude: targetCoords.latitude,
              longitude: targetCoords.longitude,
              user_latitude: baseLocation.latitude,
              user_longitude: baseLocation.longitude,
            },
          },
          trigger: null,
        }).catch(() => null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [
    isLocationReady,
    isMotorMode,
    notificationIntervalSeconds,
    routePoints.length,
    setLocation,
    notificationsEnabled,
  ]);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!isLocationReady || !isMotorMode || routePoints.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = Math.min(
        routeIndexRef.current + 1,
        routePoints.length - 1
      );
      const nextPoint = routePoints[nextIndex];
      routeIndexRef.current = nextIndex;
      setLocation({
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        accuracy: 8,
        heading: 0,
        speed: 8,
        timestamp: Date.now(),
      });

      if (nextIndex > 0 && nextIndex < routePoints.length - 1) {
        const candidates = (notifData as any[]).filter(
          (item) => Array.isArray(item.pengguna) && item.pengguna.includes("motor")
        );
        if (candidates.length) {
          const notifIdx =
            (notifIndexRef.current.motor ?? 0) % candidates.length;
          const notifItem = candidates[notifIdx];
          notifIndexRef.current.motor = notifIdx + 1;
          setHotspotCenter({
            latitude: nextPoint.latitude,
            longitude: nextPoint.longitude,
          });
          setHotspotRadius(120);
          triggerOverlay({
            text: getOverlaySpeechText(notifItem),
            title: notifItem.title ?? "Notifikasi",
            category: notifItem.kategori ?? "",
            ctaLabel: notifItem.cta?.label ?? "",
          });
          Notifications.scheduleNotificationAsync({
            content: {
              title: notifItem.title,
              subtitle: notifItem.kategori,
              body: notifItem.message,
              data: {
                id: notifItem.id,
                kategori: notifItem.kategori,
                trigger: notifItem.trigger,
                data_utama: notifItem.data_utama,
                pengguna: notifItem.pengguna,
                icon: notifItem.icon,
                color: notifItem.color,
                cta: notifItem.cta,
                voiceText: notifItem.message,
                address: "Titik notifikasi (simulasi)",
                latitude: nextPoint.latitude,
                longitude: nextPoint.longitude,
                user_latitude: nextPoint.latitude,
                user_longitude: nextPoint.longitude,
              },
            },
            trigger: null,
          }).catch(() => null);
        }
      }

      if (nextIndex >= routePoints.length - 1) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLocationReady, isMotorMode, routePoints, setLocation, notificationsEnabled]);

  useEffect(() => {
    isTravelPausedRef.current = showOverlay;
  }, [showOverlay]);

  useEffect(() => {
    if (silentMode) {
      Speech.stop();
    }
  }, [silentMode]);

  useEffect(() => {
    if (!location || !routeZones.length) return;
    if (showOverlay) return;
    const nextZone = routeZones.find(
      (zone) =>
        !triggeredZoneIdsRef.current.has(zone.id) &&
        distanceMeters(location, zone.center) <= zone.radius
    );
    if (!nextZone) return;
    triggeredZoneIdsRef.current.add(nextZone.id);
    setHotspotCenter(nextZone.center);
    setHotspotRadius(nextZone.radius);
    triggerOverlay({
      text: getOverlaySpeechText(nextZone.notifItem) || "Notifikasi area",
      title: nextZone.notifItem?.title ?? "Notifikasi",
      category: nextZone.notifItem?.kategori ?? "",
      ctaLabel: nextZone.notifItem?.cta?.label ?? "",
    });

    Notifications.scheduleNotificationAsync({
      content: {
        title: nextZone.notifItem?.title ?? "Notifikasi",
        subtitle: nextZone.notifItem?.kategori ?? "",
        body: nextZone.notifItem?.message ?? "Notifikasi area.",
        data: {
          id: nextZone.notifItem?.id,
          kategori: nextZone.notifItem?.kategori,
          trigger: nextZone.notifItem?.trigger,
          data_utama: nextZone.notifItem?.data_utama,
          pengguna: nextZone.notifItem?.pengguna,
          icon: nextZone.notifItem?.icon,
          color: nextZone.notifItem?.color,
          cta: nextZone.notifItem?.cta,
          voiceText: nextZone.notifItem?.message,
          latitude: nextZone.center.latitude,
          longitude: nextZone.center.longitude,
          user_latitude: location.latitude,
          user_longitude: location.longitude,
        },
      },
      trigger: null,
    }).catch(() => null);
  }, [location, routeZones, showOverlay]);

  useEffect(() => {
    if (routePoints.length < 2) return;
    travelIndexRef.current = 0;
    arrivedNotifiedRef.current = false;
    const interval = setInterval(() => {
      if (!isTravelActiveRef.current) return;
      if (isTravelPausedRef.current) return;
      travelIndexRef.current = Math.min(
        travelIndexRef.current + 1,
        routePoints.length - 1
      );
      const nextPoint = routePoints[travelIndexRef.current];
      setLocation({
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        accuracy: 6,
        heading: 0,
        speed: 10,
        timestamp: Date.now(),
      });
      setIsLocationReady(true);
      if (travelIndexRef.current >= routePoints.length - 1) {
        if (!arrivedNotifiedRef.current) {
          const endPoint = routePoints[routePoints.length - 1];
          setHotspotCenter(endPoint);
          setHotspotRadius(140);
          triggerOverlay({
            text: ARRIVAL_MESSAGE,
            title: "Tiba di Tujuan",
            category: "Perjalanan selesai",
            ctaLabel: "",
          });
          arrivedNotifiedRef.current = true;

          Notifications.scheduleNotificationAsync({
            content: {
              title: "Tiba di Tujuan",
              subtitle: "Perjalanan selesai",
              body: ARRIVAL_MESSAGE,
              data: {
                id: "arrival_notice",
                kategori: "Perjalanan selesai",
                trigger: "route_arrival",
                data_utama: ["gps", "rute_aktif"],
                pengguna: [onboarding.primary_vehicle ?? "motor"],
                icon: "checkmark",
                color: "#10B981",
                voiceText: ARRIVAL_MESSAGE,
                latitude: endPoint.latitude,
                longitude: endPoint.longitude,
                user_latitude: endPoint.latitude,
                user_longitude: endPoint.longitude,
              },
            },
            trigger: null,
          }).catch(() => null);
        }
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [routePoints, setLocation]);

  const handleZoom = (direction: "in" | "out") => {
    const nextDelta =
      direction === "in"
        ? Math.max(0.0025, zoomDelta * 0.7)
        : Math.min(0.08, zoomDelta * 1.4);
    setZoomDelta(nextDelta);
    mapRef.current?.animateToRegion(
      {
        latitude: location?.latitude ?? -6.914744,
        longitude: location?.longitude ?? 107.60981,
        latitudeDelta: nextDelta,
        longitudeDelta: nextDelta,
      },
      250
    );
  };

  const handleFocusLocation = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: location?.latitude ?? -6.914744,
        longitude: location?.longitude ?? 107.60981,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      },
      300
    );
  };

  const handleLogout = () => {
    logout();
    router.replace("/onboarding");
  };

  return {
    mapRef,
    location,
    zoomDelta,
    isMotorMode,
    isTravelActive,
    setIsTravelActive,
    showDestinationPicker,
    setShowDestinationPicker,
    selectedDestination,
    destinationQuery,
    setDestinationQuery,
    destinationResults,
    destinationError,
    handleSelectDestination,
    handleClearDestination,
    hotspotCenter,
    hotspotRadius,
    showOverlay,
    routePoints,
    routeZones,
    routeOrigin,
    handleFocusLocation,
    handleZoom,
    showVehiclePicker,
    setShowVehiclePicker,
    vehicleOptions,
    activeVehicle,
    setOnboarding,
    isLocationReady,
    overlayTitle,
    typedOverlayText,
    overlayCategory,
    overlayCtaLabel,
    handleLogout,
    silentMode,
    setSilentMode,
  };
}
