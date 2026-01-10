import { PDF_LIBRARY } from "@/src/data/pdfLibrary";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function PdfViewerScreen() {
  const params = useLocalSearchParams();
  const pdfId = params.id as string;
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pdfFile = PDF_LIBRARY.find((pdf) => pdf.id === pdfId);

  useEffect(() => {
    loadPdf();
  }, []);

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!pdfFile) {
        setError("File tidak ditemukan");
        return;
      }

      // Gunakan URL online jika tersedia
      if (pdfFile.url) {
        setPdfUri(pdfFile.url);
      } else {
        setError("URL PDF belum tersedia. Upload file ke server/cloud storage terlebih dahulu.");
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Gagal memuat PDF");
    } finally {
      setLoading(false);
    }
  };

  if (!pdfFile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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

  // Render HTML with PDF.js
  const renderPdfHtml = (uri: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              height: 100vh;
              overflow: hidden;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(uri)}&embedded=true"></iframe>
        </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
              1. Copy file PDF ke folder assets{'\n'}
              2. Atau host file di server/cloud{'\n'}
              3. Update konfigurasi di aplikasi
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.back()}
          >
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
            console.warn('WebView error: ', nativeEvent);
            setError("Gagal memuat PDF di WebView");
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
    color: "#EF4444",
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  instructionBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    width: "100%",
    maxWidth: 300,
  },
  instructionText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  backToHomeButton: {
    marginTop: 24,
    backgroundColor: "#0C3AC5",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backToHomeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
