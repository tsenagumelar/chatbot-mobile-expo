import { useStore } from "@/src/store/useStore";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const polantasLogo = require("@/assets/images/Polantas Logo.png");

export default function SplashScreen() {
  const { user, hasLocationPermission } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && hasLocationPermission) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [user, hasLocationPermission]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.logoWrapper}>
        <View style={styles.logoFrame}>
          <Image source={polantasLogo} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>POLANTAS</Text>
        <Text style={styles.title}>MENYAPA</Text>
      </View>
      <View style={styles.footer}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.loadingText}>Mempersiapkan aplikasi...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoWrapper: {
    alignItems: "center",
    gap: 12,
  },
  logoFrame: {
    width: 140,
    height: 160,
    borderRadius: 16,
    padding: 10,
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  title: {
    color: "#0C3AC5",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.85,
  },
});
