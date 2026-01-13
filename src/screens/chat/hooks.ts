import { sendChatMessage, testConnection } from "@/src/services/api";
import { stopSpeaking } from "@/src/services/voice";
import { useStore } from "@/src/store/useStore";
import type { ChatMessage as ChatMessageType } from "@/src/types";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, FlatList } from "react-native";

export default function useChatScreen() {
  const {
    location,
    address,
    speed,
    traffic,
    messages,
    chatLoading,
    sessionId,
    user,
    chatSessions,
    addMessage,
    setChatLoading,
    setSessionId,
    createNewSession,
    switchSession,
    deleteSession,
    saveCurrentSession,
  } = useStore();

  const [inputText, setInputText] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);
  const statusColor =
    backendConnected === null
      ? "#D1D5DB"
      : backendConnected
      ? "#34C759"
      : "#FF3B30";

  useEffect(() => {
    checkBackendConnection();
  }, []);

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

      const response = await sendChatMessage(
        userMessage.content,
        context,
        sessionId,
        imageToSend,
        user?.name
      );

      console.log("📥 Received from backend:", response);

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
      setTimeout(() => saveCurrentSession(), 500);
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

  const handleNewSession = () => {
    if (messages.length === 0) return;

    Alert.alert(
      "Chat Baru",
      "Mulai chat baru? Chat saat ini akan disimpan di history.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Chat Baru",
          onPress: () => {
            createNewSession();
            stopSpeaking();
          },
        },
      ]
    );
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

  const chatSuggestions = [
    "Dimana saya bisa perpanjang SIM?",
    "Bantu saya cek tilang",
    "Bagaimana kondisi lalu lintas?",
    "Apakah ada penutupan jalan?",
  ];

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  const handleBack = () => router.back();

  return {
    messages,
    chatLoading,
    chatSessions,
    inputText,
    setInputText,
    backendConnected,
    statusColor,
    showVoiceInput,
    setShowVoiceInput,
    showHistory,
    setShowHistory,
    selectedImage,
    setSelectedImage,
    flatListRef,
    handleSend,
    handleNewSession,
    handleVoiceTranscript,
    handleImageAction,
    chatSuggestions,
    handleSuggestionPress,
    switchSession,
    deleteSession,
    handleBack,
  };
}
