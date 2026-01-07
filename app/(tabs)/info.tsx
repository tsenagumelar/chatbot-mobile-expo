import { AppHeader } from "@/src/components/AppHeader";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type InfoTab = "traffic" | "cctv" | "incidents";

type InfoItem = {
  id: string;
  title: string;
  status: string;
  detail: string;
  time: string;
  reportedBy?: string;
  validVotes?: number;
  invalidVotes?: number;
};

type ListItem = InfoItem | (InfoItem & { video?: any; image?: any });

const dummyTraffic: (InfoItem & { image: any })[] = [
  {
    id: "t1",
    title: "Jl. Sudirman → Senayan",
    status: "Padat",
    detail: "Kecepatan rata-rata 18 km/j, antrean 600 m.",
    time: "3 mnt lalu",
    image: require("@/assets/info/Lalu Lintas 1.jpg"),
  },
  {
    id: "t2",
    title: "Tol Purbaleunyi KM 130",
    status: "Lancar",
    detail: "Semua lajur dibuka, cuaca cerah.",
    time: "8 mnt lalu",
    image: require("@/assets/info/Lalu Lintas 2.jpg"),
  },
  {
    id: "t3",
    title: "Jl. Asia Afrika",
    status: "Lancar",
    detail: "Arus lalu lintas lancar, tidak ada kendala.",
    time: "5 mnt lalu",
    image: require("@/assets/info/Lalu Lintas 3.jpg"),
  },
];

const dummyCctv: (InfoItem & { video: any })[] = [
  {
    id: "c1",
    title: "CCTV Alun-Alun",
    status: "Aktif",
    detail: "Menampilkan arus lalin bundaran utama.",
    time: "Live",
    video: require("@/assets/info/CCTV 1.mp4"),
  },
  {
    id: "c2",
    title: "CCTV Flyover Pasteur",
    status: "Aktif",
    detail: "Kepadatan sedang, jalur kiri lebih lancar.",
    time: "Live",
    video: require("@/assets/info/CCTV 2.mp4"),
  },
  {
    id: "c3",
    title: "CCTV Simpang Gasibu",
    status: "Aktif",
    detail: "Lalin lancar, cuaca cerah, zebra cross ramai pejalan.",
    time: "Live",
    video: require("@/assets/info/CCTV 3.mp4"),
  },
];

const dummyIncidents: (InfoItem & { image: any })[] = [
  {
    id: "i1",
    title: "Insiden minor di Jl. Dago",
    status: "Ditangani",
    detail: "Tabrakan kecil, tidak ada korban. Petugas mengatur arus.",
    time: "12 mnt lalu",
    reportedBy: "Ahmad S.",
    validVotes: 12,
    invalidVotes: 2,
    image: require("@/assets/info/Kejadian 1.jpg"),
  },
  {
    id: "i2",
    title: "Pohon tumbang Jl. Setiabudi",
    status: "Proses",
    detail: "Jalur kanan ditutup sementara, gunakan jalur alternatif.",
    time: "25 mnt lalu",
    reportedBy: "Budi W.",
    validVotes: 8,
    invalidVotes: 1,
    image: require("@/assets/info/Kejadian 2.jpg"),
  },
  {
    id: "i3",
    title: "Kecelakaan di Jl. Pasteur",
    status: "Ditangani",
    detail: "Kecelakaan ringan, sudah ditangani petugas.",
    time: "30 mnt lalu",
    reportedBy: "Siti N.",
    validVotes: 15,
    invalidVotes: 0,
    image: require("@/assets/info/Kejadian 3.jpg"),
  },
];

export default function InfoScreen() {
  const [activeTab, setActiveTab] = useState<InfoTab>("traffic");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportLocation, setReportLocation] = useState("");
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [userIncidents, setUserIncidents] = useState<(InfoItem & { image: any })[]>([]);
  const [incidentVotes, setIncidentVotes] = useState<Record<string, { valid: number; invalid: number }>>({});

  const data = useMemo<ListItem[]>(() => {
    switch (activeTab) {
      case "traffic":
        return dummyTraffic;
      case "cctv":
        return dummyCctv;
      case "incidents":
      default:
        return [...userIncidents, ...dummyIncidents];
    }
  }, [activeTab, userIncidents]);

  const handleSubmitReport = () => {
    if (!reportTitle.trim() || !reportDetail.trim() || !reportLocation.trim()) {
      Alert.alert("Error", "Semua field harus diisi!");
      return;
    }

    if (!reportImage) {
      Alert.alert("Error", "Silakan upload foto kejadian!");
      return;
    }

    const newIncident: InfoItem & { image: any } = {
      id: `user-${Date.now()}`,
      title: reportTitle,
      status: "Dilaporkan",
      detail: reportDetail + " (Lokasi: " + reportLocation + ")",
      time: "Baru saja",
      reportedBy: "Anda",
      validVotes: 0,
      invalidVotes: 0,
      image: { uri: reportImage },
    };

    setUserIncidents(prev => [newIncident, ...prev]);
    setShowReportModal(false);
    setReportTitle("");
    setReportDetail("");
    setReportLocation("");
    setReportImage(null);
    Alert.alert("Berhasil", "Laporan kejadian berhasil dikirim!");
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Error", "Izin akses galeri diperlukan!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReportImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Error", "Izin akses kamera diperlukan!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReportImage(result.assets[0].uri);
    }
  };

  const handleVote = (itemId: string, voteType: 'valid' | 'invalid') => {
    setIncidentVotes(prev => {
      const current = prev[itemId] || { valid: 0, invalid: 0 };
      return {
        ...prev,
        [itemId]: {
          valid: voteType === 'valid' ? current.valid + 1 : current.valid,
          invalid: voteType === 'invalid' ? current.invalid + 1 : current.invalid,
        }
      };
    });
  };

  const getItemStatus = (item: InfoItem) => {
    if (activeTab !== 'incidents') return item.status;
    
    const votes = incidentVotes[item.id];
    const totalValid = (item.validVotes || 0) + (votes?.valid || 0);
    const totalInvalid = (item.invalidVotes || 0) + (votes?.invalid || 0);
    
    // Jika ada voting dan valid lebih banyak dari invalid
    if (totalValid > 0 || totalInvalid > 0) {
      if (totalValid > totalInvalid) {
        return 'Terkonfirmasi';
      }
    }
    return item.status;
  };

  const getVoteCounts = (item: InfoItem) => {
    const votes = incidentVotes[item.id];
    return {
      valid: (item.validVotes || 0) + (votes?.valid || 0),
      invalid: (item.invalidVotes || 0) + (votes?.invalid || 0),
    };
  };

  const title = useMemo(() => {
    switch (activeTab) {
      case "traffic":
        return "Info Lalu Lintas";
      case "cctv":
        return "CCTV Sekitar";
      case "incidents":
      default:
        return "Kejadian Terbaru Di Sekitar Kamu";
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
        {activeTab === "incidents" && (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.reportButtonText}>Laporkan Kejadian</Text>
          </TouchableOpacity>
        )}
        {data.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <StatusPill status={getItemStatus(item)} />
            </View>
            <Text style={styles.cardDetail}>{item.detail}</Text>
            
            {/* Tampilkan gambar untuk Lalu Lintas dan Kejadian */}
            {(activeTab === "traffic" || activeTab === "incidents") && 
             "image" in item && item.image && (
              <View style={styles.imageWrapper}>
                <Image
                  source={item.image}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            )}
            
            {/* Tampilkan video untuk CCTV */}
            {activeTab === "cctv" && "video" in item && item.video && (
              <View style={styles.videoWrapper}>
                <Video
                  source={item.video}
                  style={styles.video}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  useNativeControls
                />
              </View>
            )}
            
            <View style={styles.cardFooter}>
              <Text style={styles.cardTime}>
                {item.time}
                {activeTab === "incidents" && item.reportedBy && (
                  <Text style={styles.reportedBy}> • oleh {item.reportedBy}</Text>
                )}
              </Text>
              {activeTab === "incidents" && (
                <View style={styles.voteButtons}>
                  <TouchableOpacity 
                    style={styles.voteButton}
                    onPress={() => handleVote(item.id, 'valid')}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.voteText}>{getVoteCounts(item).valid}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.voteButton}
                    onPress={() => handleVote(item.id, 'invalid')}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.voteText}>{getVoteCounts(item).invalid}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Report Incident Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Laporkan Kejadian</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowReportModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.formContainer} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Judul Kejadian *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Kecelakaan di Jl. Sudirman"
                  placeholderTextColor="#9CA3AF"
                  value={reportTitle}
                  onChangeText={setReportTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Lokasi *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Contoh: Jl. Sudirman KM 5"
                  placeholderTextColor="#9CA3AF"
                  value={reportLocation}
                  onChangeText={setReportLocation}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Detail Kejadian *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Jelaskan detail kejadian yang terjadi..."
                  placeholderTextColor="#9CA3AF"
                  value={reportDetail}
                  onChangeText={setReportDetail}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Foto Kejadian *</Text>
                <View style={styles.imageUploadContainer}>
                  {reportImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: reportImage }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setReportImage(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadButtonsRow}>
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handleTakePhoto}
                      >
                        <Ionicons name="camera" size={24} color={COLORS.PRIMARY} />
                        <Text style={styles.uploadButtonText}>Ambil Foto</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={handlePickImage}
                      >
                        <Ionicons name="images" size={24} color={COLORS.PRIMARY} />
                        <Text style={styles.uploadButtonText}>Pilih Galeri</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitReport}
              >
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Kirim Laporan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 8,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
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
  imageWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: 180,
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  reportedBy: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "600",
  },
  voteButtons: {
    flexDirection: "row",
    gap: 12,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  voteText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  formTextArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  imageUploadContainer: {
    marginTop: 4,
  },
  uploadButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 24,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  imagePreview: {
    width: "100%",
    height: 200,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 2,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
