/* eslint-disable react-hooks/exhaustive-deps */
import {
  startLocationTracking,
  stopLocationTracking,
} from "@/src/services/location";
import notifData from "@/src/services/notif.json";
import notifFreeData from "@/src/services/notif_free_2.json";
import {
  isSpeechRecognitionAvailable,
  startListening,
  stopListening,
} from "@/src/services/voice";
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
type OverlayAction =
  | {
      type: "offer_rest_area" | "offer_charger";
      target: "rest_area" | "charger";
      distanceKm: number;
      labelYes: string;
      labelNo: string;
      origin: LatLng;
      destination: LatLng;
      targetLabel: string;
    }
  | {
      type: "multi_step";
      labelYes: string;
      labelNo: string;
    };
type MultiStepFlow = {
  title?: string;
  category?: string;
  responseYes?: any;
  responseNo?: any;
  responseTimeout?: any;
};
type OverlayOption = { id: string; label: string };

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

const offsetLatLng = (
  origin: LatLng,
  northMeters: number,
  eastMeters: number,
) => {
  const dLat = northMeters / 111_320;
  const dLng =
    eastMeters / (111_320 * Math.cos((origin.latitude * Math.PI) / 180));
  return {
    latitude: origin.latitude + dLat,
    longitude: origin.longitude + dLng,
  };
};

const interpolateRoute = (origin: LatLng, destination: LatLng, steps = 12) => {
  const points: LatLng[] = [];
  const count = Math.max(2, steps);
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    points.push({
      latitude: origin.latitude + (destination.latitude - origin.latitude) * t,
      longitude:
        origin.longitude + (destination.longitude - origin.longitude) * t,
    });
  }
  return points;
};

const offsetLocationByKm = (origin: LatLng, distanceKm: number): LatLng => {
  const bearing = Math.PI / 4;
  const deltaLat = (distanceKm / 111) * Math.cos(bearing);
  const deltaLng =
    (distanceKm / (111 * Math.cos((origin.latitude * Math.PI) / 180))) *
    Math.sin(bearing);
  return {
    latitude: origin.latitude + deltaLat,
    longitude: origin.longitude + deltaLng,
  };
};

const getNotifPrompt = (notifItem?: any) =>
  notifItem?.step_1_prompt ?? notifItem ?? {};
const getNotifTitle = (notifItem?: any) => {
  const prompt = getNotifPrompt(notifItem);
  return (
    prompt?.sapaan ??
    notifItem?.sapaan_ringkas ??
    prompt?.title ??
    notifItem?.title ??
    "Notifikasi"
  );
};
const getNotifMessage = (notifItem?: any) =>
  getNotifPrompt(notifItem)?.message ?? "";
const getNotifVoiceText = (notifItem?: any) =>
  getNotifPrompt(notifItem)?.voice_text ?? getNotifMessage(notifItem);
const getNotifCtaLabel = (notifItem?: any) =>
  getNotifPrompt(notifItem)?.cta?.label ?? notifItem?.cta?.label ?? "";
const getNotifIcon = (notifItem?: any) =>
  getNotifPrompt(notifItem)?.icon ?? notifItem?.icon ?? "";
const getNotifColor = (notifItem?: any) =>
  notifItem?.ui?.color ?? notifItem?.color ?? "";
const getNotifDataUtama = (notifItem?: any) =>
  notifItem?.data_utama ?? notifItem?.trigger?.data_utama;
const getNotifTrigger = (notifItem?: any) =>
  notifItem?.trigger?.condition ?? notifItem?.trigger;
const getNotifMapOffset = (notifItem?: any) =>
  notifItem?.ui?.map_offset ?? notifItem?.map_offset;
const ARRIVAL_MESSAGE =
  "Kamu sudah sampai dengan selamat. Terima kasih untuk perjalanan kali ini. Jika kamu butuh bantuan jangan ragu untuk menghubungi saya ya.";
const DEFAULT_OVERLAY_AUTO_CLOSE_MS = 30_000;
const MULTI_STEP_IDLE_TIMEOUT_MS = 20_000;
const TIMEOUT_OVERLAY_AUTO_CLOSE_MS = 10_000;

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
  const [rideMode, setRideMode] = useState<"normal" | "free">("normal");
  const [hotspotCenter, setHotspotCenter] = useState<LatLng | null>(null);
  const [hotspotRadius, setHotspotRadius] = useState(120);
  const [isLocationReady, setIsLocationReady] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
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
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());
  const isTravelPausedRef = useRef(false);
  const arrivedNotifiedRef = useRef(false);
  const locationUpdateCountRef = useRef(0);
  const isTravelActiveRef = useRef(false);
  const freeRideNotifIndexRef = useRef(0);
  const isResumingRef = useRef(false);
  const lastTypingOverlayIdRef = useRef(0);
  const originalDestinationRef = useRef<{
    destination: Destination;
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [typedOverlayText, setTypedOverlayText] = useState("");
  const [overlaySpeechText, setOverlaySpeechText] = useState("");
  const [overlayTypingDone, setOverlayTypingDone] = useState(false);
  const [overlayTitle, setOverlayTitle] = useState("");
  const [overlayCategory, setOverlayCategory] = useState("");
  const [overlayCtaLabel, setOverlayCtaLabel] = useState("");
  const [overlayAction, setOverlayAction] = useState<OverlayAction | null>(
    null,
  );
  const [overlayFlow, setOverlayFlow] = useState<MultiStepFlow | null>(null);
  const [overlayOptions, setOverlayOptions] = useState<OverlayOption[]>([]);
  const [overlayOptionAction, setOverlayOptionAction] = useState<any | null>(
    null,
  );
  const [overlayAutoCloseMs, setOverlayAutoCloseMs] = useState<number | null>(
    null,
  );
  const [overlayId, setOverlayId] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayTypingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlaySpokenRef = useRef(false);
  const overlayIdRef = useRef(0);
  const lastSpokenOverlayIdRef = useRef(0);
  const lastSpeechRef = useRef<{ text: string; at: number } | null>(null);
  const lastOverlayTriggerRef = useRef<{ text: string; at: number } | null>(
    null,
  );
  const speechLockRef = useRef(false);
  const [actionRouteActive, setActionRouteActive] = useState(false);
  const [actionRouteTarget, setActionRouteTarget] = useState<
    "rest_area" | "charger" | null
  >(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInputError, setVoiceInputError] = useState("");
  const [voiceCaptureText, setVoiceCaptureText] = useState("");
  const [voiceTextVisible, setVoiceTextVisible] = useState(false);
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const vehicleOptions = useMemo(
    () => [
      { value: "motor", label: "Motor", emoji: "🛵" },
      { value: "mobil", label: "Mobil", emoji: "🚗" },
      { value: "sepeda", label: "Sepeda", emoji: "🚲" },
      { value: "public", label: "Angkutan Umum", emoji: "🚌" },
      { value: "walk", label: "Jalan Kaki", emoji: "🚶" },
    ],
    [],
  );

  const bumpOverlayId = () => {
    overlayIdRef.current += 1;
    setOverlayId(overlayIdRef.current);
  };

  const resetOverlayState = () => {
    setShowOverlay(false);
    setTypedOverlayText("");
    setOverlayText("");
    setOverlaySpeechText("");
    setOverlayTitle("");
    setOverlayCategory("");
    setOverlayCtaLabel("");
    setOverlayAction(null);
    setOverlayFlow(null);
    setOverlayOptions([]);
    setOverlayOptionAction(null);
    setOverlayAutoCloseMs(null);
    clearOverlayTimers();
  };

  const clearOverlayTimers = () => {
    if (overlayTypingRef.current) {
      clearInterval(overlayTypingRef.current);
      overlayTypingRef.current = null;
    }
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
  };

  const buildOverlayAction = (notifItem: any, baseLocation?: LatLng | null) => {
    if (!notifItem?.action || !baseLocation) return null;
    const rawDistance = Number(notifItem.action?.distance_km);
    if (!Number.isFinite(rawDistance) || rawDistance <= 0) return null;
    const target =
      notifItem.action?.target === "charger" ? "charger" : "rest_area";
    const targetLabel =
      notifItem.action?.target_label ??
      (target === "charger" ? "SPKLU terdekat" : "Rest Area terdekat");
    const labelNoRaw = (notifItem.action?.label_no ?? "Tidak").trim();
    const labelNo = labelNoRaw.toLowerCase() === "tida" ? "Tidak" : labelNoRaw;
    return {
      type: target === "charger" ? "offer_charger" : "offer_rest_area",
      target,
      distanceKm: rawDistance,
      labelYes: notifItem.action?.label_yes ?? "Ya, arahkan",
      labelNo,
      origin: baseLocation,
      destination: offsetLocationByKm(baseLocation, rawDistance),
      targetLabel,
    } as OverlayAction;
  };

  const buildMultiStepFlow = (notifItem: any) => {
    const prompt = notifItem?.step_1_prompt;
    if (!prompt) return null;
    const labelYesRaw = (prompt?.cta?.label_yes ?? "Ya").trim();
    const labelNoRaw = (prompt?.cta?.label_no ?? "Tidak").trim();
    const labelNo = labelNoRaw.toLowerCase() === "tida" ? "Tidak" : labelNoRaw;
    return {
      action: {
        type: "multi_step",
        labelYes: labelYesRaw || "Ya",
        labelNo: labelNo || "Tidak",
      } as OverlayAction,
      flow: {
        title: prompt?.title ?? notifItem?.title ?? "Notifikasi",
        category: notifItem?.kategori ?? "",
        responseYes: notifItem?.step_2_response_label_yes,
        responseNo: notifItem?.step_2_response_label_no,
        responseTimeout: notifItem?.step_2_response_timeout,
      } as MultiStepFlow,
    };
  };

  const buildOverlayPayload = (
    notifItem: any,
    baseLocation?: LatLng | null,
  ) => {
    const prompt = getNotifPrompt(notifItem);
    const multiStep = buildMultiStepFlow(notifItem);
    return {
      text: prompt?.message ?? "",
      speechText: getNotifVoiceText(notifItem),
      title: getNotifTitle(notifItem),
      category: notifItem?.kategori ?? "",
      ctaLabel: getNotifCtaLabel(notifItem),
      action: multiStep?.action ?? buildOverlayAction(notifItem, baseLocation),
      flow: multiStep?.flow ?? null,
    };
  };

  const getHotspotCenter = (
    baseLocation: LatLng | null | undefined,
    notifItem: any,
  ) => {
    if (!baseLocation) return null;
    const offset = getNotifMapOffset(notifItem);
    if (!offset) return baseLocation;
    const north = Number(offset?.north ?? 0);
    const east = Number(offset?.east ?? 0);
    if (!Number.isFinite(north) || !Number.isFinite(east)) return baseLocation;
    if (north === 0 && east === 0) return baseLocation;
    return offsetLatLng(baseLocation, north, east);
  };

  const triggerOverlay = (payload: {
    text: string;
    speechText?: string;
    title?: string;
    category?: string;
    ctaLabel?: string;
    action?: OverlayAction | null;
    flow?: MultiStepFlow | null;
    options?: OverlayOption[];
    optionAction?: any | null;
    autoCloseMs?: number | null;
  }) => {
    const now = Date.now();
    const normalizedText = sanitizeSpeechText(
      payload.speechText ?? payload.text,
    );
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
    setOverlaySpeechText(payload.speechText ?? payload.text);
    setOverlayTypingDone(false);
    setOverlayTitle(payload.title ?? "");
    setOverlayCategory(payload.category ?? "");
    setOverlayCtaLabel(payload.ctaLabel ?? "");
    setOverlayAction(payload.action ?? null);
    setOverlayFlow(payload.flow ?? null);
    setOverlayOptions(payload.options ?? []);
    setOverlayOptionAction(payload.optionAction ?? null);
    setOverlayAutoCloseMs(payload.autoCloseMs ?? null);
    overlaySpokenRef.current = false;
    speechLockRef.current = false;
    setShowOverlay(true);
    bumpOverlayId();
  };
  const activeVehicle =
    vehicleOptions.find(
      (option) => option.value === onboarding.primary_vehicle,
    ) ?? vehicleOptions[0];
  const isMotorMode = activeVehicle.value === "motor";
  const isFreeRide = rideMode === "free" || !selectedDestination;
  const placesApiKey =
    Constants.expoConfig?.extra?.googlePlacesApiKey ??
    (Constants as any).manifest?.extra?.googlePlacesApiKey ??
    Constants.expoConfig?.ios?.config?.googleMapsApiKey ??
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ??
    "";
  const demoNotifId =
    Constants.expoConfig?.extra?.demoNotifId ??
    (Constants as any).manifest?.extra?.demoNotifId ??
    process.env.EXPO_PUBLIC_DEMO_NOTIF_ID ??
    "";
  const demoTriggeredRef = useRef(false);

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
    if (actionRouteActive) return;
    if (isResumingRef.current) return;
    notifIndexRef.current = {};
    routeIndexRef.current = 0;
    travelIndexRef.current = 0;
    setRouteZones([]);
    triggeredZoneIdsRef.current = new Set();
    arrivedNotifiedRef.current = false;
    setIsTravelActive(false);
    freeRideNotifIndexRef.current = 0;
    setActionRouteTarget(null);
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
    let isActive = true;

    const prepareSpeech = async () => {
      const available = await isSpeechRecognitionAvailable();
      if (isActive) {
        setSpeechAvailable(available);
      }
    };

    prepareSpeech();

    return () => {
      isActive = false;
    };
  }, []);

  // Cleanup only on unmount, not on isListening change
  useEffect(() => {
    return () => {
      stopListening();
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      if (voiceTextTimeoutRef.current) {
        clearTimeout(voiceTextTimeoutRef.current);
        voiceTextTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      },
      400,
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
    setRideMode("normal");
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
      const finalPoints =
        decoded.length < 3
          ? interpolateRoute(originPoint, {
              latitude: target.latitude,
              longitude: target.longitude,
            })
          : decoded;
      setRoutePoints(finalPoints);
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
    if (actionRouteActive) {
      setRouteZones([]);
      return;
    }
    if (isFreeRide) {
      setRouteZones([]);
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
        (item) =>
          Array.isArray(item.pengguna) &&
          item.pengguna.includes(vehicle) &&
          !shownNotificationIdsRef.current.has(item.id),
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
      if (id.includes("long_drive") || id.includes("long_ride"))
        return "hourglass";
      if (id.includes("blackspot")) return "skull";
      if (id.includes("rain") || id.includes("slippery")) return "rainy";
      if (id.includes("overspeed")) return "speedometer";

      if (id.includes("overspeed") || kategori.includes("kecepatan"))
        return "speedometer";
      if (id.includes("blackspot") || kategori.includes("rawan"))
        return "skull";
      if (id.includes("school") || kategori.includes("sekolah"))
        return "school";
      if (
        id.includes("rain") ||
        kategori.includes("cuaca") ||
        kategori.includes("licin")
      )
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
      : (validRoutePoints[validRoutePoints.length - 1] ?? null);
    const eligiblePoints = validRoutePoints.filter((point) => {
      if (
        originPoint &&
        distanceMeters(originPoint, point) < MIN_ZONE_DISTANCE_FROM_START_METERS
      ) {
        return false;
      }
      if (
        destinationPoint &&
        distanceMeters(destinationPoint, point) <
          MIN_ZONE_DISTANCE_FROM_END_METERS
      ) {
        return false;
      }
      return true;
    });
    const pointsSource =
      eligiblePoints.length >= candidates.length
        ? eligiblePoints
        : validRoutePoints;
    const count = Math.min(candidates.length, pointsSource.length);
    const step = Math.max(1, Math.floor(pointsSource.length / count));

    const selectedCenters: LatLng[] = [];
    for (
      let i = 0;
      i < pointsSource.length && selectedCenters.length < count;
      i += step
    ) {
      const point = pointsSource[i];
      const tooClose = selectedCenters.some(
        (center) =>
          distanceMeters(center, point) < MIN_ZONE_DISTANCE_BETWEEN_METERS,
      );
      if (!tooClose) {
        selectedCenters.push(point);
      }
    }
    if (selectedCenters.length < count) {
      for (
        let i = 0;
        i < pointsSource.length && selectedCenters.length < count;
        i += 1
      ) {
        const point = pointsSource[i];
        const tooClose = selectedCenters.some(
          (center) =>
            distanceMeters(center, point) < MIN_ZONE_DISTANCE_BETWEEN_METERS,
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

    const finalCenters = selectedCenters.slice(0, Math.min(count, 5));
    const zones = finalCenters.map((center, index) => {
      const notifItem = candidates[index];
      return {
        id: `${notifItem.id ?? "zone"}-${index}`,
        center,
        radius: 120 + index * 20,
        icon: getZoneIcon(notifItem),
        title: notifItem.kategori ?? getNotifTitle(notifItem),
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
    isFreeRide,
    actionRouteActive,
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
      const originPoint = location ??
        latestLocationRef.current ?? {
          latitude: -6.914744,
          longitude: 107.60981,
        };
      hasSyncedOriginRef.current = Boolean(location);
      setRouteOrigin(originPoint);
      setSelectedDestination(nextDestination);
      setDestinationQuery(label);
      originalDestinationRef.current = null;
      setShowResumePrompt(false);
      setOnboarding({
        city: label,
        destination_latitude: coords.lat,
        destination_longitude: coords.lng,
      });
      setActionRouteActive(false);
      setActionRouteTarget(null);
      setRideMode("normal");
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
    setActionRouteActive(false);
    setActionRouteTarget(null);
    originalDestinationRef.current = null;
    setShowResumePrompt(false);
    setOnboarding({
      city: undefined,
      destination_latitude: undefined,
      destination_longitude: undefined,
    });
    setRideMode("free");
  };

  useEffect(() => {
    if (!selectedDestination) return;
    requestRoute(selectedDestination);
  }, [
    routeOrigin,
    selectedDestination?.latitude,
    selectedDestination?.longitude,
  ]);

  useEffect(() => {
    if (!selectedDestination) {
      setRideMode("free");
    }
  }, [selectedDestination]);

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
    if (overlayId > 0 && lastTypingOverlayIdRef.current !== overlayId) {
      lastTypingOverlayIdRef.current = overlayId;
      let index = 0;
      if (overlayTypingRef.current) {
        clearInterval(overlayTypingRef.current);
        overlayTypingRef.current = null;
      }
      overlayTypingRef.current = setInterval(() => {
        index += 1;
        setTypedOverlayText(overlayText.slice(0, index));
        if (index >= overlayText.length) {
          if (overlayTypingRef.current) {
            clearInterval(overlayTypingRef.current);
            overlayTypingRef.current = null;
          }
          setOverlayTypingDone(true);
        }
      }, 50);
    }

    if (
      !silentMode &&
      !overlaySpokenRef.current &&
      overlayId > 0 &&
      !speechLockRef.current
    ) {
      if (lastSpokenOverlayIdRef.current === overlayId) {
        return;
      }
      const speechText = sanitizeSpeechText(overlaySpeechText || overlayText);
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
      overlayTimerRef.current = null;
    }
    if (!overlayAction) {
      const closeAfterMs = overlayAutoCloseMs ?? DEFAULT_OVERLAY_AUTO_CLOSE_MS;
      overlayTimerRef.current = setTimeout(() => {
        resetOverlayState();
      }, closeAfterMs);
      return;
    }
    if (overlayAction.type === "multi_step") {
      if (!overlayTypingDone) {
        return;
      }
      const activeFlow = overlayFlow;
      overlayTimerRef.current = setTimeout(() => {
        const response = activeFlow?.responseTimeout;
        if (response?.message) {
          triggerOverlay({
            text: response.message,
            speechText: response.voice_text ?? response.message,
            title: activeFlow?.title ?? overlayTitle ?? "Notifikasi",
            category: activeFlow?.category ?? overlayCategory ?? "",
            action: null,
            flow: null,
            options: response.action?.options ?? [],
            optionAction: response.action ?? null,
            autoCloseMs: response.auto_close
              ? TIMEOUT_OVERLAY_AUTO_CLOSE_MS
              : null,
          });
        } else {
          resetOverlayState();
        }
      }, MULTI_STEP_IDLE_TIMEOUT_MS);
    }
  }, [
    notificationIntervalSeconds,
    overlayAction,
    overlayAutoCloseMs,
    overlayId,
    overlaySpeechText,
    overlayText,
    overlayTypingDone,
    showOverlay,
    silentMode,
    overlayFlow,
    overlayTitle,
    overlayCategory,
  ]);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!isLocationReady || !isMotorMode || routePoints.length > 0) return;

    const interval = setInterval(() => {
      const base = simulatedLocationRef.current ??
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
          (item) =>
            Array.isArray(item.pengguna) && item.pengguna.includes(vehicle),
        );
        if (!candidates.length) return;
        const nextIndex =
          (notifIndexRef.current[vehicle] ?? 0) % candidates.length;
        const notifItem = candidates[nextIndex];
        notifIndexRef.current[vehicle] = nextIndex + 1;

        if (latestLocationRef.current) {
          const hotspot = getHotspotCenter(
            latestLocationRef.current,
            notifItem,
          );
          if (hotspot) {
            setHotspotCenter(hotspot);
            setHotspotRadius(120 + Math.floor(Math.random() * 60));
          }
        }
        triggerOverlay(
          buildOverlayPayload(notifItem, latestLocationRef.current),
        );

        const baseLocation = latestLocationRef.current ?? {
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
              longitude:
                baseLocation.longitude + (Math.random() - 0.5) * 0.0015,
            };
        const targetAddress = isRestCta
          ? "Rest Area terdekat (simulasi)"
          : "Lokasi kejadian (simulasi)";

        Notifications.scheduleNotificationAsync({
          content: {
            title: getNotifTitle(notifItem),
            subtitle: notifItem.kategori,
            body: getNotifMessage(notifItem),
            data: {
              id: notifItem.id,
              kategori: notifItem.kategori,
              trigger: getNotifTrigger(notifItem),
              data_utama: getNotifDataUtama(notifItem),
              pengguna: notifItem.pengguna,
              icon: getNotifIcon(notifItem),
              color: getNotifColor(notifItem),
              cta: notifItem.cta ?? getNotifPrompt(notifItem)?.cta,
              voiceText: getNotifVoiceText(notifItem),
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
        routePoints.length - 1,
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
          (item) =>
            Array.isArray(item.pengguna) && item.pengguna.includes("motor"),
        );
        if (candidates.length) {
          const notifIdx =
            (notifIndexRef.current.motor ?? 0) % candidates.length;
          const notifItem = candidates[notifIdx];
          notifIndexRef.current.motor = notifIdx + 1;
          const hotspot = getHotspotCenter(
            { latitude: nextPoint.latitude, longitude: nextPoint.longitude },
            notifItem,
          );
          if (hotspot) {
            setHotspotCenter(hotspot);
          }
          setHotspotRadius(120);
          triggerOverlay(
            buildOverlayPayload(notifItem, {
              latitude: nextPoint.latitude,
              longitude: nextPoint.longitude,
            }),
          );
          Notifications.scheduleNotificationAsync({
            content: {
              title: getNotifTitle(notifItem),
              subtitle: notifItem.kategori,
              body: getNotifMessage(notifItem),
              data: {
                id: notifItem.id,
                kategori: notifItem.kategori,
                trigger: getNotifTrigger(notifItem),
                data_utama: getNotifDataUtama(notifItem),
                pengguna: notifItem.pengguna,
                icon: getNotifIcon(notifItem),
                color: getNotifColor(notifItem),
                cta: notifItem.cta ?? getNotifPrompt(notifItem)?.cta,
                voiceText: getNotifVoiceText(notifItem),
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
  }, [
    isLocationReady,
    isMotorMode,
    routePoints,
    setLocation,
    notificationsEnabled,
  ]);

  useEffect(() => {
    isTravelPausedRef.current = showOverlay;
  }, [showOverlay]);

  useEffect(() => {
    if (silentMode) {
      Speech.stop();
    }
  }, [silentMode]);

  useEffect(() => {
    if (voiceCaptureText || voiceInputError) {
      setVoiceTextVisible(true);
      const timeout = setTimeout(() => {
        setVoiceCaptureText("");
        setVoiceInputError("");
        setVoiceTextVisible(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [voiceCaptureText, voiceInputError]);

  useEffect(() => {
    if (!location || !routeZones.length || isFreeRide) return;
    if (showOverlay) return;
    const nextZone = routeZones.find(
      (zone) =>
        !triggeredZoneIdsRef.current.has(zone.id) &&
        distanceMeters(location, zone.center) <= zone.radius,
    );
    if (!nextZone) return;
    triggeredZoneIdsRef.current.add(nextZone.id);

    // Track this notification as shown
    if (nextZone.notifItem?.id) {
      shownNotificationIdsRef.current.add(nextZone.notifItem.id);
    }

    setHotspotCenter(nextZone.center);
    setHotspotRadius(nextZone.radius);
    triggerOverlay(buildOverlayPayload(nextZone.notifItem, location));

    Notifications.scheduleNotificationAsync({
      content: {
        title: getNotifTitle(nextZone.notifItem),
        subtitle: nextZone.notifItem?.kategori ?? "",
        body: getNotifMessage(nextZone.notifItem) || "Notifikasi area.",
        data: {
          id: nextZone.notifItem?.id,
          kategori: nextZone.notifItem?.kategori,
          trigger: getNotifTrigger(nextZone.notifItem),
          data_utama: getNotifDataUtama(nextZone.notifItem),
          pengguna: nextZone.notifItem?.pengguna,
          icon: getNotifIcon(nextZone.notifItem),
          color: getNotifColor(nextZone.notifItem),
          cta:
            nextZone.notifItem?.cta ?? getNotifPrompt(nextZone.notifItem)?.cta,
          voiceText: getNotifVoiceText(nextZone.notifItem),
          latitude: nextZone.center.latitude,
          longitude: nextZone.center.longitude,
          user_latitude: location.latitude,
          user_longitude: location.longitude,
        },
      },
      trigger: null,
    }).catch(() => null);
  }, [location, routeZones, showOverlay, isFreeRide]);

  useEffect(() => {
    if (routePoints.length < 2 || isFreeRide) return;
    travelIndexRef.current = 0;
    arrivedNotifiedRef.current = false;
    const interval = setInterval(() => {
      if (!isTravelActiveRef.current) return;
      if (isTravelPausedRef.current) return;
      travelIndexRef.current = Math.min(
        travelIndexRef.current + 1,
        routePoints.length - 1,
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
          const isRestAreaArrival =
            actionRouteActive && actionRouteTarget === "rest_area";
          const isChargerArrival =
            actionRouteActive && actionRouteTarget === "charger";
          const arrivalText = isRestAreaArrival
            ? "Anda sudah sampai di rest area terdekat. Silahkan istirahat sejenak agar bisa fokus dan kembali melanjutkan perjalanan."
            : isChargerArrival
              ? "Anda sudah sampai di fasilitas pengisian kendaraan listrik terdekat. Silahkan lakukan pengisian sebelum melanjutkan perjalanan."
              : ARRIVAL_MESSAGE;
          const arrivalTitle = isRestAreaArrival
            ? "Tiba di Rest Area"
            : isChargerArrival
              ? "Tiba di SPKLU"
              : "Tiba di Tujuan";
          const arrivalCategory = isRestAreaArrival
            ? "Istirahat sejenak"
            : isChargerArrival
              ? "Pengisian kendaraan"
              : "Perjalanan selesai";
          const originalDestination =
            originalDestinationRef.current?.destination;
          setHotspotCenter(endPoint);
          setHotspotRadius(140);
          triggerOverlay({
            text: arrivalText,
            title: arrivalTitle,
            category: arrivalCategory,
            ctaLabel: "",
          });
          if (actionRouteActive && originalDestination) {
            setShowResumePrompt(true);
            setIsTravelActive(false);
          }
          arrivedNotifiedRef.current = true;

          Notifications.scheduleNotificationAsync({
            content: {
              title: arrivalTitle,
              subtitle: arrivalCategory,
              body: arrivalText,
              data: {
                id: "arrival_notice",
                kategori: arrivalCategory,
                trigger: "route_arrival",
                data_utama: ["gps", "rute_aktif"],
                pengguna: [onboarding.primary_vehicle ?? "motor"],
                icon: "checkmark",
                color: "#10B981",
                voiceText: arrivalText,
                latitude: endPoint.latitude,
                longitude: endPoint.longitude,
                user_latitude: endPoint.latitude,
                user_longitude: endPoint.longitude,
              },
            },
            trigger: null,
          }).catch(() => null);
        }
        if (!actionRouteActive) {
          setRoutePoints([]);
          setRouteZones([]);
          setRouteOrigin(null);
        }
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isFreeRide, routePoints, setLocation]);

  useEffect(() => {
    if (!isFreeRide) return;
    const interval = setInterval(() => {
      if (!isTravelActiveRef.current) return;
      const base = simulatedLocationRef.current ??
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
      setIsLocationReady(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [isFreeRide, setLocation]);

  useEffect(() => {
    if (!demoNotifId || demoTriggeredRef.current) return;
    const candidates = [...(notifFreeData as any[]), ...(notifData as any[])];
    const demoNotif = candidates.find((item) => item?.id === demoNotifId);
    if (!demoNotif) return;
    const baseLocation = latestLocationRef.current ??
      location ?? {
        latitude: -6.914744,
        longitude: 107.60981,
      };
    triggerOverlay(buildOverlayPayload(demoNotif, baseLocation));
    demoTriggeredRef.current = true;
  }, [demoNotifId, location]);

  useEffect(() => {
    if (!isFreeRide) return;
    const interval = setInterval(() => {
      if (!isTravelActiveRef.current) return;
      const rawVehicle = activeVehicleRef.current ?? "motor";
      const vehicle = rawVehicle === "public" ? "angkutan_umum" : rawVehicle;
      const candidates = (notifFreeData as any[])
        .filter(
          (item) =>
            Array.isArray(item.pengguna) && item.pengguna.includes(vehicle),
        )
        .sort((a, b) => {
          const na = Number(a?.no ?? 0);
          const nb = Number(b?.no ?? 0);
          if (Number.isFinite(na) && Number.isFinite(nb)) {
            return na - nb;
          }
          return 0;
        });
      if (!candidates.length) return;
      const nextIndex = freeRideNotifIndexRef.current % candidates.length;
      const notifItem = candidates[nextIndex];
      freeRideNotifIndexRef.current = nextIndex + 1;

      if (latestLocationRef.current) {
        const hotspot = getHotspotCenter(latestLocationRef.current, notifItem);
        if (hotspot) {
          setHotspotCenter(hotspot);
          setHotspotRadius(120 + Math.floor(Math.random() * 60));
        }
      }

      triggerOverlay(buildOverlayPayload(notifItem, latestLocationRef.current));

      const baseLocation = latestLocationRef.current ?? {
        latitude: -6.914744,
        longitude: 107.60981,
      };
      Notifications.scheduleNotificationAsync({
        content: {
          title: getNotifTitle(notifItem),
          subtitle: notifItem.kategori,
          body: getNotifMessage(notifItem),
          data: {
            id: notifItem.id,
            kategori: notifItem.kategori,
            trigger: getNotifTrigger(notifItem),
            data_utama: getNotifDataUtama(notifItem),
            pengguna: notifItem.pengguna,
            icon: getNotifIcon(notifItem),
            color: getNotifColor(notifItem),
            cta: notifItem.cta ?? getNotifPrompt(notifItem)?.cta,
            voiceText: getNotifVoiceText(notifItem),
            latitude: baseLocation.latitude,
            longitude: baseLocation.longitude,
            user_latitude: baseLocation.latitude,
            user_longitude: baseLocation.longitude,
          },
        },
        trigger: null,
      }).catch(() => null);
    }, 30_000);

    return () => clearInterval(interval);
  }, [isFreeRide]);

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
      250,
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
      300,
    );
  };

  const handleLogout = () => {
    logout();
    router.replace("/onboarding");
  };

  const handleOverlayAction = (decision: "accept" | "decline") => {
    if (!overlayAction) {
      resetOverlayState();
      return;
    }

    if (overlayAction.type === "multi_step") {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
      const response =
        decision === "accept"
          ? overlayFlow?.responseYes
          : overlayFlow?.responseNo;
      if (response?.message) {
        triggerOverlay({
          text: response.message,
          speechText: response.voice_text ?? response.message,
          title: overlayFlow?.title ?? overlayTitle ?? "Notifikasi",
          category: overlayFlow?.category ?? overlayCategory ?? "",
          action: null,
          flow: null,
          options: response.action?.options ?? [],
          optionAction: response.action ?? null,
          autoCloseMs: response.auto_close
            ? TIMEOUT_OVERLAY_AUTO_CLOSE_MS
            : null,
        });
      } else {
        resetOverlayState();
      }
      return;
    }

    if (decision === "decline") {
      resetOverlayState();
      return;
    }

    if (selectedDestination) {
      originalDestinationRef.current = {
        destination: selectedDestination,
        city: onboarding.city,
        latitude: onboarding.destination_latitude,
        longitude: onboarding.destination_longitude,
      };
    }

    const originPoint = latestLocationRef.current ?? overlayAction.origin;
    const destinationPoint = offsetLocationByKm(
      originPoint,
      overlayAction.distanceKm,
    );
    setRouteOrigin(originPoint);
    setSelectedDestination({
      label: overlayAction.targetLabel,
      latitude: destinationPoint.latitude,
      longitude: destinationPoint.longitude,
    });
    setDestinationQuery(overlayAction.targetLabel);
    setOnboarding({
      city: overlayAction.targetLabel,
      destination_latitude: destinationPoint.latitude,
      destination_longitude: destinationPoint.longitude,
    });
    setRoutePoints(interpolateRoute(originPoint, destinationPoint));
    setRouteZones([]);
    triggeredZoneIdsRef.current = new Set();
    hasSyncedOriginRef.current = true;
    arrivedNotifiedRef.current = false;
    setRideMode("normal");
    setActionRouteActive(true);
    setActionRouteTarget(overlayAction.target);
    setIsTravelActive(true);
    resetOverlayState();
    setShowResumePrompt(false);
    requestRoute(
      {
        label: overlayAction.targetLabel,
        latitude: destinationPoint.latitude,
        longitude: destinationPoint.longitude,
      },
      originPoint,
    );
  };

  const handleOverlayOptionSelect = (option: OverlayOption) => {
    if (overlayOptionAction?.confirmation_message) {
      triggerOverlay({
        text: overlayOptionAction.confirmation_message,
        speechText: overlayOptionAction.confirmation_voice_text,
        title: overlayTitle || "Notifikasi",
        category: overlayCategory ?? "",
        action: null,
        flow: null,
      });
      return;
    }
    console.log("✅ Option selected:", option.id, option.label);
    resetOverlayState();
  };

  const handleResumePrompt = async () => {
    const originPoint = latestLocationRef.current ?? routeOrigin;
    const resumeDestination = originalDestinationRef.current?.destination;
    if (!originPoint || !resumeDestination) {
      setShowResumePrompt(false);
      return;
    }
    isResumingRef.current = true;
    setIsTravelActive(false);
    setRouteOrigin(originPoint);
    setSelectedDestination(resumeDestination);
    setDestinationQuery(resumeDestination.label);
    setOnboarding({
      city: resumeDestination.label,
      destination_latitude: resumeDestination.latitude,
      destination_longitude: resumeDestination.longitude,
    });
    setRoutePoints([]);
    setRouteZones([]);
    triggeredZoneIdsRef.current = new Set();
    hasSyncedOriginRef.current = true;
    arrivedNotifiedRef.current = false;
    setRideMode("normal");
    setActionRouteActive(false);
    setActionRouteTarget(null);
    originalDestinationRef.current = null;
    setShowResumePrompt(false);

    // Wait for route to be fetched and set
    await requestRoute(resumeDestination, originPoint);

    // Brief delay after route is ready, then start travel
    setTimeout(() => {
      setIsTravelActive(true);
      // Reset resuming flag after travel is active
      setTimeout(() => {
        isResumingRef.current = false;
      }, 500);
    }, 300);
  };

  const toggleVoiceInput = async () => {
    if (!speechAvailable) return;

    const clearVoiceTimeout = () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
    };

    const clearVoiceTextTimeout = () => {
      if (voiceTextTimeoutRef.current) {
        clearTimeout(voiceTextTimeoutRef.current);
        voiceTextTimeoutRef.current = null;
      }
    };

    const scheduleVoiceTextClear = () => {
      clearVoiceTextTimeout();
      setVoiceTextVisible(true);
      voiceTextTimeoutRef.current = setTimeout(() => {
        setVoiceCaptureText("");
        setVoiceInputError("");
        setVoiceTextVisible(false);
      }, 3000);
    };

    const startVoiceTimeout = () => {
      clearVoiceTimeout();
      console.log("⏱️ Starting voice timeout (7s)");
      voiceTimeoutRef.current = setTimeout(async () => {
        console.log("⏱️ Voice timeout reached - stopping");
        await stopListening();
        setIsListening(false);
      }, 7000);
    };

    const handleVoiceResult = async (text: string, isFinal?: boolean) => {
      console.log(
        `📥 Voice result received - isFinal: ${isFinal}, text: "${text}"`,
      );
      startVoiceTimeout();
      if (isFinal) {
        setVoiceCaptureText(text);
        scheduleVoiceTextClear();
        const normalized = text.toLowerCase();

        // Debug log - tampilkan apa yang diucapkan
        console.log("🎤 Voice Input:", text);
        console.log("📝 Normalized:", normalized);
        console.log("🚗 Vehicle Mode:", activeVehicle.value);

        // Check for keyword-triggered notifications (priority check)
        const vehicleMode =
          activeVehicle.value === "public"
            ? "angkutan_umum"
            : activeVehicle.value;

        // Search in route-based notifications (notifData)
        const routeNotif = (notifData as any[]).find(
          (item) =>
            item.pengguna?.includes(vehicleMode) &&
            item.keywords?.some((keyword: string) =>
              normalized.includes(keyword.toLowerCase()),
            ),
        );

        if (routeNotif) {
          console.log("✅ Match found (route):", getNotifTitle(routeNotif));
          const baseLocation = latestLocationRef.current ??
            location ?? {
              latitude: -6.914744,
              longitude: 107.60981,
            };

          triggerOverlay(buildOverlayPayload(routeNotif, baseLocation));

          // Track as shown
          if (routeNotif.id) {
            shownNotificationIdsRef.current.add(routeNotif.id);
          }

          clearVoiceTimeout();
          await stopListening();
          setIsListening(false);
          return;
        }

        // Search in free ride notifications (notifFreeData)
        const freeNotif = (notifFreeData as any[]).find(
          (item) =>
            item.pengguna?.includes(vehicleMode) &&
            item.keywords?.some((keyword: string) =>
              normalized.includes(keyword.toLowerCase()),
            ),
        );

        if (freeNotif) {
          console.log("✅ Match found (free):", getNotifTitle(freeNotif));
          const baseLocation = latestLocationRef.current ??
            location ?? {
              latitude: -6.914744,
              longitude: 107.60981,
            };

          triggerOverlay(buildOverlayPayload(freeNotif, baseLocation));

          // Track as shown
          if (freeNotif.id) {
            shownNotificationIdsRef.current.add(freeNotif.id);
          }

          clearVoiceTimeout();
          await stopListening();
          setIsListening(false);
          return;
        }

        // Tidak ada match dengan keywords
        console.log("❌ No keyword match found");

        if (overlayOptions.length && overlayTypingDone) {
          const matchedOption = overlayOptions.find((option) =>
            normalized.includes(option.label.toLowerCase()),
          );
          if (matchedOption) {
            handleOverlayOptionSelect(matchedOption);
          }
        }
        if (overlayAction && overlayTypingDone) {
          const isYes =
            normalized.includes("ya") ||
            normalized.includes("iya") ||
            normalized.includes("yes");
          const isNo =
            normalized.includes("tidak") ||
            normalized.includes("no") ||
            normalized.includes("tida");
          if (isYes) {
            handleOverlayAction("accept");
          } else if (isNo) {
            handleOverlayAction("decline");
          }
        }
        if (showResumePrompt) {
          const isResume =
            normalized.includes("ya") ||
            normalized.includes("iya") ||
            normalized.includes("yes") ||
            normalized.includes("lanjut") ||
            normalized.includes("lanjutkan");
          if (isResume) {
            handleResumePrompt();
          }
        }
        if (
          normalized.includes("mulai") ||
          normalized.includes("start") ||
          normalized.includes("star") ||
          normalized.includes("jalan")
        ) {
          setIsTravelActive(true);
        }
        clearVoiceTimeout();
        await stopListening();
        setIsListening(false);
      }
    };

    const handleVoiceError = (error: string) => {
      console.log("🔴 Voice Error:", error);
      clearVoiceTimeout();
      clearVoiceTextTimeout();

      // Don't show "No match" error, just silently restart
      if (error.includes("No match")) {
        console.log("⚠️ No match - ignoring error");
      } else {
        setVoiceInputError(error);
        scheduleVoiceTextClear();
      }

      stopListening();
      setIsListening(false);
    };

    if (isListening) {
      console.log("🛑 Stopping voice input...");
      clearVoiceTimeout();
      clearVoiceTextTimeout();
      setIsListening(false);
      await stopListening();
      console.log("✅ Voice stopped");
      return;
    }

    console.log("🎙️ Starting voice input...");
    setVoiceInputError("");
    setVoiceCaptureText("");
    setVoiceTextVisible(false);
    clearVoiceTextTimeout();

    try {
      setIsListening(true);
      startVoiceTimeout();
      await startListening(handleVoiceResult, handleVoiceError, false);
      console.log("✅ Voice listening started");
    } catch (error) {
      console.log("🔴 Failed to start listening:", error);
      setIsListening(false);
      setVoiceInputError("Gagal memulai voice input");
      scheduleVoiceTextClear();
    }
  };

  return {
    mapRef,
    location,
    zoomDelta,
    isMotorMode,
    isFreeRide,
    rideMode,
    setRideMode,
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
    overlayTypingDone,
    overlayCategory,
    overlayCtaLabel,
    overlayAction,
    overlayOptions,
    handleOverlayAction,
    handleOverlayOptionSelect,
    handleLogout,
    silentMode,
    setSilentMode,
    showResumePrompt,
    setShowResumePrompt,
    handleResumePrompt,
    speechAvailable,
    isListening,
    voiceInputError,
    voiceCaptureText,
    voiceTextVisible,
    toggleVoiceInput,
    destinationIcon:
      actionRouteTarget === "rest_area"
        ? "bed"
        : actionRouteTarget === "charger"
          ? "flash"
          : "location",
    destinationMarkerVariant: actionRouteTarget,
  };
}
