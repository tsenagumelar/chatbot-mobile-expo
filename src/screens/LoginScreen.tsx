import { requestLocationPermission } from "@/src/services/location";
import { useStore } from "@/src/store/useStore";
import { COLORS } from "@/src/utils/constants";
import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const polantasLogo = require("@/assets/images/Polantas Logo.png");

const formatDate = (date: Date) => {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDob = (value?: string) => {
  if (!value) return null;
  const parts = value.split(/[-/]/).map((part) => parseInt(part, 10));
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const parsed = new Date(y, m - 1, d);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export default function LoginScreen() {
  const { user, hasLocationPermission, login, setLocationPermission } =
    useStore();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dob, setDob] = useState(user?.dob ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [dobDate, setDobDate] = useState<Date | null>(
    user?.dob ? parseDob(user.dob) : null
  );
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    setDobDate(selected);
    setDob(formatDate(selected));
    if (Platform.OS === "ios") {
      setShowDobPicker(false);
    }
  };

  const handleOpenDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dobDate || new Date(),
        onChange: handleDateChange,
        mode: "date",
        maximumDate: new Date(),
      });
    } else {
      setShowDobPicker(true);
    }
  };

  useEffect(() => {
    if (user && hasLocationPermission) {
      router.replace("/(tabs)");
    }
  }, [user, hasLocationPermission]);

  useEffect(() => {
    if (!hasLocationPermission) {
      handleRequestLocation();
    }
  }, []);

  const handleRequestLocation = async (): Promise<boolean> => {
    setCheckingLocation(true);
    try {
      const granted = await requestLocationPermission();
      setLocationPermission(granted);

      if (!granted) {
        Alert.alert(
          "Izin lokasi dibutuhkan",
          "Aktifkan izin lokasi untuk bisa masuk ke aplikasi."
        );
      }

      return granted;
    } finally {
      setCheckingLocation(false);
    }
  };

  const validateForm = () => {
    if (!name.trim() || !phone.trim() || !dob.trim() || !gender.trim()) {
      setError("Semua field wajib diisi.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleLogin = async () => {
    if (!hasLocationPermission) {
      const granted = await handleRequestLocation();
      if (!granted) {
        Alert.alert("Izin lokasi dibutuhkan", "Izinkan lokasi untuk melanjutkan.");
        return;
      }
    }

    if (!validateForm()) return;

    login({
      name: name.trim(),
      phone: phone.trim(),
      email: "",
      dob: dob.trim(),
      gender: gender.trim(),
    });

    router.replace("/(tabs)");
    setShowForm(false);
  };

  const openForm = () => {
    setShowForm(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              <Image source={polantasLogo} style={styles.logoImage} />
            </View>
            <Text style={styles.appTitle}>POLANTAS</Text>
            <Text style={styles.appTitle}>MENYAPA</Text>
            <Text style={styles.welcome}>Selamat Datang</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.permissionRow}>
              <View style={styles.badge}>
                <View
                  style={[
                    styles.statusDot,
                    hasLocationPermission && styles.statusDotActive,
                  ]}
                />
                <Text style={styles.badgeText}>
                  {hasLocationPermission ? "Lokasi aktif" : "Lokasi dibutuhkan"}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  hasLocationPermission && styles.permissionButtonActive,
                ]}
                onPress={handleRequestLocation}
                disabled={checkingLocation}
              >
                {checkingLocation ? (
                  <ActivityIndicator color={COLORS.PRIMARY} size="small" />
                ) : (
                  <Text style={styles.permissionButtonText}>
                    {hasLocationPermission ? "Sudah diizinkan" : "Izinkan lokasi"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.permissionHint}>
              Lokasi wajib diaktifkan agar fitur peta & dashboard berjalan.
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={openForm}
              disabled={checkingLocation}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <Text style={styles.storageNote}>
              Data login disimpan lokal (AsyncStorage) agar tetap masuk saat
              aplikasi dibuka lagi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal form */}
      <Modal
        visible={showForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Lengkapi data</Text>
            <Text style={styles.modalSubtitle}>
              Isi nama, nomor HP, dan tanggal lahir untuk melanjutkan.
            </Text>

            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama lengkap"
              placeholderTextColor="#6E7ACF"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />

            <Text style={styles.label}>No HP</Text>
            <TextInput
              style={styles.input}
              placeholder="08xxxxxxxxxx"
              placeholderTextColor="#6E7ACF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Text style={styles.label}>Tanggal Lahir</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={handleOpenDatePicker}
              activeOpacity={0.8}
            >
              <Text style={dob ? styles.inputValue : styles.placeholderText}>
                {dob || "DD/MM/YYYY"}
              </Text>
            </TouchableOpacity>
            {Platform.OS === "ios" && showDobPicker && (
              <DateTimePicker
                value={dobDate || new Date()}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={handleDateChange}
                style={styles.datePicker}
              />
            )}

            <Text style={styles.label}>Jenis Kelamin</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "Laki-laki" && styles.genderButtonActive,
                ]}
                onPress={() => setGender("Laki-laki")}
              >
                <View style={styles.radioOuter}>
                  {gender === "Laki-laki" && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.genderText,
                    gender === "Laki-laki" && styles.genderTextActive,
                  ]}
                >
                  Laki-laki
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "Perempuan" && styles.genderButtonActive,
                ]}
                onPress={() => setGender("Perempuan")}
              >
                <View style={styles.radioOuter}>
                  {gender === "Perempuan" && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.genderText,
                    gender === "Perempuan" && styles.genderTextActive,
                  ]}
                >
                  Perempuan
                </Text>
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.secondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  checkingLocation && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={checkingLocation}
              >
                <Text style={styles.primaryText}>Simpan & Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 20,
  },
  hero: {
    alignItems: "center",
    gap: 6,
  },
  logoFrame: {
    width: 120,
    height: 140,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  appTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0C3AC5",
    letterSpacing: 1,
  },
  welcome: {
    marginTop: 12,
    fontSize: 20,
    color: "#0C3AC5",
  },
  formCard: {
    backgroundColor: "#F7F8FF",
    padding: 20,
    borderRadius: 18,
    gap: 12,
    marginTop: 24,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
  },
  statusDotActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  badgeText: {
    fontWeight: "800",
    color: "#1E266D",
  },
  permissionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE1FF",
  },
  permissionButtonActive: {
    backgroundColor: "#E5EDFF",
  },
  permissionButtonText: {
    color: "#1339C5",
    fontWeight: "800",
  },
  permissionHint: {
    color: "#4A5AB7",
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E266D",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE1FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0B1E6B",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  inputValue: {
    fontSize: 16,
    color: "#0B1E6B",
  },
  placeholderText: {
    fontSize: 16,
    color: "#6E7ACF",
  },
  datePicker: {
    backgroundColor: "#fff",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DCE1FF",
    backgroundColor: "#fff",
  },
  genderButtonActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#F0F4FF",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DCE1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.PRIMARY,
  },
  genderText: {
    fontSize: 15,
    color: "#6E7ACF",
    fontWeight: "600",
  },
  genderTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.DANGER,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#DCE1FF",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#1339C5",
    fontSize: 16,
    fontWeight: "800",
  },
  storageNote: {
    marginTop: 8,
    color: "#4A5AB7",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B1E6B",
  },
  modalSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  secondaryText: {
    color: "#6B7280",
    fontWeight: "700",
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
  },
});
