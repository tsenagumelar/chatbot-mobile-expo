import { requestLocationPermission } from "@/src/services/location";
import {
  isSpeechRecognitionAvailable,
  startListening,
  stopListening,
} from "@/src/services/voice";
import onboardFlow from "@/src/services/onboard.json";
import { useStore } from "@/src/store/useStore";
import { sanitizeSpeechText } from "@/src/utils/speech";
import Constants from "expo-constants";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { Animated } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";

type StepOption = {
  label: string;
  value: string;
};

type StepUserInput =
  | { type: "action"; options: StepOption[] }
  | { type: "text"; placeholder?: string; validation?: { min_length?: number } }
  | { type: "places_search"; placeholder?: string }
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

const flow = onboardFlow as OnboardingFlow;

export default function useConversationalOnboardingScreen() {
  const {
    onboarding,
    setOnboarding,
    setLocationPermission,
    setOnboardingCompleted,
    setAppMode,
    login,
    silentMode,
    setSilentMode,
  } = useStore();
  const [currentStepId, setCurrentStepId] = useState(flow.initial_step);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const [typedText, setTypedText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [otpValue, setOtpValue] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [placesResults, setPlacesResults] = useState<
    { id: string; label: string }[]
  >([]);
  const [placesError, setPlacesError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [voiceInputError, setVoiceInputError] = useState("");
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(0);
  const inputAnim = useRef(new Animated.Value(0)).current;
  const voicePulse = useRef(new Animated.Value(0)).current;
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceValueRef = useRef<string | string[] | null>(null);
  const autoAdvanceStepRef = useRef<string | null>(null);

  const currentStep = flow.steps[currentStepId];
  const placesApiKey =
    (Constants as any)?.expoConfig?.extra?.googlePlacesApiKey ??
    (Constants as any)?.manifest?.extra?.googlePlacesApiKey ??
    (Constants as any)?.expoConfig?.ios?.config?.googleMapsApiKey ??
    (Constants as any)?.expoConfig?.android?.config?.googleMaps?.apiKey ??
    "";

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
    if (
      (currentStep.user_input.type === "text" ||
        currentStep.user_input.type === "places_search") &&
      field
    ) {
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
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, 50);

    Speech.stop();
    if (!silentMode) {
      setIsSpeaking(true);
      Speech.speak(sanitizeSpeechText(assistantText), {
        language: "id-ID",
        rate: 0.85,
        pitch: 1.05,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } else {
      setIsSpeaking(false);
    }

    return () => clearInterval(interval);
  }, [assistantText, currentStep, inputAnim, silentMode]);

  useEffect(() => {
    let isActive = true;

    const prepareSpeech = async () => {
      const voiceSteps = new Set(["ASK_NAME", "ASK_VEHICLE", "SEARCH_DESTINATION"]);
      if (!voiceSteps.has(currentStepId)) {
        if (isListening) {
          await stopListening();
          if (isActive) {
            setIsListening(false);
          }
        }
        if (isActive) {
          setSpeechAvailable(false);
        }
        return;
      }

      const available = await isSpeechRecognitionAvailable();
      if (isActive) {
        setSpeechAvailable(available);
      }
    };

    prepareSpeech();

    return () => {
      isActive = false;
    };
  }, [currentStepId, isListening]);

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
    if (!currentStep || currentStep.user_input.type !== "places_search") {
      setPlacesResults([]);
      setPlacesError("");
      return;
    }
    const query = textInputValue.trim();
    if (query.length < 3) {
      setPlacesResults([]);
      setPlacesError("");
      return;
    }
    if (!placesApiKey) {
      setPlacesResults([]);
      setPlacesError("API key belum tersedia.");
      return;
    }

    const handler = setTimeout(async () => {
      try {
        setPlacesError("");
        const input = encodeURIComponent(query);
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${input}&language=id&components=country:id&key=${placesApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status !== "OK") {
          setPlacesResults([]);
          setPlacesError("Lokasi tidak ditemukan.");
          return;
        }
        const items = (data.predictions ?? []).map((item: any) => ({
          id: item.place_id as string,
          label: item.description as string,
        }));
        setPlacesResults(items);
      } catch {
        setPlacesError("Gagal mencari lokasi.");
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [currentStep, placesApiKey, textInputValue]);

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
    if (silentMode) {
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [silentMode]);

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

  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening]);

  useEffect(() => {
    setVoiceInputError("");
    setAutoAdvanceSeconds(0);
    autoAdvanceValueRef.current = null;
    autoAdvanceStepRef.current = null;
    if (autoAdvanceTimerRef.current) {
      clearInterval(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }, [currentStepId]);

  const clearAutoAdvance = () => {
    if (autoAdvanceTimerRef.current) {
      clearInterval(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    setAutoAdvanceSeconds(0);
    autoAdvanceValueRef.current = null;
    autoAdvanceStepRef.current = null;
  };

  const startAutoAdvance = (value: string | string[]) => {
    clearAutoAdvance();
    autoAdvanceValueRef.current = value;
    autoAdvanceStepRef.current = currentStepId;
    setAutoAdvanceSeconds(5);
    autoAdvanceTimerRef.current = setInterval(() => {
      setAutoAdvanceSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      const pendingValue = autoAdvanceValueRef.current;
      const pendingStep = autoAdvanceStepRef.current;
      clearAutoAdvance();
      if (pendingValue && pendingStep === currentStepId) {
        handleAnswer(pendingValue);
      }
    }, 5000);
  };

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

  const resolveVehicleFromSpeech = (rawText: string) => {
    const normalized = rawText
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) return null;
    if (normalized.includes("motor") || normalized.includes("moto"))
      return "motor";
    if (
      normalized.includes("mobil") ||
      normalized.includes("mobi") ||
      normalized.includes("sedan") ||
      normalized.includes("car")
    ) {
      return "mobil";
    }
    if (normalized.includes("sepeda") || normalized.includes("bicycle")) return "sepeda";
    if (normalized.includes("angkutan") || normalized.includes("umum") || normalized.includes("bus"))
      return "public";
    if (normalized.includes("jalan") || normalized.includes("kaki") || normalized.includes("walk"))
      return "walk";
    return null;
  };

  const handleTextInputChange = (value: string) => {
    clearAutoAdvance();
    setTextInputValue(value);
  };

  const handleVehicleSelect = (value: string) => {
    clearAutoAdvance();
    setOnboarding({ primary_vehicle: value });
    startAutoAdvance(value);
  };

  const handleSelectPlace = async (placeId: string) => {
    clearAutoAdvance();
    if (!placesApiKey) {
      setPlacesError("API key belum tersedia.");
      return;
    }
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}&fields=geometry,name,formatted_address&key=${placesApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== "OK") {
        setPlacesError("Detail lokasi gagal diambil.");
        return;
      }
      const result = data.result ?? {};
      const coords = result.geometry?.location;
      const label =
        result.name ?? result.formatted_address ?? textInputValue.trim();
      if (!label) {
        setPlacesError("Lokasi tidak tersedia.");
        return;
      }
      if (coords) {
        setOnboarding({
          destination_latitude: coords.lat,
          destination_longitude: coords.lng,
        });
      }
      setTextInputValue(label);
      handleAnswer(label);
    } catch {
      setPlacesError("Gagal mengambil detail lokasi.");
    }
  };

  const handleAnswer = (value: string | string[], label?: string) => {
    clearAutoAdvance();
    if (isListening) {
      stopListening();
      setIsListening(false);
    }
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
    setStepHistory((prev) => [...prev, currentStepId]);
    setCurrentStepId(nextStepId);
  };

  const toggleVoiceInput = async () => {
    if (!speechAvailable) return;
    const isVoiceStep =
      currentStepId === "ASK_NAME" ||
      currentStepId === "ASK_VEHICLE" ||
      currentStepId === "SEARCH_DESTINATION";
    if (!isVoiceStep) return;

    if (isListening) {
      await stopListening();
      setIsListening(false);
      return;
    }

    setVoiceInputError("");
    Speech.stop();
    setIsSpeaking(false);
    clearAutoAdvance();
    setIsListening(true);
    await startListening(
      (text, isFinal) => {
        const normalized = text.trim();
        if (currentStepId === "ASK_VEHICLE") {
          if (isFinal) {
            setIsListening(false);
            if (!normalized) {
              setVoiceInputError("Tidak ada suara yang terdeteksi.");
              return;
            }
            const value = resolveVehicleFromSpeech(normalized);
            if (!value) {
              setVoiceInputError(
                "Pilihan belum dikenali. Ucapkan motor, mobil, sepeda, angkutan umum, atau jalan kaki."
              );
              return;
            }
            setOnboarding({ primary_vehicle: value });
            startAutoAdvance(value);
          }
          return;
        }

        setTextInputValue(text);
        if (isFinal) {
          setIsListening(false);
          if (!normalized) {
            setVoiceInputError("Tidak ada suara yang terdeteksi.");
            return;
          }
          if (currentStepId === "ASK_NAME") {
            const minLength =
              currentStep?.user_input.type === "text"
                ? currentStep.user_input.validation?.min_length ?? 0
                : 0;
            if (normalized.length >= minLength) {
              startAutoAdvance(normalized);
            }
            return;
          }
          if (currentStepId === "SEARCH_DESTINATION") {
            if (normalized.length >= 3) {
              clearAutoAdvance();
            }
          }
        }
      },
      (error) => {
        setVoiceInputError(error);
        setIsListening(false);
      }
    );
  };

  const handleBack = () => {
    setStepHistory((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const previousStep = next.pop();
      if (previousStep) {
        setCurrentStepId(previousStep);
      }
      return next;
    });
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

  return {
    onboarding,
    currentStep,
    currentStepId,
    assistantText,
    typedText,
    showInput,
    textInputValue,
    setTextInputValue: handleTextInputChange,
    selectedValues,
    setSelectedValues,
    otpValue,
    setOtpValue,
    resendSeconds,
    placesResults,
    placesError,
    stepHistory,
    showLoader,
    setShowLoader,
    voicePulse,
    animatedStyle,
    silentMode,
    setSilentMode,
    isListening,
    speechAvailable,
    voiceInputError,
    autoAdvanceSeconds,
    handleAnswer,
    handleSelectPlace,
    handleVehicleSelect,
    handleBack,
    toggleVoiceInput,
  };
}
