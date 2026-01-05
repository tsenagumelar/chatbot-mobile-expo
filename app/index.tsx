import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "@/src/store/useStore";
import { COLORS } from "@/src/utils/constants";

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
        <View style={styles.badge}>
          <Text style={styles.badgeText}>LL</Text>
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
    backgroundColor: "#0C3AC5",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoWrapper: {
    alignItems: "center",
    gap: 12,
  },
  badge: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#163EDB",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 22,
  },
  title: {
    color: "#fff",
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
