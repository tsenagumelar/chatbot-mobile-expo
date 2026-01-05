import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video } from "expo-av";
import AppHeader from "@/src/components/AppHeader";
import { COLORS } from "@/src/utils/constants";

type InfoTab = "traffic" | "cctv" | "incidents";

type InfoItem = {
  id: string;
  title: string;
  status: string;
  detail: string;
  time: string;
};

type ListItem = InfoItem | (InfoItem & { video: any });

const dummyTraffic: InfoItem[] = [
  {
    id: "t1",
    title: "Jl. Sudirman → Senayan",
    status: "Padat",
    detail: "Kecepatan rata-rata 18 km/j, antrean 600 m.",
    time: "3 mnt lalu",
  },
  {
    id: "t2",
    title: "Tol Purbaleunyi KM 130",
    status: "Lancar",
    detail: "Semua lajur dibuka, cuaca cerah.",
    time: "8 mnt lalu",
  },
];

const dummyCctv: (InfoItem & { video: any })[] = [
  {
    id: "c1",
    title: "CCTV Alun-Alun",
    status: "Aktif",
    detail: "Menampilkan arus lalin bundaran utama.",
    time: "Live",
    video: require("@/assets/video/1.mp4"),
  },
  {
    id: "c2",
    title: "CCTV Flyover Pasteur",
    status: "Aktif",
    detail: "Kepadatan sedang, jalur kiri lebih lancar.",
    time: "Live",
    video: require("@/assets/video/2.mp4"),
  },
  {
    id: "c3",
    title: "CCTV Simpang Gasibu",
    status: "Aktif",
    detail: "Lalin lancar, cuaca cerah, zebra cross ramai pejalan.",
    time: "Live",
    video: require("@/assets/video/3.mp4"),
  },
];

const dummyIncidents: InfoItem[] = [
  {
    id: "i1",
    title: "Insiden minor di Jl. Dago",
    status: "Ditangani",
    detail: "Tabrakan kecil, tidak ada korban. Petugas mengatur arus.",
    time: "12 mnt lalu",
  },
  {
    id: "i2",
    title: "Pohon tumbang Jl. Setiabudi",
    status: "Proses",
    detail: "Jalur kanan ditutup sementara, gunakan jalur alternatif.",
    time: "25 mnt lalu",
  },
];

export default function InfoScreen() {
  const [activeTab, setActiveTab] = useState<InfoTab>("traffic");

  const data = useMemo<ListItem[]>(() => {
    switch (activeTab) {
      case "traffic":
        return dummyTraffic;
      case "cctv":
        return dummyCctv;
      case "incidents":
      default:
        return dummyIncidents;
    }
  }, [activeTab]);

  const title = useMemo(() => {
    switch (activeTab) {
      case "traffic":
        return "Info Lalu Lintas";
      case "cctv":
        return "CCTV Sekitar";
      case "incidents":
      default:
        return "Kejadian Terbaru";
    }
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader />

      <View style={styles.header}>
        <Text style={styles.screenTitle}>Informasi Sekitar</Text>
        <Text style={styles.screenSubtitle}>
          Status lalu lintas, CCTV, dan kejadian terkini (dummy).
        </Text>
      </View>

      <View style={styles.tabRow}>
        <TabButton
          label="Lalu Lintas"
          active={activeTab === "traffic"}
          onPress={() => setActiveTab("traffic")}
        />
        <TabButton
          label="CCTV"
          active={activeTab === "cctv"}
          onPress={() => setActiveTab("cctv")}
        />
        <TabButton
          label="Kejadian"
          active={activeTab === "incidents"}
          onPress={() => setActiveTab("incidents")}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.cardDetail}>{item.detail}</Text>
            {activeTab === "cctv" && "video" in item && item.video && (
              <View style={styles.videoWrapper}>
                <Video
                  source={item.video}
                  style={styles.video}
                  resizeMode="cover"
                  shouldPlay
                  isLooping
                  useNativeControls
                />
              </View>
            )}
            <Text style={styles.cardTime}>{item.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status.toLowerCase() === "lancar"
      ? "#10B981"
      : status.toLowerCase() === "padat" || status.toLowerCase() === "proses"
      ? "#F59E0B"
      : "#0EA5E9";

  return (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  screenSubtitle: {
    marginTop: 4,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 4,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#0C3AC5",
  },
  tabLabel: {
    fontWeight: "700",
    color: "#374151",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  cardDetail: {
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
  videoWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: 180,
  },
  cardTime: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pillText: {
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },
});
