import * as Speech from "expo-speech";

/**
 * Speak text using Text-to-Speech
 */
export async function speak(text: string): Promise<void> {
  try {
    // Stop any ongoing speech first
    await Speech.stop();

    console.log("🔊 Speaking:", text.substring(0, 50) + "...");

    // Speak the text in Indonesian
    Speech.speak(text, {
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

/**
 * Placeholder: Voice input not available in Expo Go
 * Uncomment when using Development Build
 */

/*
// Uncomment these imports when using Development Build:
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export async function requestSpeechRecognitionPermission(): Promise<boolean> {
  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.status === 'granted';
  } catch (error) {
    console.error('❌ Error requesting permission:', error);
    return false;
  }
}

export async function isSpeechRecognitionAvailable(): Promise<boolean> {
  try {
    const state = await ExpoSpeechRecognitionModule.getStateAsync();
    return state !== 'unavailable';
  } catch (error) {
    return false;
  }
}

export async function startListening(
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    const hasPermission = await requestSpeechRecognitionPermission();
    if (!hasPermission) {
      onError?.('Permission denied');
      return;
    }

    await ExpoSpeechRecognitionModule.start({
      lang: 'id-ID',
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
    });
  } catch (error: any) {
    onError?.(error.message || 'Failed to start listening');
  }
}

export async function stopListening(): Promise<void> {
  await ExpoSpeechRecognitionModule.stop();
}

export { useSpeechRecognitionEvent };
*/

// Temporary stubs for Expo Go compatibility
export async function requestSpeechRecognitionPermission(): Promise<boolean> {
  console.warn("⚠️ Speech recognition requires Development Build");
  return false;
}

export async function isSpeechRecognitionAvailable(): Promise<boolean> {
  return false;
}

export async function startListening(
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  onError?.("Speech recognition requires Development Build");
}

export async function stopListening(): Promise<void> {
  console.log("Speech recognition not available");
}

// Dummy export for compatibility
export const useSpeechRecognitionEvent = (event: string, handler: any) => {
  // No-op in Expo Go
};
