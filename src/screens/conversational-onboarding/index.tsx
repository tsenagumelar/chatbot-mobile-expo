import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import React from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useConversationalOnboardingScreen from "./hooks";

type StepOption = {
  label: string;
  value: string;
};

const polantasLogo = require("@/assets/images/logo-baru.png");
const voiceAnimation = require("@/src/services/voice.json");

export default function ConversationalOnboardingScreen() {
  const {
    onboarding,
    currentStep,
    assistantText,
    typedText,
    showInput,
    textInputValue,
    setTextInputValue,
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
    handleAnswer,
    handleSelectPlace,
    handleBack,
  } = useConversationalOnboardingScreen();

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

  const parseVehicleLabel = (label: string) => {
    const parts = label.trim().split(/\s+/);
    if (parts.length < 2) {
      return { icon: label, text: label };
    }
    const [icon, ...rest] = parts;
    return { icon, text: rest.join(" ") };
  };

  const renderVehicleCarousel = (options: StepOption[]) => (
    <Animated.View style={[styles.inputArea, animatedStyle]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vehicleCarousel}
        snapToInterval={132}
        decelerationRate="fast"
      >
        {options.map((option) => {
          const { icon, text } = parseVehicleLabel(option.label);
          const isSelected = onboarding.primary_vehicle === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={styles.vehicleCard}
              onPress={() => handleAnswer(option.value, option.label)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.vehicleIconWrap,
                  isSelected && styles.vehicleIconWrapActive,
                ]}
              >
                <Text
                  style={[
                    styles.vehicleIcon,
                    isSelected && styles.vehicleIconActive,
                  ]}
                >
                  {icon}
                </Text>
              </View>
              <Text
                style={[
                  styles.vehicleLabel,
                  isSelected && styles.vehicleLabelActive,
                ]}
              >
                {text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
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

      if (
        currentStep.user_input.type === "single_choice" &&
        currentStep.save_to_profile?.field === "primary_vehicle"
      ) {
        return renderVehicleCarousel(currentStep.user_input.options);
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
            placeholderTextColor="#D6E4FF"
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

    if (inputType === "places_search") {
      const query = textInputValue.trim();
      return (
        <Animated.View style={[styles.inputArea, animatedStyle]}>
          <TextInput
            value={textInputValue}
            onChangeText={setTextInputValue}
            placeholder={currentStep.user_input.placeholder}
            placeholderTextColor="#D6E4FF"
            style={styles.textInput}
          />
          {query.length < 3 && (
            <Text style={styles.placesHint}>Ketik minimal 3 huruf.</Text>
          )}
          {placesError ? <Text style={styles.placesHint}>{placesError}</Text> : null}
          {placesResults.length > 0 && (
            <View style={styles.placesResults}>
              {placesResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.placesItem}
                  onPress={() => handleSelectPlace(item.id)}
                >
                  <Text style={styles.placesItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logoFrame}>
            <Image source={polantasLogo} style={styles.logoImage} />
          </View>
          <Text style={styles.brandText}>POLANTAS MENYAPA</Text>
          <TouchableOpacity
            style={styles.silentToggle}
            onPress={() => setSilentMode(!silentMode)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={silentMode ? "volume-mute" : "volume-high"}
              size={18}
              color="#0C3AC5"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.messageArea}>
          <Text style={styles.assistantText}>
            {typedText}
            {typedText.length < assistantText.length ? "▍" : ""}
          </Text>
        </View>

        {renderInput()}
      </KeyboardAvoidingView>

      {stepHistory.length > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>KEMBALI</Text>
        </TouchableOpacity>
      )}

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
        <LottieView source={voiceAnimation} autoPlay loop style={styles.voiceAnimation} />
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
    backgroundColor: "#0C3AC5",
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
    position: "relative",
  },
  logoFrame: {
    width: 92,
    height: 100,
    borderRadius: 26,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  brandText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  silentToggle: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B1E6B",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  messageArea: {
    marginTop: 15,
    paddingHorizontal: 6,
  },
  assistantText: {
    fontSize: 22,
    lineHeight: 35,
    color: "#FFFFFF",
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
    textTransform: "uppercase",
    textAlign: "center",
  },
  optionTextActive: {
    color: "#0C3AC5",
  },
  vehicleCarousel: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 5,
  },
  vehicleCard: {
    width: 120,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  vehicleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B1E6B",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  vehicleIconWrapActive: {
    transform: [{ scale: 1.15 }],
  },
  vehicleIcon: {
    fontSize: 45,
  },
  vehicleIconActive: {
    fontSize: 50,
  },
  vehicleLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    textTransform: "uppercase",
    textAlign: "center",
  },
  vehicleLabelActive: {
    color: "#FFFFFF",
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#FFFFFF",
    paddingHorizontal: 0,
    paddingVertical: 12,
    backgroundColor: "transparent",
    fontSize: 20,
    lineHeight: 30,
    color: "#FFFFFF",
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#0C3AC5",
    fontWeight: "700",
    fontSize: 15,
    textTransform: "uppercase",
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    left: 25,
    bottom: 50,
  },
  backButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },
  placesResults: {
    marginTop: 8,
    gap: 10,
  },
  placesItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.25)",
  },
  placesItemText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  placesHint: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
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
