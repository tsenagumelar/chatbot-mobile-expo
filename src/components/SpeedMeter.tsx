import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, SPEED_LIMITS } from "../utils/constants";

interface SpeedMeterProps {
  speed: number;
  limit?: number;
}

export default function SpeedMeter({
  speed,
  limit = SPEED_LIMITS.CITY,
}: SpeedMeterProps) {
  const isOverLimit = speed > limit;
  const speedPercentage = Math.min((speed / 120) * 100, 100); // Max 120 km/h for display

  return (
    <View style={styles.container}>
      <View style={[styles.meter, isOverLimit && styles.meterDanger]}>
        <Text style={styles.speedText}>{Math.round(speed)}</Text>
        <Text style={styles.unitText}>km/h</Text>
      </View>

      {/* Speed bar indicator */}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            { width: `${speedPercentage}%` },
            isOverLimit && styles.barDanger,
          ]}
        />
      </View>

      {isOverLimit && (
        <Text style={styles.warningText}>⚠️ Melebihi batas {limit} km/h</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
  },
  meter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  meterDanger: {
    backgroundColor: COLORS.DANGER,
  },
  speedText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
  },
  unitText: {
    fontSize: 16,
    color: "white",
    marginTop: -4,
  },
  barContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 4,
  },
  barDanger: {
    backgroundColor: COLORS.DANGER,
  },
  warningText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.DANGER,
    fontWeight: "600",
  },
});
