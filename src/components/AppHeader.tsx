import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "@/src/store/useStore";

interface Props {
  onLogout?: () => void;
}

export const AppHeader: React.FC<Props> = ({ onLogout }) => {
  const { user } = useStore();

  return (
    <View style={styles.container}>
      <View style={styles.nameBlock}>
        <Text style={styles.greeting}>
          Halo{user?.name ? "," : ""} {user?.name || "Pengguna"}
        </Text>
      </View>
      <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  nameBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0B1E6B",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
});

export default AppHeader;
