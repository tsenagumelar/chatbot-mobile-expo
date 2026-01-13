import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import {
  ActivityIndicator,
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
import { COLORS } from "@/src/utils/constants";
import useLoginScreen from "./hooks";

const polantasLogo = require("@/assets/images/Polantas Logo.png");

export default function LoginScreen() {
  const {
    hasLocationPermission,
    name,
    setName,
    phone,
    setPhone,
    dob,
    gender,
    setGender,
    dobDate,
    showDobPicker,
    checkingLocation,
    error,
    showForm,
    setShowForm,
    handleDateChange,
    handleOpenDatePicker,
    handleRequestLocation,
    handleLogin,
    openForm,
  } = useLoginScreen();

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
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#0C3AC5",
    fontWeight: "800",
    fontSize: 16,
  },
  storageNote: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E266D",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
  },
  secondaryText: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0C3AC5",
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
