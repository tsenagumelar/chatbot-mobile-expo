import { AppHeader } from "@/src/components/AppHeader";
import ChatMessage from "@/src/components/ChatMessage";
import VoiceInputWebView from "@/src/components/VoiceInputWebView";
import { sendChatMessage, testConnection } from "@/src/services/api";
import { stopSpeaking } from "@/src/services/voice";
import { useStore } from "@/src/store/useStore";
import type { ChatMessage as ChatMessageType } from "@/src/types";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const polantasLogo = require("@/assets/images/Polantas Logo.png");

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
  } = useStore();

  const [inputText, setInputText] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null
  );
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);
  const statusColor =
    backendConnected === null
      ? "#D1D5DB"
      : backendConnected
      ? "#34C759"
      : "#FF3B30";

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
    } catch {
      setBackendConnected(false);
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || chatLoading) return;

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
      content: inputText.trim() || "[Gambar]",
      imageUri: selectedImage,
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    const imageToSend = selectedImage;
    setInputText("");
    setSelectedImage(undefined);
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
        hasImage: !!imageToSend,
      });

      // Get AI response from backend with session management
      const response = await sendChatMessage(
        userMessage.content,
        context,
        sessionId,
        imageToSend // Pass imageUri directly, sendChatMessage will handle it
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

  const handleVoiceTranscript = (text: string) => {
    setInputText(text);
    setShowVoiceInput(false);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Izin dibutuhkan",
        "Berikan akses galeri untuk melampirkan foto."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Izin kamera dibutuhkan",
        "Aktifkan izin kamera untuk mengambil foto."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
    }
  };

  const handleImageAction = () => {
    Alert.alert(
      "Lampirkan foto",
      "Pilih sumber foto",
      [
        { text: "Batal", style: "cancel" },
        { text: "Kamera", onPress: takePhoto },
        { text: "Galeri", onPress: pickFromLibrary },
      ],
      { cancelable: true }
    );
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={polantasLogo} style={styles.headerLogo} />
          <View>
            <Text style={styles.headerTitle}>Polantas Menyapa</Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={styles.statusText}>
                {backendConnected === null
                  ? "Menghubungkan..."
                  : backendConnected
                  ? "Online"
                  : "Offline"}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleClearChat}
            disabled={messages.length === 0}
          >
            <Ionicons name="create-outline" size={20} color="#111827" />
          </TouchableOpacity>
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
            <Text style={styles.loadingText}>AI sedang mengetik...</Text>
          </View>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(undefined)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.bottomBar}>
          <View style={styles.inputContainer}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.circleButton}
                onPress={() => setShowVoiceInput(true)}
                disabled={true}
              >
                <Ionicons name="mic-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleButton}
                onPress={handleImageAction}
                disabled={chatLoading}
              >
                <Ionicons name="image-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Type here..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!chatLoading}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() && !selectedImage || chatLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() && !selectedImage || chatLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Voice Input Modal */}
      <VoiceInputWebView
        visible={showVoiceInput}
        onClose={() => setShowVoiceInput(false)}
        onTranscript={handleVoiceTranscript}
      />
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    backgroundColor: "#FFFFFF",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 28,
    height: 34,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
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
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
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
    color: "#6B7280",
  },
  bottomBar: {
    backgroundColor: "#0C3AC5",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  circleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 28,
    maxHeight: 90,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 15,
    color: "#111827",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0C3AC5",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  imagePreviewContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 18,
    right: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
