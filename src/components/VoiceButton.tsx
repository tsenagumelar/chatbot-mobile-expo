import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { COLORS } from "../utils/constants";

interface VoiceButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function VoiceButton({
  onPress,
  disabled = false,
}: VoiceButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, isPressed && styles.iconPressed]}>
        <Ionicons name="mic-outline" size={24} color="white" />
      </View>
      {isPressed && (
        <View style={styles.pulseContainer}>
          <View style={styles.pulse} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  iconPressed: {
    backgroundColor: COLORS.DANGER,
    transform: [{ scale: 0.95 }],
  },
  pulseContainer: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  pulse: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 59, 48, 0.3)",
    position: "absolute",
  },
});
