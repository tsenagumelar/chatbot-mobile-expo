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
import { sendChatMessage } from "../services/api";
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
  const flatListRef = useRef<FlatList>(null);

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

      // Debug logging
      console.log("📤 Sending to backend:");
      console.log("Message:", userMessage.content);
      console.log("Session ID:", sessionId || "(new session)");

      // Get AI response with session (backend manages history)
      const { response, sessionId: newSessionId } = await sendChatMessage(
        userMessage.content,
        context,
        sessionId
      );

      console.log("📥 Received from backend:");
      console.log("Response type:", typeof response);
      console.log("Response:", response);
      console.log("Session ID:", newSessionId);

      // Save session ID from first response
      if (!sessionId && newSessionId) {
        console.log("✅ Session created:", newSessionId);
        setSessionId(newSessionId);
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
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Contoh pertanyaan:</Text>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => setInputText("Bagaimana kondisi lalu lintas saya?")}
        >
          <Text style={styles.suggestionText}>
            Bagaimana kondisi lalu lintas saya?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={() => setInputText("Berapa batas kecepatan di jalan tol?")}
        >
          <Text style={styles.suggestionText}>
            Berapa batas kecepatan di jalan tol?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Debug Header with Clear Button */}
      {messages.length > 0 && (
        <View style={styles.debugHeader}>
          <Text style={styles.debugText}>
            Session: {sessionId ? "Active" : "None"}
          </Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              clearMessages();
              console.log("🧹 Chat cleared");
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

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
  debugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  debugText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFE5E5",
  },
  clearText: {
    fontSize: 12,
    color: "#FF3B30",
    marginLeft: 4,
    fontWeight: "600",
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
  suggestionsContainer: {
    marginTop: 24,
    width: "100%",
  },
  suggestionsTitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    fontWeight: "600",
  },
  suggestionButton: {
    backgroundColor: COLORS.CARD,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
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
