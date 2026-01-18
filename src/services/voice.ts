import * as Speech from "expo-speech";
import { sanitizeSpeechText } from "@/src/utils/speech";
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

/**
 * Speak text using Text-to-Speech
 */
export async function speak(text: string): Promise<void> {
  try {
    // Stop any ongoing speech first
    await Speech.stop();

    const sanitized = sanitizeSpeechText(text);
    console.log("🔊 Speaking:", sanitized.substring(0, 50) + "...");

    // Speak the text in Indonesian
    Speech.speak(sanitized, {
      language: "id-ID", // Indonesian
      pitch: 1.0,
      rate: 0.85, // Slightly slower for clarity
      onDone: () => {
        console.log("✅ Speech completed");
      },
      onStopped: () => {
        console.log("🛑 Speech stopped");
      },
      onError: (error) => {
        console.error("❌ Speech error:", error);
      },
    });
  } catch (error) {
    console.error("❌ Error speaking:", error);
  }
}

/**
 * Stop current speech
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
    console.log("🛑 Speech stopped");
  } catch (error) {
    console.error("❌ Error stopping speech:", error);
  }
}

/**
 * Check if currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error("❌ Error checking speech status:", error);
    return false;
  }
}

/**
 * Get available voices
 */
export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    // Filter Indonesian voices
    const indonesianVoices = voices.filter((voice) =>
      voice.language.startsWith("id")
    );

    console.log(`📢 Found ${indonesianVoices.length} Indonesian voices`);
    return indonesianVoices;
  } catch (error) {
    console.error("❌ Error getting voices:", error);
    return [];
  }
}

// ============================================
// SPEECH RECOGNITION (Voice Input)
// Note: Requires Development Build, not available in Expo Go
// ============================================

const { SpeechRecognizerModule } = NativeModules;
let speechEmitter: NativeEventEmitter | null = null;
let resultSubscription: { remove: () => void } | null = null;
let errorSubscription: { remove: () => void } | null = null;

const ensureEmitter = () => {
  if (!speechEmitter && SpeechRecognizerModule) {
    speechEmitter = new NativeEventEmitter(SpeechRecognizerModule);
  }
  return speechEmitter;
};

const clearSubscriptions = () => {
  resultSubscription?.remove();
  errorSubscription?.remove();
  resultSubscription = null;
  errorSubscription = null;
};

export async function requestSpeechRecognitionPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return false;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function isSpeechRecognitionAvailable(): Promise<boolean> {
  if (Platform.OS !== "android" || !SpeechRecognizerModule) {
    return false;
  }

  try {
    return await SpeechRecognizerModule.isAvailable();
  } catch (error) {
    console.error("❌ Error checking speech availability:", error);
    return false;
  }
}

export async function startListening(
  onResult: (transcript: string, isFinal?: boolean) => void,
  onError?: (error: string) => void,
  continuous = false
): Promise<void> {
  if (Platform.OS !== "android" || !SpeechRecognizerModule) {
    onError?.("Speech recognition only available on Android native");
    return;
  }

  const hasPermission = await requestSpeechRecognitionPermission();
  if (!hasPermission) {
    onError?.("Microphone permission denied");
    return;
  }

  clearSubscriptions();

  const emitter = ensureEmitter();
  if (!emitter) {
    onError?.("Speech recognizer not initialized");
    return;
  }

  resultSubscription = emitter.addListener(
    "SpeechRecognizerResult",
    (payload: { text?: string; isFinal?: boolean }) => {
      if (payload?.text) {
        onResult(payload.text, payload.isFinal);
      }
    }
  );

  errorSubscription = emitter.addListener(
    "SpeechRecognizerError",
    (payload: { message?: string }) => {
      onError?.(payload?.message || "Speech recognition error");
    }
  );

  try {
    await SpeechRecognizerModule.startListening("id-ID", true, continuous);
  } catch (error: any) {
    onError?.(error?.message || "Failed to start listening");
  }
}

export async function stopListening(): Promise<void> {
  if (Platform.OS !== "android" || !SpeechRecognizerModule) {
    return;
  }

  clearSubscriptions();
  await SpeechRecognizerModule.stopListening();
}

export const useSpeechRecognitionEvent = (
  event: string,
  handler: (payload: any) => void
) => {
  const emitter = ensureEmitter();
  if (!emitter) {
    return () => {};
  }
  const subscription = emitter.addListener(event, handler);
  return () => subscription.remove();
};
