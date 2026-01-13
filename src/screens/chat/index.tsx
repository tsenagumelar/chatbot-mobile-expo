import { AppHeader } from "@/src/components/AppHeader";
import ChatHistoryModal from "@/src/components/ChatHistoryModal";
import ChatMessage from "@/src/components/ChatMessage";
import VoiceInputWebView from "@/src/components/VoiceInputWebView";
import { COLORS } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
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
import useChatScreen from "./hooks";

const polantasLogo = require("@/assets/images/Polantas Logo.png");

export default function ChatScreen() {
  const {
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
  } = useChatScreen();

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={COLORS.TEXT_SECONDARY} />
      <Text style={styles.emptyTitle}>Belum ada chat</Text>
      <Text style={styles.emptyText}>
        Mulai percakapan dengan asisten polantas anda
      </Text>

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Coba tanyakan:</Text>
        {chatSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => handleSuggestionPress(suggestion)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#0C3AC5" />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image source={polantasLogo} style={styles.headerLogo} />
          <View>
            <Text style={styles.headerTitle}>Polantas Menyapa</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
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
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowHistory(true)}>
            <Ionicons name="time-outline" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNewSession}
            disabled={messages.length === 0}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={messages.length === 0 ? "#D1D5DB" : "#111827"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {chatLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Asisten Polantas sedang mengetik...</Text>
          </View>
        )}

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(undefined)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

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
                (!inputText.trim() && !selectedImage) || chatLoading
                  ? styles.sendButtonDisabled
                  : null,
              ]}
              onPress={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || chatLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <VoiceInputWebView
        visible={showVoiceInput}
        onClose={() => setShowVoiceInput(false)}
        onTranscript={handleVoiceTranscript}
      />

      <ChatHistoryModal
        visible={showHistory}
        sessions={chatSessions}
        onClose={() => setShowHistory(false)}
        onSelectSession={switchSession}
        onDeleteSession={deleteSession}
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginHorizontal: 12,
  },
  headerLogo: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  messagesListEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 240,
  },
  suggestionsContainer: {
    marginTop: 10,
    gap: 8,
    width: "100%",
  },
  suggestionsTitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
  },
  suggestionText: {
    color: "#0C3AC5",
    fontWeight: "600",
    fontSize: 13,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    color: "#6B7280",
  },
  bottomBar: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    backgroundColor: "#FFFFFF",
  },
  inputContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionRow: {
    flexDirection: "row",
    gap: 6,
  },
  circleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  input: {
    minHeight: 40,
    fontSize: 14,
    color: "#111827",
  },
  sendButton: {
    alignSelf: "flex-end",
    backgroundColor: "#0C3AC5",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  imagePreviewContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 180,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
