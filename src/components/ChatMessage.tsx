import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ChatMessage as ChatMessageType } from "../types";
import { COLORS } from "../utils/constants";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Ensure content is always a string (safety check)
  const content =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="shield-checkmark" size={16} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          !isUser && styles.shadow,
        ]}
      >
        <Text
          style={[styles.text, isUser ? styles.userText : styles.assistantText]}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 6,
    gap: 10,
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAssistant: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1239C2",
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "82%",
    padding: 14,
    borderRadius: 14,
  },
  userBubble: {
    backgroundColor: "#F0F0F5",
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.TEXT_PRIMARY,
  },
  assistantText: {
    color: COLORS.TEXT_PRIMARY,
  },
});
