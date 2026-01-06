import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
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

  // Request microphone permission on Android
  useEffect(() => {
    if (visible && Platform.OS === 'android') {
      requestMicrophonePermission();
    }
  }, [visible]);

  const requestMicrophonePermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for voice input.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'Microphone permission is required for voice input. Please enable it in app settings.'
        );
      } else {
        console.log('Microphone permission granted');
      }
    } catch (err) {
      console.error('Error requesting microphone permission:', err);
    }
  };

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
          <option value="id-ID">🇮🇩 Bahasa Indonesia</option>
          <option value="en-US">🇺🇸 English (US)</option>
          <option value="en-GB">🇬🇧 English (UK)</option>
        </select>
        <div class="transcript empty" id="transcript">Your speech will appear here...</div>
        <div class="error" id="error" style="display: none;"></div>
        <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;" id="debug"></div>
      </div>

      <script>
        let recognition = null;
        let isListening = false;
        let finalTranscript = '';
        let restartTimeout = null;

        // Check if browser supports Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        console.log('Speech Recognition available:', !!SpeechRecognition);
        
        if (SpeechRecognition) {
          try {
            recognition = new SpeechRecognition();
            recognition.continuous = true; // Keep listening until manually stopped
            recognition.interimResults = true;
            recognition.lang = 'id-ID'; // Default Indonesian
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
              console.log('✅ Recognition started successfully');
              isListening = true;
              document.getElementById('micButton').classList.add('listening');
              document.getElementById('status').textContent = 'Listening... Speak now';
              document.getElementById('debug').textContent = '🎤 Microphone active';
              hideError();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'status',
                listening: true
              }));
            };

            recognition.onend = () => {
              console.log('Recognition ended, isListening:', isListening);
              document.getElementById('debug').textContent = '⏸️ Microphone stopped';
              
              // Only update UI if we're not trying to restart
              if (isListening) {
                isListening = false;
                document.getElementById('micButton').classList.remove('listening');
                document.getElementById('status').textContent = 'Tap the mic to start';
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'status',
                  listening: false
                }));
              }
            };

            recognition.onresult = (event) => {
              console.log('📝 Got result, results count:', event.results.length);
              document.getElementById('debug').textContent = '✅ Detecting speech...';
              
              let interimTranscript = '';
              
              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const confidence = event.results[i][0].confidence;
                
                if (event.results[i].isFinal) {
                  finalTranscript += transcript + ' ';
                  console.log('✅ Final transcript:', transcript, 'confidence:', confidence);
                } else {
                  interimTranscript += transcript;
                  console.log('⏳ Interim transcript:', transcript);
                }
              }

              const fullTranscript = finalTranscript + interimTranscript;
              const transcriptEl = document.getElementById('transcript');
              
              if (fullTranscript.trim()) {
                transcriptEl.classList.remove('empty');
                transcriptEl.textContent = fullTranscript;
                document.getElementById('debug').textContent = '✅ Speech detected: ' + fullTranscript.length + ' chars';
                
                // Send transcript to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'transcript',
                  text: fullTranscript.trim(),
                  isFinal: event.results[event.results.length - 1].isFinal
                }));
              } else {
                console.log('⚠️ Empty transcript');
              }
            };

            recognition.onerror = (event) => {
              console.error('Speech recognition error:', event.error);
              let errorMsg = 'Error: ';
              let shouldStop = true;
              
              switch(event.error) {
                case 'no-speech':
                  errorMsg += 'No speech detected. Tap mic to try again.';
                  shouldStop = true;
                  break;
                case 'audio-capture':
                  errorMsg += 'No microphone found or permission denied.';
                  shouldStop = true;
                  break;
                case 'not-allowed':
                  errorMsg += 'Microphone permission denied. Please enable in settings.';
                  shouldStop = true;
                  break;
                case 'network':
                  errorMsg += 'Network error. Please check your connection.';
                  shouldStop = true;
                  break;
                case 'aborted':
                  errorMsg += 'Recognition stopped.';
                  shouldStop = true;
                  break;
                default:
                  errorMsg += event.error;
                  shouldStop = true;
              }
              
              if (shouldStop) {
                stopRecognition();
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
              const newLang = e.target.value;
              console.log('Language changed to:', newLang);
              recognition.lang = newLang;
              
              if (isListening) {
                // Restart with new language
                stopRecognition();
                setTimeout(() => {
                  startRecognition();
                }, 300);
              }
            });

            console.log('Speech recognition initialized successfully');
          } catch (error) {
            console.error('Error initializing recognition:', error);
            showError('Failed to initialize speech recognition: ' + error.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              error: 'init-failed',
              message: 'Failed to initialize: ' + error.message
            }));
          }
        } else {
          console.error('Speech Recognition not supported');
          showError('Speech Recognition not supported in this browser. WebView may need updating.');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: 'not-supported',
            message: 'Speech Recognition not supported'
          }));
        }

        function startRecognition() {
          if (!recognition) {
            showError('Speech Recognition not available');
            return false;
          }

          // Check if already running
          if (isListening) {
            console.log('Already listening, stopping first...');
            stopRecognition();
            setTimeout(() => startRecognition(), 300);
            return false;
          }

          try {
            console.log('🎬 Starting recognition...');
            finalTranscript = '';
            const transcriptEl = document.getElementById('transcript');
            transcriptEl.textContent = 'Listening...';
            transcriptEl.classList.remove('empty');
            document.getElementById('debug').textContent = '🔄 Initializing microphone...';
            hideError();
            
            // Check if getUserMedia is available (might not be in WebView)
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              console.log('Using getUserMedia for permission check');
              // Request microphone permission explicitly
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                  console.log('✅ Microphone permission granted');
                  document.getElementById('debug').textContent = '✅ Microphone ready';
                  
                  // Stop the test stream
                  stream.getTracks().forEach(track => track.stop());
                  
                  // Now start recognition
                  recognition.start();
                })
                .catch(err => {
                  console.error('❌ Microphone permission error:', err);
                  showError('Cannot access microphone: ' + err.message);
                  document.getElementById('debug').textContent = '❌ Mic access denied';
                });
            } else {
              // WebView doesn't support getUserMedia, rely on native permission
              console.log('getUserMedia not available, starting recognition directly');
              document.getElementById('debug').textContent = '✅ Starting with native permission...';
              recognition.start();
            }
            
            return true;
          } catch(e) {
            console.error('Error starting recognition:', e);
            // Handle "already started" error
            if (e.message && e.message.includes('already')) {
              console.log('Recognition already started, forcing stop...');
              stopRecognition();
              setTimeout(() => startRecognition(), 300);
            } else {
              showError('Failed to start: ' + e.message);
              document.getElementById('debug').textContent = '❌ ' + e.message;
            }
            return false;
          }
        }

        function stopRecognition() {
          if (!recognition) return;

          try {
            console.log('Stopping recognition...');
            isListening = false;
            recognition.stop();
            document.getElementById('micButton').classList.remove('listening');
            document.getElementById('status').textContent = 'Tap the mic to start';
          } catch(e) {
            console.error('Error stopping recognition:', e);
            // Force update UI even if stop fails
            isListening = false;
            document.getElementById('micButton').classList.remove('listening');
            document.getElementById('status').textContent = 'Tap the mic to start';
          }
        }

        function toggleRecording() {
          console.log('Toggle recording clicked, isListening:', isListening);
          
          if (isListening) {
            stopRecognition();
          } else {
            startRecognition();
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
      console.log('WebView message:', data);

      switch (data.type) {
        case "ready":
          console.log('WebView ready, speech supported:', data.supported);
          if (!data.supported) {
            Alert.alert(
              "Not Supported",
              "Speech recognition is not supported. Please make sure you have Google app installed and WebView updated."
            );
          }
          break;

        case "status":
          console.log('Listening status:', data.listening);
          setIsListening(data.listening);
          break;

        case "transcript":
          console.log('Transcript received:', data.text);
          setTranscript(data.text);
          break;

        case "error":
          console.error('WebView error:', data.error, data.message);
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
          allowFileAccess={true}
          mixedContentMode="always"
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
