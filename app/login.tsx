import { requestLocationPermission } from "@/src/services/location";
import { useStore } from "@/src/store/useStore";
import { COLORS } from "@/src/utils/constants";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { user, hasLocationPermission, login, setLocationPermission } =
    useStore();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleRequestLocation = async () => {
    try {
      setCheckingLocation(true);
      const granted = await requestLocationPermission();
      setLocationPermission(granted);

      if (!granted) {
        Alert.alert(
          "Izin lokasi dibutuhkan",
          "Aktifkan izin lokasi untuk bisa masuk ke aplikasi."
        );
      }
    } finally {
      setCheckingLocation(false);
    }
  };

  const validateForm = () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Nama, No HP, dan Email wajib diisi.");
      return false;
    }

    if (!emailRegex.test(email.trim())) {
      setError("Format email tidak valid.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleLogin = () => {
    if (!hasLocationPermission) {
      Alert.alert("Izin lokasi dibutuhkan", "Izinkan lokasi untuk melanjutkan.");
      return;
    }

    if (!validateForm()) return;

    login({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
    });

    router.replace("/(tabs)");
  };

  const formDisabled = checkingLocation || !hasLocationPermission;

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
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>LL</Text>
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

            <Text style={styles.label}>Nama</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama lengkap"
              placeholderTextColor="#6E7ACF"
              value={name}
              onChangeText={setName}
              editable={!formDisabled}
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
              editable={!formDisabled}
              returnKeyType="next"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@contoh.com"
              placeholderTextColor="#6E7ACF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!formDisabled}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.loginButton,
                (!hasLocationPermission || checkingLocation) &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!hasLocationPermission || checkingLocation}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <Text style={styles.storageNote}>
              Data login hanya disimpan lokal (AsyncStorage) agar tetap masuk
              saat aplikasi dibuka lagi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C3AC5",
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
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1845D1",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 24,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  welcome: {
    marginTop: 12,
    fontSize: 20,
    color: "#E8ECFF",
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
});
