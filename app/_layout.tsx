import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from "react";
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerForPushNotificationsAsync } from "@/src/services/notifications";
import { useStore } from "@/src/store/useStore";
import type { AppNotification, NotificationCTA, NotificationSeverity } from "@/src/types";
import { pickSeverityFromColor } from "@/src/utils/notifications";

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { upsertNotification, markNotificationRead } = useStore();

  const buildNotificationPayload = (
    notification: Notifications.Notification,
    read: boolean
  ): AppNotification => {
    const { content } = notification.request;
    const rawData = (content.data ?? {}) as Record<string, unknown>;
    const scenarioId =
      typeof rawData.id === "string" ? rawData.id : undefined;

    const latitudeRaw =
      rawData.latitude ??
      rawData.lat ??
      (typeof rawData.coords === "string" ? rawData.coords.split(",")[0] : undefined);
    const longitudeRaw =
      rawData.longitude ??
      rawData.lng ??
      (typeof rawData.coords === "string" ? rawData.coords.split(",")[1] : undefined);
    const latitude =
      typeof latitudeRaw === "number"
        ? latitudeRaw
        : typeof latitudeRaw === "string"
        ? Number.parseFloat(latitudeRaw)
        : undefined;
    const longitude =
      typeof longitudeRaw === "number"
        ? longitudeRaw
        : typeof longitudeRaw === "string"
        ? Number.parseFloat(longitudeRaw)
        : undefined;
    const coords =
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { latitude: latitude as number, longitude: longitude as number }
        : undefined;

    const cta =
      rawData.cta && typeof rawData.cta === "object"
        ? (rawData.cta as NotificationCTA)
        : undefined;

    const type =
      typeof rawData.type === "string"
        ? (rawData.type as NotificationSeverity)
        : pickSeverityFromColor(
            typeof rawData.color === "string" ? rawData.color : undefined
          );

    return {
      id: notification.request.identifier,
      title: content.subtitle ?? content.title ?? "Notifikasi",
      message: content.body ?? "",
      receivedAt: Date.now(),
      read,
      data: {
        scenarioId,
        kategori:
          typeof rawData.kategori === "string" ? rawData.kategori : undefined,
        trigger:
          typeof rawData.trigger === "string" ? rawData.trigger : undefined,
        data_utama: Array.isArray(rawData.data_utama)
          ? (rawData.data_utama as string[])
          : undefined,
        sapaan_ringkas:
          typeof rawData.sapaan_ringkas === "string"
            ? rawData.sapaan_ringkas
            : undefined,
        pengguna: Array.isArray(rawData.pengguna)
          ? (rawData.pengguna as string[])
          : undefined,
        icon: typeof rawData.icon === "string" ? rawData.icon : undefined,
        color: typeof rawData.color === "string" ? rawData.color : undefined,
        type,
        address: typeof rawData.address === "string" ? rawData.address : undefined,
        coords,
        cta,
      },
    };
  };

  useEffect(() => {
    let isMounted = true;

    registerForPushNotificationsAsync().then((token) => {
      if (token && isMounted) {
        console.log("Expo push token:", token);
      }
    });

    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification.request.content);
        const appNotification = buildNotificationPayload(notification, false);
        upsertNotification(appNotification);
        const data = notification.request.content.data as {
          voiceText?: string;
        };
        const voiceText =
          data?.voiceText ??
          notification.request.content.subtitle ??
          notification.request.content.title ??
          "";
        if (voiceText) {
          Speech.stop();
          Speech.speak(voiceText, {
            language: "id-ID",
            rate: 0.9,
            pitch: 1.1,
          });
        }
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response:", response.notification.request.content);
        const appNotification = buildNotificationPayload(
          response.notification,
          true
        );
        upsertNotification(appNotification);
        markNotificationRead(appNotification.id);
        router.push(`/notifications/${appNotification.id}`);
      }
    );

    return () => {
      isMounted = false;
      receivedListener.remove();
      responseListener.remove();
    };
  }, [markNotificationRead, upsertNotification]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="library" options={{ headerShown: false }} />
        <Stack.Screen name="pdf-viewer" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
