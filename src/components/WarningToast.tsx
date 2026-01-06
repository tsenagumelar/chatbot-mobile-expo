import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

interface WarningToastProps {
  visible: boolean;
  onHide: () => void;
}

const polantasLogo = require("@/assets/images/Polantas Logo.png");

export default function WarningToast({ visible, onHide }: WarningToastProps) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 6 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 6000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toast}>
        {/* Logo Polantas */}
        <Image source={polantasLogo} style={styles.logo} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.title}>Peringatan Area Rawan</Text>
          </View>
          <Text style={styles.message}>
            Waspada ya Sobat! Kamu sedang melewati area rawan kecelakaan. Di
            lokasi kamu saat ini pernah terjadi kecelakaan beruntun lho. Yuk,
            kurangi kecepatan dan fokus pada jalan. Keselamatanmu nomor satu.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    color: "#4B5563",
  },
});
