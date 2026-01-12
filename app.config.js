export default {
  expo: {
    name: "POLANTAS MENYAPA",
    slug: "police-assistant-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/Polantas Logo.png",
    scheme: "policeassistant",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/Polantas Logo.png",
      resizeMode: "contain",
      backgroundColor: "#007AFF",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.policeassistant.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Aplikasi membutuhkan akses lokasi untuk menampilkan posisi Anda di peta dan memberikan informasi lalu lintas yang akurat.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Aplikasi membutuhkan akses lokasi untuk tracking kecepatan dan kondisi lalu lintas.",
        NSUserNotificationUsageDescription:
          "Aplikasi membutuhkan izin notifikasi untuk memberikan peringatan keselamatan dan informasi perjalanan.",
        NSMicrophoneUsageDescription:
          "Aplikasi membutuhkan akses mikrofon untuk fitur voice input.",
        NSSpeechRecognitionUsageDescription:
          "Aplikasi membutuhkan akses speech recognition untuk voice input.",
      },
      config: {
        googleMapsApiKey: "AIzaSyDFmkTTk0jbtExDEE3EuN1HA9AWQu2ZYnc",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/Polantas Logo.png",
        backgroundColor: "#007AFF",
      },
      package: "com.policeassistant.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS",
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
      ],
      usesCleartextTraffic: true,
      config: {
        googleMaps: {
          apiKey: "AIzaSyDFmkTTk0jbtExDEE3EuN1HA9AWQu2ZYnc",
        },
      },
    },
    web: {
      favicon: "./assets/images/Polantas Logo.png",
    },
    plugins: [
      "expo-router",
      "expo-notifications",
      "expo-speech-recognition",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Aplikasi membutuhkan akses lokasi untuk tracking.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    notification: {
      icon: "./assets/images/Polantas Logo.png",
      color: "#007AFF",
    },
    extra: {
      eas: {
        projectId: "131af746-61da-4912-a89f-4217f17d8e10",
      },
    },
  },
};
