import ChatMessage from "@/src/components/ChatMessage";
import VoiceButton from "@/src/components/VoiceButton";
import { sendChatMessage, testConnection } from "@/src/services/api";
import { isSpeaking, speak, stopSpeaking } from "@/src/services/voice";
import { useStore } from "@/src/store/useStore";
import type { ChatMessage as ChatMessageType } from "@/src/types";
import { COLORS } from "@/src/utils/constants";
import AppHeader from "@/src/components/AppHeader";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
    clearMessages,
    setChatLoading,
    setSessionId,
    logout,
  } = useStore();

  const [inputText, setInputText] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null
  );
  const [autoSpeak, setAutoSpeak] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Speech recognition event listeners (disabled for Expo Go)
  // Uncomment when using Development Build
  /*
  useSpeechRecognitionEvent('start', () => {
    console.log('🎤 Started');
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    console.log('🛑 Ended');
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setInputText(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('❌ Error:', event.error);
    setIsListening(false);
    Alert.alert('Voice Error', event.error);
  });
  */

  // Test backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const checkBackendConnection = async () => {
    try {
      const connected = await testConnection();
      setBackendConnected(connected);

      if (!connected) {
        Alert.alert(
          "Backend Offline",
          "Cannot connect to backend API. Please check if backend is running.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      setBackendConnected(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || chatLoading) return;

    // Check backend first
    if (backendConnected === false) {
      Alert.alert("Backend Offline", "Please start the backend server first.", [
        { text: "Retry", onPress: checkBackendConnection },
        { text: "Cancel" },
      ]);
      return;
    }

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
        location: address || "Unknown",
        speed: speed || 0,
        traffic: traffic?.condition || "unknown",
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
      };

      console.log("📤 Sending to backend:", {
        message: userMessage.content,
        context,
        sessionId: sessionId || "(new session)",
      });

      // Get AI response from backend with session management
      const response = await sendChatMessage(
        userMessage.content,
        context,
        sessionId
      );

      console.log("📥 Received from backend:", response);

      // Save/update session ID from backend
      if (response.sessionId && response.sessionId !== sessionId) {
        console.log("💾 Updating session ID:", {
          old: sessionId,
          new: response.sessionId,
        });
        setSessionId(response.sessionId);
      } else if (response.sessionId) {
        console.log("✅ Session ID unchanged:", response.sessionId);
      } else {
        console.warn("⚠️ No session ID received from backend");
      }

      const assistantMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: Date.now(),
      };

      addMessage(assistantMessage);

      // Auto-speak response if enabled
      if (autoSpeak) {
        speak(response.response);
      }
    } catch (error: any) {
      console.error("❌ Chat error:", error);

      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${
          error.message || "Failed to get response from AI"
        }. Please check backend connection.`,
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
    } finally {
      setChatLoading(false);
    }
  };

  const handleVoicePress = async () => {
    // Check if currently speaking
    const speaking = await isSpeaking();

    if (speaking) {
      // Stop current speech
      await stopSpeaking();
      return;
    }

    // For Expo Go: Show info about voice input
    Alert.alert(
      "🎤 Voice Input",
      "Voice input (Speech-to-Text) memerlukan Development Build.\n\nUntuk MVP, gunakan:\n• Quick questions di bawah\n• Ketik pertanyaan manual\n• Voice output (TTS) sudah aktif! 🔊",
      [
        {
          text: "Try Quick Question",
          onPress: () =>
            handleQuickQuestion("Bagaimana kondisi lalu lintas saya?"),
        },
        { text: "OK" },
      ]
    );

    // Uncomment ini kalau sudah pakai Development Build:
    /*
    try {
      const available = await isSpeechRecognitionAvailable();
      if (!available) {
        Alert.alert('Voice Input', 'Speech recognition not available');
        return;
      }

      await startListening(
        (transcript) => {
          setInputText(transcript);
          setIsListening(false);
        },
        (error) => {
          setIsListening(false);
          Alert.alert('Voice Error', error);
        }
      );
    } catch (error: any) {
      Alert.alert('Voice Input Error', error.message);
    }
    */
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
    const message: ChatMessageType = {
      id: Date.now().toString(),
      role: "assistant",
      content: `🔊 Auto-speak ${!autoSpeak ? "enabled" : "disabled"}`,
      timestamp: Date.now(),
    };
    addMessage(message);
  };

  const handleClearChat = () => {
    Alert.alert("Clear Chat", "Are you sure you want to clear all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearMessages();
          stopSpeaking();
        },
      },
    ]);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color={COLORS.TEXT_SECONDARY}
      />
      <Text style={styles.emptyTitle}>Belum ada chat</Text>
      <Text style={styles.emptyText}>
        Mulai percakapan dengan asisten AI Anda
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.headerButton} onPress={toggleAutoSpeak}>
        <Ionicons
          name={autoSpeak ? "volume-high" : "volume-mute"}
          size={20}
          color={autoSpeak ? "#007AFF" : "#8E8E93"}
        />
        <Text
          style={[
            styles.headerButtonText,
            !autoSpeak && styles.headerButtonTextMuted,
          ]}
        >
          Auto-speak {autoSpeak ? "ON" : "OFF"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleClearChat}
        disabled={messages.length === 0}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        <Text style={[styles.headerButtonText, { color: "#FF3B30" }]}>
          Clear
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <AppHeader
        onLogout={() => {
          logout();
          router.replace("/login");
        }}
      />
      {/* Status Header - Always visible */}
      <View style={styles.topHeader}>
        {/* Left: Session ID */}
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionLabel}>Session:</Text>
          <Text style={styles.sessionValue}>
            {sessionId ? sessionId.substring(0, 8) + "..." : "None"}
          </Text>
        </View>

        {/* Right: Backend Status */}
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
          ListHeaderComponent={messages.length > 0 ? renderHeader : null}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Loading Indicator */}
        {chatLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>AI sedang mengetik...</Text>
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
            returnKeyType="send"
          />

          <VoiceButton onPress={handleVoicePress} disabled={chatLoading} />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || chatLoading) && styles.sendButtonDisabled,
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
  topHeader: {
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionsContainer: {
    width: "100%",
  },
  suggestionsTitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
    fontWeight: "600",
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.PRIMARY,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerButtonText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  headerButtonTextMuted: {
    color: "#8E8E93",
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
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    gap: 8,
    marginBottom: 0,
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
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
