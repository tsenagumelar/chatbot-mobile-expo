import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/src/components/AppHeader";
import { useStore } from "@/src/store/useStore";
import type { IncidentReport, IncidentType } from "@/src/types";
import { COLORS } from "@/src/utils/constants";
import { router } from "expo-router";

const INCIDENT_TYPES: { label: string; value: IncidentType }[] = [
  { label: "Kecelakaan", value: "kecelakaan" },
  { label: "Pelanggaran", value: "pelanggaran" },
  { label: "Lainnya", value: "lainnya" },
];

// Data dummy untuk semua laporan
const ALL_REPORTS: IncidentReport[] = [
  {
    id: "dummy-1",
    type: "kecelakaan",
    description: "Tabrakan motor di persimpangan. Kedua pengendara luka ringan.",
    photoUri: undefined,
    isAnonymous: false,
    reporterName: "Ahmad Wijaya",
    address: "Jl. Sudirman No. 45, Jakarta Pusat",
    latitude: -6.2088,
    longitude: 106.8456,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "dummy-2",
    type: "pelanggaran",
    description: "Parkir sembarangan di trotoar menghalangi pejalan kaki.",
    photoUri: undefined,
    isAnonymous: true,
    address: "Jl. Gatot Subroto, Jakarta Selatan",
    latitude: -6.2297,
    longitude: 106.8114,
    createdAt: Date.now() - 7200000,
  },
  {
    id: "dummy-3",
    type: "lainnya",
    customType: "Lampu lalu lintas rusak",
    description: "Lampu merah di persimpangan tidak menyala sejak kemarin.",
    photoUri: undefined,
    isAnonymous: false,
    reporterName: "Siti Nurhaliza",
    address: "Jl. Thamrin, Jakarta Pusat",
    latitude: -6.1944,
    longitude: 106.8229,
    createdAt: Date.now() - 14400000,
  },
  {
    id: "dummy-4",
    type: "kecelakaan",
    description: "Mobil menabrak pembatas jalan. Tidak ada korban jiwa.",
    photoUri: undefined,
    isAnonymous: false,
    reporterName: "Budi Santoso",
    address: "Jl. Rasuna Said, Jakarta Selatan",
    latitude: -6.2241,
    longitude: 106.8294,
    createdAt: Date.now() - 21600000,
  },
  {
    id: "dummy-5",
    type: "pelanggaran",
    description: "Pengendara menerobos lampu merah dengan kecepatan tinggi.",
    photoUri: undefined,
    isAnonymous: true,
    address: "Jl. Kuningan, Jakarta Selatan",
    latitude: -6.2382,
    longitude: 106.8317,
    createdAt: Date.now() - 28800000,
  },
];

export default function ReportsScreen() {
  const {
    location,
    address,
    user,
    reports,
    addReport,
    deleteReport,
    hasLocationPermission,
    logout,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [showModal, setShowModal] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>("kecelakaan");
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentLocationLabel = useMemo(() => {
    if (address && address !== "Unknown location") return address;
    if (location) {
      return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(
        5
      )}`;
    }
    return "Lokasi belum tersedia";
  }, [address, location]);

  const pickFromLibrary = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Izin dibutuhkan",
        "Berikan akses galeri untuk melampirkan foto."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Izin kamera dibutuhkan",
        "Aktifkan izin kamera untuk mengambil foto."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
    }
  };

  const handlePhotoAction = () => {
    Alert.alert(
      "Lampirkan foto",
      "Pilih sumber foto",
      [
        { text: "Batal", style: "cancel" },
        { text: "Kamera", onPress: takePhoto },
        { text: "Galeri", onPress: pickFromLibrary },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = () => {
    if (!hasLocationPermission || !location) {
      Alert.alert("Lokasi wajib", "Aktifkan lokasi sebelum mengirim laporan.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Isi penjelasan", "Tuliskan penjelasan kejadian.");
      return;
    }

    if (incidentType === "lainnya" && !customType.trim()) {
      Alert.alert("Isi jenis kejadian", "Tuliskan jenis kejadian lainnya.");
      return;
    }

    setSubmitting(true);

    const now = Date.now();
    const report: IncidentReport = {
      id: now.toString(),
      type: incidentType,
      customType: incidentType === "lainnya" ? customType.trim() : undefined,
      description: description.trim(),
      photoUri,
      isAnonymous,
      reporterName: isAnonymous ? undefined : user?.name,
      reporterPhone: isAnonymous ? undefined : user?.phone,
      reporterEmail: isAnonymous ? undefined : user?.email,
      address: currentLocationLabel,
      latitude: location?.latitude,
      longitude: location?.longitude,
      createdAt: now,
    };

    addReport(report);

    // reset form
    setDescription("");
    setCustomType("");
    setIncidentType("kecelakaan");
    setPhotoUri(undefined);
    setIsAnonymous(false);
    setSubmitting(false);
    setShowModal(false);

    Alert.alert("Laporan dikirim", "Terima kasih atas laporannya.");
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const displayReports = activeTab === "all" ? ALL_REPORTS : reports;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader
        onLogout={() => {
          logout();
          router.replace("/login");
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Insiden</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Buat Laporan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
            Semua Laporan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "mine" && styles.tabActive]}
          onPress={() => setActiveTab("mine")}
        >
          <Text style={[styles.tabText, activeTab === "mine" && styles.tabTextActive]}>
            Laporan Saya
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {displayReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={56}
                color={COLORS.TEXT_SECONDARY}
              />
              <Text style={styles.emptyText}>
                {activeTab === "all"
                  ? "Belum ada laporan tersedia."
                  : "Belum ada laporan. Mulai dengan membuat laporan baru."}
              </Text>
            </View>
          ) : (
            displayReports.map((report) => (
              <View key={report.id} style={styles.reportItem}>
                <View style={styles.reportHeader}>
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>
                      {report.type === "lainnya"
                        ? report.customType || "Lainnya"
                        : report.type}
                    </Text>
                  </View>
                  {activeTab === "mine" && (
                    <TouchableOpacity
                      onPress={() => deleteReport(report.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.reportMeta}>
                  {report.isAnonymous
                    ? "Anonim"
                    : report.reporterName || "Tanpa nama"}{" "}
                  • {formatDate(report.createdAt)}
                </Text>
                <Text style={styles.reportAddress}>
                  {report.address || "Lokasi tidak tersedia"}
                </Text>
                <Text style={styles.reportDescription}>
                  {report.description}
                </Text>
                {report.photoUri && (
                  <Image
                    source={{ uri: report.photoUri }}
                    style={styles.reportPhoto}
                  />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal Form Laporan */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Laporan Baru</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.section}>
                <Text style={styles.label}>Lokasi saat ini</Text>
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={18} color={COLORS.PRIMARY} />
                  <Text style={styles.locationText}>{currentLocationLabel}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Jenis kejadian</Text>
                <View style={styles.typeRow}>
                  {INCIDENT_TYPES.map((option) => {
                    const active = incidentType === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.typeChip,
                          active && styles.typeChipActive,
                        ]}
                        onPress={() => setIncidentType(option.value)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            active && styles.typeChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {incidentType === "lainnya" && (
                  <TextInput
                    style={styles.input}
                    placeholder="Tuliskan jenis kejadian"
                    placeholderTextColor={COLORS.TEXT_SECONDARY}
                    value={customType}
                    onChangeText={setCustomType}
                  />
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Penjelasan</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Jelaskan kronologi singkat"
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Foto kejadian</Text>
                <TouchableOpacity style={styles.photoButton} onPress={handlePhotoAction}>
                  <Ionicons name="image" size={18} color="#fff" />
                  <Text style={styles.photoButtonText}>
                    {photoUri ? "Ganti foto" : "Lampirkan foto"}
                  </Text>
                </TouchableOpacity>
                {photoUri && (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                )}
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Anonim?</Text>
                  <Text style={styles.hint}>
                    Jika aktif, identitas tidak dikirim bersama laporan.
                  </Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  thumbColor={isAnonymous ? COLORS.PRIMARY : "#f4f3f4"}
                  trackColor={{ false: "#D1D5DB", true: "#C7D2FE" }}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitText}>
                  {submitting ? "Mengirim..." : "Kirim Laporan"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.CARD,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabActive: {
    backgroundColor: "#E5EDFF",
    borderColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: COLORS.PRIMARY,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#E5F1FF",
    borderRadius: 10,
  },
  locationText: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: COLORS.BACKGROUND,
  },
  typeChipActive: {
    backgroundColor: "#E5EDFF",
    borderColor: COLORS.PRIMARY,
  },
  typeChipText: {
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  typeChipTextActive: {
    color: COLORS.PRIMARY,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.BACKGROUND,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  photoButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  photoPreview: {
    marginTop: 10,
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  hint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  reportItem: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 12,
    gap: 6,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typePill: {
    backgroundColor: "#E5EDFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typePillText: {
    color: COLORS.PRIMARY,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  reportMeta: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  reportAddress: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
  },
  reportDescription: {
    color: COLORS.TEXT_PRIMARY,
  },
  reportPhoto: {
    marginTop: 6,
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  modalScroll: {
    flexGrow: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
