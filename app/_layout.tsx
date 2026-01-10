import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from "react";
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerForPushNotificationsAsync } from "@/src/services/notifications";

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
      }
    );

    return () => {
      isMounted = false;
      receivedListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="library" options={{ headerShown: false }} />
        <Stack.Screen name="pdf-viewer" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
