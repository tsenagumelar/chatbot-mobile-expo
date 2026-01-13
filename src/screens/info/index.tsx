import { AppHeader } from "@/src/components/AppHeader";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useInfoScreen from "./hooks";

export default function InfoScreen() {
  const {
    activeTab,
    setActiveTab,
    showReportModal,
    setShowReportModal,
    reportTitle,
    setReportTitle,
    reportDetail,
    setReportDetail,
    reportLocation,
    setReportLocation,
    reportImage,
    setReportImage,
    data,
    title,
    handleSubmitReport,
    handlePickImage,
    handleTakePhoto,
    handleVote,
    getItemStatus,
    getVoteCounts,
  } = useInfoScreen();

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

            {(activeTab === "traffic" || activeTab === "incidents") &&
              "image" in item &&
              item.image && (
                <View style={styles.imageWrapper}>
                  <Image source={item.image} style={styles.image} resizeMode="cover" />
                </View>
              )}

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
                    onPress={() => handleVote(item.id, "valid")}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.voteText}>{getVoteCounts(item).valid}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.voteButton}
                    onPress={() => handleVote(item.id, "invalid")}
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
                      <TouchableOpacity style={styles.uploadButton} onPress={handleTakePhoto}>
                        <Ionicons name="camera" size={24} color={COLORS.PRIMARY} />
                        <Text style={styles.uploadButtonText}>Ambil Foto</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.uploadButton} onPress={handlePickImage}>
                        <Ionicons name="images" size={24} color={COLORS.PRIMARY} />
                        <Text style={styles.uploadButtonText}>Pilih Galeri</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
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
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  screenSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#0C3AC5",
    borderColor: "#0C3AC5",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0C3AC5",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  reportButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8,
  },
  cardDetail: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 160,
  },
  videoWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: 180,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTime: {
    fontSize: 12,
    color: "#64748B",
  },
  reportedBy: {
    color: "#94A3B8",
    fontSize: 12,
  },
  voteButtons: {
    flexDirection: "row",
    gap: 8,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voteText: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "700",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  formContainer: {
    marginTop: 6,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  formTextArea: {
    minHeight: 90,
  },
  imageUploadContainer: {
    gap: 10,
  },
  uploadButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 180,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0C3AC5",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
