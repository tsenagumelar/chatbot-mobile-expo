import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatMessage from "../components/ChatMessage";
import VoiceButton from "../components/VoiceButton";
import { sendChatMessage, testConnection } from "../services/api";
import { speak } from "../services/voice";
import { useStore } from "../store/useStore";
import type { ChatMessage as ChatMessageType } from "../types";
import { AUTO_SPEAK_RESPONSES, COLORS } from "../utils/constants";

export default function ChatScreen() {
  const {
    location,
    address,
    speed,
    traffic,
    messages,
    chatLoading,
    sessionId,
    addMessage,
    setChatLoading,
    setSessionId,
    clearMessages,
  } = useStore();

  const [inputText, setInputText] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null
  );
  const flatListRef = useRef<FlatList>(null);

  // Test backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Clear old messages on mount to prevent data corruption issues
  useEffect(() => {
    // Check if there are any corrupt messages
    const hasCorruptMessages = messages.some(
      (msg) => typeof msg.content !== "string"
    );
    if (hasCorruptMessages) {
      console.log("🧹 Clearing corrupt messages");
      clearMessages();
    }
  }, []);

  const checkBackendConnection = async () => {
    try {
      const connected = await testConnection();
      setBackendConnected(connected);
      if (connected) {
        console.log("✅ Backend connected");
      } else {
        console.log("⚠️ Backend offline");
      }
    } catch (error) {
      setBackendConnected(false);
      console.error("❌ Backend connection failed:", error);
    }
  };

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || chatLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInputText("");
    setChatLoading(true);

    try {
      // Prepare context
      const context = {
        location: address,
        speed,
        traffic: traffic?.condition || "unknown",
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
      };

      // Debug logging - show current session state
      console.log("📤 Sending to backend:");
      console.log("Message:", userMessage.content);
      console.log("Current Session ID from store:", sessionId);
      console.log("Session ID being sent:", sessionId || null);

      // Get AI response with session (backend manages history)
      const { response, sessionId: newSessionId } = await sendChatMessage(
        userMessage.content,
        context,
        sessionId
      );

      console.log("📥 Received from backend:");
      console.log("Response type:", typeof response);
      console.log("Response:", response);
      console.log("New Session ID from backend:", newSessionId);

      // Save/update session ID from backend
      if (newSessionId && newSessionId !== sessionId) {
        console.log("💾 Updating session ID:", {
          old: sessionId,
          new: newSessionId,
        });
        setSessionId(newSessionId);
      } else if (newSessionId) {
        console.log("✅ Session ID unchanged:", newSessionId);
      } else {
        console.warn("⚠️ No session ID received from backend");
      }

      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: typeof response === "string" ? response : String(response),
        timestamp: Date.now(),
      };

      console.log("💾 Saving message:", {
        ...assistantMessage,
        contentType: typeof assistantMessage.content,
      });
      addMessage(assistantMessage);

      // Auto-speak response
      if (AUTO_SPEAK_RESPONSES) {
        speak(response);
      }
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Maaf, terjadi kesalahan. Silakan coba lagi.",
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
      console.error("Chat error:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleVoicePress = () => {
    // TODO: Implement voice input (Speech-to-Text)
    // For MVP, show info
    const infoMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "assistant",
      content:
        "🎤 Fitur voice input akan segera hadir! Untuk saat ini, gunakan text input ya.",
      timestamp: Date.now(),
    };
    addMessage(infoMessage);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color={COLORS.TEXT_SECONDARY}
      />
      <Text style={styles.emptyTitle}>Halo! 👋</Text>
      <Text style={styles.emptyText}>
        Saya asisten polisi lalu lintas AI Anda.{"\n"}
        Tanya apa saja tentang berkendara!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Status Header - Always visible */}
      <View style={styles.statusHeader}>
        {/* Left: Session ID */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionLabel}>Session:</Text>
          <Text style={styles.sessionValue}>
            {sessionId ? sessionId.substring(0, 8) + "..." : "None"}
          </Text>
        </View>

        {/* Right: Backend Status & Clear Button */}
        <View style={styles.rightActions}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: backendConnected ? "#E5F7ED" : "#FFE5E5" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: backendConnected ? "#34C759" : "#FF3B30" },
              ]}
            />
            <Text style={styles.statusText}>
              {backendConnected === null
                ? "Checking..."
                : backendConnected
                ? "Connected"
                : "Offline"}
            </Text>
            {!backendConnected && backendConnected !== null && (
              <TouchableOpacity onPress={checkBackendConnection}>
                <Ionicons name="refresh" size={14} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                clearMessages();
                console.log("🧹 Chat cleared, session reset");
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatMessage message={item} />}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Loading Indicator */}
        {chatLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Mengetik...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tanya sesuatu..."
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!chatLoading}
            onSubmitEditing={handleSend}
          />

          <VoiceButton onPress={handleVoicePress} disabled={chatLoading} />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || chatLoading}
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
  },
  sessionValue: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFE5E5",
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
  messagesListEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
