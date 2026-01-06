import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "../utils/constants";

interface VoiceInputWebViewProps {
  visible: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export default function VoiceInputWebView({
  visible,
  onClose,
  onTranscript,
}: VoiceInputWebViewProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const webViewRef = useRef<WebView>(null);

  const voiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 20px;
        }
        .mic-button {
          width: 120px;
          height: 120px;
          border-radius: 60px;
          background: rgba(255, 255, 255, 0.2);
          border: 4px solid white;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 auto 30px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        .mic-button.listening {
          background: rgba(255, 59, 48, 0.8);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .mic-icon {
          font-size: 48px;
        }
        .status-text {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
        }
        .transcript {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 20px;
          min-height: 80px;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 20px;
          font-size: 16px;
          line-height: 1.6;
        }
        .transcript.empty {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
        .error {
          background: rgba(255, 59, 48, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
          font-size: 14px;
        }
        .lang-select {
          margin-top: 15px;
          padding: 10px 20px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid white;
          color: white;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div id="micButton" class="mic-button" onclick="toggleRecording()">
          <div class="mic-icon">🎤</div>
        </div>
        <div class="status-text" id="status">Tap the mic to start</div>
        <select class="lang-select" id="langSelect">
          <option value="id-ID">Bahasa Indonesia</option>
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
        </select>
        <div class="transcript empty" id="transcript">Your speech will appear here...</div>
        <div class="error" id="error" style="display: none;"></div>
      </div>

      <script>
        let recognition = null;
        let isListening = false;
        let finalTranscript = '';

        // Check if browser supports Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'id-ID'; // Default Indonesian

          recognition.onstart = () => {
            isListening = true;
            document.getElementById('micButton').classList.add('listening');
            document.getElementById('status').textContent = 'Listening... Speak now';
            hideError();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'status',
              listening: true
            }));
          };

          recognition.onend = () => {
            isListening = false;
            document.getElementById('micButton').classList.remove('listening');
            document.getElementById('status').textContent = 'Tap the mic to start';
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'status',
              listening: false
            }));
          };

          recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
              } else {
                interimTranscript += transcript;
              }
            }

            const fullTranscript = finalTranscript + interimTranscript;
            const transcriptEl = document.getElementById('transcript');
            
            if (fullTranscript.trim()) {
              transcriptEl.classList.remove('empty');
              transcriptEl.textContent = fullTranscript;
              
              // Send transcript to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'transcript',
                text: fullTranscript.trim(),
                isFinal: event.results[event.results.length - 1].isFinal
              }));
            }
          };

          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            let errorMsg = 'Error: ';
            
            switch(event.error) {
              case 'no-speech':
                errorMsg += 'No speech detected. Please try again.';
                break;
              case 'audio-capture':
                errorMsg += 'No microphone found. Please check your device.';
                break;
              case 'not-allowed':
                errorMsg += 'Microphone permission denied.';
                break;
              case 'network':
                errorMsg += 'Network error. Please check your connection.';
                break;
              default:
                errorMsg += event.error;
            }
            
            showError(errorMsg);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              error: event.error,
              message: errorMsg
            }));
          };

          // Language change listener
          document.getElementById('langSelect').addEventListener('change', (e) => {
            recognition.lang = e.target.value;
            if (isListening) {
              recognition.stop();
              setTimeout(() => recognition.start(), 100);
            }
          });
        } else {
          showError('Speech Recognition not supported in this browser. Please use Chrome or Safari.');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: 'not-supported',
            message: 'Speech Recognition not supported'
          }));
        }

        function toggleRecording() {
          if (!recognition) {
            showError('Speech Recognition not available');
            return;
          }

          if (isListening) {
            recognition.stop();
          } else {
            finalTranscript = '';
            document.getElementById('transcript').textContent = 'Listening...';
            document.getElementById('transcript').classList.remove('empty');
            recognition.start();
          }
        }

        function showError(message) {
          const errorEl = document.getElementById('error');
          errorEl.textContent = message;
          errorEl.style.display = 'block';
        }

        function hideError() {
          document.getElementById('error').style.display = 'none';
        }

        // Send ready message
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready',
          supported: !!recognition
        }));
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "ready":
          if (!data.supported) {
            Alert.alert(
              "Not Supported",
              "Speech recognition is not supported in this WebView"
            );
          }
          break;

        case "status":
          setIsListening(data.listening);
          break;

        case "transcript":
          setTranscript(data.text);
          break;

        case "error":
          Alert.alert("Voice Error", data.message);
          setIsListening(false);
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const handleSendTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript("");
      onClose();
    }
  };

  const handleStopListening = () => {
    webViewRef.current?.injectJavaScript(`
      if (recognition && isListening) {
        recognition.stop();
      }
    `);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Input</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: voiceHTML }}
          style={styles.webView}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          originWhitelist={["*"]}
        />

        {/* Bottom Actions */}
        {transcript.trim() && !isListening && (
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setTranscript("")}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendTranscript}
            >
              <Ionicons name="send" size={20} color="#FFF" />
              <Text style={styles.sendButtonText}>Send to Chat</Text>
            </TouchableOpacity>
          </View>
        )}

        {isListening && (
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopListening}
            >
              <Ionicons name="stop-circle" size={24} color="#FFF" />
              <Text style={styles.stopButtonText}>Stop Listening</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  webView: {
    flex: 1,
  },
  bottomActions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  clearButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  sendButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  stopButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
