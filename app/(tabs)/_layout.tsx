import { useStore } from "@/src/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user, hasLocationPermission } = useStore();

  if (!user || !hasLocationPermission) {
    return <Redirect href="/login" />;
  }

  const tabBarHeight = 70;
  const bottomSpacing = Platform.OS === "android" ? insets.bottom + 12 : 16;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0C3AC5",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderTopWidth: 0,
          elevation: 8,
          marginHorizontal: 16,
          marginBottom: bottomSpacing,
          borderRadius: 50,
          height: tabBarHeight,
          paddingTop: 4,
          paddingBottom: 8,
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          paddingTop: 2,
          justifyContent: "center",
        },
        headerShown: false,
        sceneStyle: {
          paddingBottom: tabBarHeight + bottomSpacing + 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer]}>
              <Ionicons
                name={focused ? "map" : "map-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer]}>
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: "Info",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer]}>
              <Ionicons
                name={focused ? "information-circle" : "information-circle-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Laporan",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer]}>
              <Ionicons
                name={focused ? "document-text" : "document-text-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: "Kuis",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer]}>
              <Ionicons
                name={focused ? "trophy" : "trophy-outline"}
                size={26}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
    borderRadius: 25,
  },
  iconContainerActive: {
    backgroundColor: "rgba(12, 58, 197, 0.12)",
  },
});
