import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import usePdfScreen from "./hooks";

export default function PdfViewerScreen() {
  const {
    pdfFile,
    pdfUri,
    loading,
    error,
    renderPdfHtml,
    handleBack,
    handleWebViewError,
  } = usePdfScreen();

  if (!pdfFile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PDF Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>File tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pdfFile.name}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0C3AC5" />
          <Text style={styles.loadingText}>Memuat PDF...</Text>
        </View>
      ) : error || !pdfUri ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error || "File tidak tersedia"}</Text>
          <Text style={styles.errorSubtext}>
            Untuk menggunakan file PDF lokal:
          </Text>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              1. Copy file PDF ke folder assets{"\n"}
              2. Atau host file di server/cloud{"\n"}
              3. Update konfigurasi di aplikasi
            </Text>
          </View>
          <TouchableOpacity style={styles.backToHomeButton} onPress={handleBack}>
            <Text style={styles.backToHomeText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ html: renderPdfHtml(pdfUri) }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0C3AC5" />
              <Text style={styles.loadingText}>Memuat PDF...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
            handleWebViewError();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C3AC5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  webview: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F5F5F5",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  instructionBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    width: "100%",
    maxWidth: 320,
  },
  instructionText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  backToHomeButton: {
    marginTop: 20,
    backgroundColor: "#0C3AC5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
