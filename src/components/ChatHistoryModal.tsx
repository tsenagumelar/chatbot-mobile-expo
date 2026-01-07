import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { ChatSession } from "../types";

interface ChatHistoryModalProps {
  visible: boolean;
  sessions: ChatSession[];
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function ChatHistoryModal({
  visible,
  sessions,
  onClose,
  onSelectSession,
  onDeleteSession,
}: ChatHistoryModalProps) {
  const handleDelete = (session: ChatSession) => {
    Alert.alert(
      "Hapus Chat",
      `Yakin ingin menghapus "${session.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => onDeleteSession(session.id),
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Kemarin";
    } else if (days < 7) {
      return `${days} hari lalu`;
    } else {
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
    }
  };

  const getPreviewText = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (!lastMessage) return "Tidak ada pesan";
    
    const preview = lastMessage.content.substring(0, 60);
    return preview.length < lastMessage.content.length ? `${preview}...` : preview;
  };

  const renderSession = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => {
        onSelectSession(item.id);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.sessionIcon}>
        <Ionicons name="chatbubbles" size={24} color="#0C3AC5" />
      </View>
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.sessionDate}>{formatDate(item.lastMessageAt)}</Text>
        </View>
        <Text style={styles.sessionPreview} numberOfLines={2}>
          {getPreviewText(item)}
        </Text>
        <Text style={styles.sessionCount}>
          {item.messages.length} pesan
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>History Chat</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Belum ada history</Text>
            <Text style={styles.emptyText}>
              Chat Anda akan tersimpan otomatis di sini
            </Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    padding: 16,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    gap: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionContent: {
    flex: 1,
    gap: 4,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sessionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginRight: 8,
  },
  sessionDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  sessionPreview: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  sessionCount: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
});
