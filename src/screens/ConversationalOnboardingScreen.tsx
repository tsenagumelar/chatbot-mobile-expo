import onboardFlow from "@/src/services/onboard.json";
import { useStore } from "@/src/store/useStore";
import { sanitizeSpeechText } from "@/src/utils/speech";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import LottieView from "lottie-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { requestLocationPermission } from "@/src/services/location";
import {
  Animated,
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

type StepOption = {
  label: string;
  value: string;
};

type StepUserInput =
  | { type: "action"; options: StepOption[] }
  | { type: "text"; placeholder?: string; validation?: { min_length?: number } }
  | { type: "single_choice"; options: StepOption[] }
  | { type: "multi_choice"; options: StepOption[]; max_select?: number }
  | { type: "location_or_search"; options: StepOption[] }
  | { type: "otp"; length: number; resend_timer_seconds?: number };

type Step = {
  type: "message" | "input" | "choice" | "verification" | "final";
  assistant: { text: string };
  user_input: StepUserInput;
  save_to_profile?: { field: string; value?: unknown };
  next: string | Record<string, string>;
};

type OnboardingFlow = {
  initial_step: string;
  steps: Record<string, Step>;
};

const polantasLogo = require("@/assets/images/Polantas Logo.png");
const voiceAnimation = require("@/src/services/voice.json");
const flow = onboardFlow as OnboardingFlow;

export default function ConversationalOnboardingScreen() {
  const {
    onboarding,
    setOnboarding,
    setLocationPermission,
    setOnboardingCompleted,
    setAppMode,
    login,
  } = useStore();
  const [currentStepId, setCurrentStepId] = useState(flow.initial_step);
  const [typedText, setTypedText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [otpValue, setOtpValue] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const inputAnim = useRef(new Animated.Value(0)).current;
  const voicePulse = useRef(new Animated.Value(0)).current;

  const currentStep = flow.steps[currentStepId];

  const assistantText = useMemo(() => {
    const name = onboarding.name || "Sobat";
    return currentStep?.assistant.text.replaceAll("{name}", name);
  }, [currentStep, onboarding.name]);

  useEffect(() => {
    if (!currentStep) return;

    setTypedText("");
    setShowInput(false);
    inputAnim.setValue(0);
    setSelectedValues([]);
    setOtpValue("");

    const field = currentStep.save_to_profile?.field;
    if (currentStep.user_input.type === "text" && field) {
      const value = onboarding[field as keyof typeof onboarding];
      setTextInputValue(typeof value === "string" ? value : "");
    } else {
      setTextInputValue("");
    }

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedText(assistantText.slice(0, index));
      if (index >= assistantText.length) {
        clearInterval(interval);
        setShowInput(true);
        Animated.timing(inputAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }).start();
      }
    }, 75);

    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(sanitizeSpeechText(assistantText), {
      language: "id-ID",
      rate: 0.85,
      pitch: 1.05,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });

    return () => clearInterval(interval);
  }, [assistantText, currentStep, inputAnim, onboarding]);

  useEffect(() => {
    if (currentStepId !== "ASK_CITY") return;
    let isActive = true;

    const requestPermission = async () => {
      const granted = await requestLocationPermission();
      if (isActive) {
        setLocationPermission(granted);
      }
    };

    requestPermission();
    return () => {
      isActive = false;
    };
  }, [currentStepId, setLocationPermission]);

  useEffect(() => {
    if (!showLoader) return;
    const timer = setTimeout(() => {
      login({
        name: onboarding.name || "Sobat",
        phone: "",
        email: "",
      });
      setAppMode("menyapa");
      setOnboardingCompleted(true);
      router.replace("/menyapa");
    }, 1600);

    return () => clearTimeout(timer);
  }, [login, onboarding.name, setAppMode, setOnboardingCompleted, showLoader]);

  useEffect(() => {
    Animated.timing(voicePulse, {
      toValue: isSpeaking ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isSpeaking, voicePulse]);

  useEffect(() => {
    if (!currentStep || currentStep.user_input.type !== "otp") return;
    if (!currentStep.user_input.resend_timer_seconds) return;
    setResendSeconds(currentStep.user_input.resend_timer_seconds);
  }, [currentStep]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const saveAnswer = (value: unknown) => {
    if (!currentStep?.save_to_profile) return;
    const { field, value: staticValue } = currentStep.save_to_profile;
    setOnboarding({
      [field]: staticValue !== undefined ? staticValue : value,
    });
  };

  const resolveNextStep = (value?: string) => {
    if (!currentStep) return null;
    if (typeof currentStep.next === "string") return currentStep.next;
    if (!value) return null;
    return currentStep.next[value] ?? null;
  };

  const handleAnswer = (value: string | string[], label?: string) => {
    const payload = Array.isArray(value) ? value : value;
    saveAnswer(payload);

    const nextStepId = resolveNextStep(Array.isArray(value) ? value[0] : value);
    if (!nextStepId) return;
    if (!flow.steps[nextStepId]) {
      if (nextStepId === "ENTER_APP") {
        router.replace("/(tabs)");
      }
      return;
    }
    setCurrentStepId(nextStepId);
  };

  const animatedStyle = {
    opacity: inputAnim,
    transform: [
      {
        translateY: inputAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const renderOptionButton = (
    option: StepOption,
    selected?: boolean,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      key={option.value}
      style={[styles.optionButton, selected && styles.optionButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextActive]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const renderInput = () => {
    if (!currentStep || !showInput) return null;
    const inputType = currentStep.user_input.type;

    if (inputType === "action" || inputType === "single_choice") {
      if (currentStep.type === "final") {
        return (
          <Animated.View style={[styles.inputArea, animatedStyle]}>
            {currentStep.user_input.options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.primaryButton}
                onPress={() => setShowLoader(true)}
              >
                <Text style={styles.primaryButtonText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        );
      }

      return (
        <Animated.View style={[styles.inputArea, animatedStyle]}>
          {currentStep.user_input.options.map((option) =>
            renderOptionButton(option, false, () =>
              handleAnswer(option.value, option.label)
            )
          )}
        </Animated.View>
      );
    }

    if (inputType === "multi_choice") {
      const maxSelect = currentStep.user_input.max_select ?? Infinity;
      const canSubmit = selectedValues.length > 0;
      return (
        <Animated.View style={[styles.inputArea, animatedStyle]}>
          {currentStep.user_input.options.map((option) => {
            const selected = selectedValues.includes(option.value);
            const toggle = () => {
              setSelectedValues((prev) => {
                if (prev.includes(option.value)) {
                  return prev.filter((item) => item !== option.value);
                }
                if (prev.length >= maxSelect) return prev;
                return [...prev, option.value];
              });
            };
            return renderOptionButton(option, selected, toggle);
          })}
          <TouchableOpacity
            style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
            onPress={() => handleAnswer(selectedValues, selectedValues.join(", "))}
            disabled={!canSubmit}
          >
            <Text style={styles.primaryButtonText}>Lanjut</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (inputType === "text") {
      const minLength = currentStep.user_input.validation?.min_length ?? 0;
      const isValid = textInputValue.trim().length >= minLength;
      return (
        <Animated.View style={[styles.inputArea, animatedStyle]}>
          <TextInput
            value={textInputValue}
            onChangeText={setTextInputValue}
            placeholder={currentStep.user_input.placeholder}
            placeholderTextColor="#94A3B8"
            style={styles.textInput}
          />
          <TouchableOpacity
            style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
            onPress={() => handleAnswer(textInputValue.trim())}
            disabled={!isValid}
          >
            <Text style={styles.primaryButtonText}>Lanjut</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (inputType === "otp") {
      const isValid = otpValue.length === currentStep.user_input.length;
      return (
        <Animated.View style={[styles.inputArea, animatedStyle]}>
          <TextInput
            value={otpValue}
            onChangeText={setOtpValue}
            placeholder="Masukkan kode OTP"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={currentStep.user_input.length}
            style={styles.textInput}
          />
          <TouchableOpacity
            style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
            onPress={() => handleAnswer(otpValue)}
            disabled={!isValid}
          >
            <Text style={styles.primaryButtonText}>Verifikasi</Text>
          </TouchableOpacity>
          {resendSeconds > 0 && (
            <Text style={styles.helperText}>
              Kirim ulang dalam {resendSeconds} detik
            </Text>
          )}
        </Animated.View>
      );
    }

    if (inputType === "location_or_search") {
      return (
        <Animated.View style={[styles.inputArea, animatedStyle]}>
          {currentStep.user_input.options.map((option) =>
            renderOptionButton(option, false, () =>
              handleAnswer(option.value, option.label)
            )
          )}
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundOrb} />
      <View style={styles.backgroundRing} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logoFrame}>
            <Image source={polantasLogo} style={styles.logoImage} />
          </View>
          <Text style={styles.brandText}>POLANTAS MENYAPA</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardDot} />
            <Text style={styles.assistantLabel}>Polman</Text>
          </View>
          <Text style={styles.assistantText}>
            {typedText}
            {typedText.length < assistantText.length ? "▍" : ""}
          </Text>
        </View>

        {renderInput()}
      </KeyboardAvoidingView>

      <Animated.View
        style={[
          styles.voiceWrapper,
          {
            transform: [
              {
                scale: voicePulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.04],
                }),
              },
            ],
            opacity: voicePulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 1],
            }),
          },
        ]}
      >
        <LottieView
          source={voiceAnimation}
          autoPlay
          loop
          style={styles.voiceAnimation}
        />
      </Animated.View>

      <View style={styles.avatarFloat}>
        <View style={styles.avatarFrame}>
          <Image source={polantasLogo} style={styles.avatarImage} />
        </View>
      </View>

      {showLoader && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <Text style={styles.loaderTitle}>Menyiapkan pengalamanmu...</Text>
            <Text style={styles.loaderSubtitle}>
              Personalisasi untuk {onboarding.name || "Sobat"}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backgroundGlow: {
    position: "absolute",
    top: -180,
    left: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#D6E4FF",
    opacity: 0.7,
  },
  backgroundOrb: {
    position: "absolute",
    bottom: -220,
    right: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#E9F1FF",
    opacity: 0.85,
  },
  backgroundRing: {
    position: "absolute",
    top: 110,
    right: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: "rgba(12, 58, 197, 0.15)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    gap: 22,
  },
  header: {
    alignItems: "center",
    gap: 14,
  },
  logoFrame: {
    width: 92,
    height: 100,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0B1E6B",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  brandText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B1E6B",
    letterSpacing: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0B1E6B",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#60A5FA",
  },
  assistantLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#64748B",
    fontWeight: "700",
  },
  assistantText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#1A2351",
    fontWeight: "600",
  },
  inputArea: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D9E2FF",
  },
  optionButtonActive: {
    borderColor: "#0C3AC5",
    backgroundColor: "#E8EEFF",
  },
  optionText: {
    color: "#1A2351",
    fontWeight: "600",
    fontSize: 15,
  },
  optionTextActive: {
    color: "#0C3AC5",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D9E2FF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#1A2351",
  },
  primaryButton: {
    backgroundColor: "#0C3AC5",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
  avatarFloat: {
    position: "absolute",
    right: 20,
    bottom: 28,
    alignItems: "center",
    gap: 6,
  },
  voiceWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  voiceAnimation: {
    width: 250,
    height: 250,
  },
  avatarFrame: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  avatarImage: {
    width: "70%",
    height: "70%",
    resizeMode: "contain",
  },
  loaderOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    alignItems: "center",
    gap: 6,
  },
  loaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1E6B",
    textAlign: "center",
  },
  loaderSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  avatarBubble: {
    backgroundColor: "#0C3AC5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  avatarWave: {
    fontSize: 16,
    color: "#FFFFFF",
  },
});
