import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import MapView from "react-native-maps";

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

export default function useRoutesScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const newUserLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLoc(newUserLoc);

      if (mapRef.current) {
        mapRef.current.animateCamera(
          { center: newUserLoc, zoom: 15 },
          { duration: 1000 }
        );
      }
    })();
  }, []);

  const areas = useMemo(() => {
    if (!userLoc) return [];

    const dangerCenter = offsetLatLng(userLoc, +250, +120);
    const schoolCenter = offsetLatLng(userLoc, -150, -200);

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
  }, [userLoc]);

  const restArea = useMemo(() => {
    if (!userLoc) return null;
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

  return {
    mapRef,
    userLoc,
    route,
    loadingRoute,
    areas,
    restArea,
    initialRegion,
    onPressRestRoute,
    centroid,
  };
}
