import { PDF_LIBRARY } from "@/src/data/pdfLibrary";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LibraryScreen() {
  const handleOpenPdf = (pdfId: string) => {
    router.push({
      pathname: "/pdf-viewer",
      params: { id: pdfId },
    });
  };

  const renderItem = ({ item }: { item: typeof PDF_LIBRARY[0] }) => (
    <TouchableOpacity
      style={styles.pdfCard}
      onPress={() => handleOpenPdf(item.id)}
    >
      <View style={styles.pdfIconContainer}>
        <Ionicons name="document-text" size={32} color="#EF4444" />
      </View>
      <View style={styles.pdfInfo}>
        <Text style={styles.pdfTitle}>{item.name}</Text>
        <Text style={styles.pdfDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.TEXT_SECONDARY} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perpustakaan</Text>
      </View>

      <FlatList
        data={PDF_LIBRARY}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
  },
  listContent: {
    padding: 16,
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pdfIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  pdfDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  separator: {
    height: 12,
  },
});
