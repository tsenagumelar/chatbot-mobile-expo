import { AppHeader } from "@/src/components/AppHeader";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useReportScreen from "./hooks";

export default function ReportsScreen() {
  const {
    INCIDENT_TYPES,
    REPORT_IMAGES,
    displayReports,
    activeTab,
    setActiveTab,
    showModal,
    setShowModal,
    incidentType,
    setIncidentType,
    customType,
    setCustomType,
    description,
    setDescription,
    photoUri,
    isAnonymous,
    setIsAnonymous,
    submitting,
    currentLocationLabel,
    handlePhotoAction,
    handleSubmit,
    deleteReport,
    formatDate,
    handleLogout,
  } = useReportScreen();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader onLogout={handleLogout} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Insiden</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {displayReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={56} color={COLORS.TEXT_SECONDARY} />
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
                  {report.isAnonymous ? "Anonim" : report.reporterName || "Tanpa nama"} •{" "}
                  {formatDate(report.createdAt)}
                </Text>
                <Text style={styles.reportAddress}>
                  {report.address || "Lokasi tidak tersedia"}
                </Text>
                <Text style={styles.reportDescription}>{report.description}</Text>
                {report.photoUri && (
                  <Image
                    source={
                      report.photoUri.startsWith("@/")
                        ? REPORT_IMAGES[report.photoUri.split("/").pop() || ""]
                        : { uri: report.photoUri }
                    }
                    style={styles.reportPhoto}
                  />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
                        style={[styles.typeChip, active && styles.typeChipActive]}
                        onPress={() => setIncidentType(option.value)}
                      >
                        <Text
                          style={[styles.typeChipText, active && styles.typeChipTextActive]}
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
                {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}
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
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
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
  },
  tabActive: {
    backgroundColor: "#E0E7FF",
  },
  tabText: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700",
  },
  tabTextActive: {
    color: COLORS.PRIMARY,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.TEXT_SECONDARY,
  },
  reportItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 14,
    marginBottom: 10,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  typePill: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  reportMeta: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  reportAddress: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    marginTop: 4,
  },
  reportDescription: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  reportPhoto: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 10,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  modalScroll: {
    marginTop: 4,
  },
  modalScrollContent: {
    paddingBottom: 16,
    gap: 12,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  typeChipActive: {
    backgroundColor: "#1D4ED8",
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  typeChipTextActive: {
    color: "#FFFFFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: {
    minHeight: 90,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  photoButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  photoPreview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  hint: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
  },
});
