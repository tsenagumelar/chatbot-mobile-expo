import { requestLocationPermission } from "@/src/services/location";
import { useStore } from "@/src/store/useStore";
import { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

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

export default function useLoginScreen() {
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

  return {
    user,
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
  };
}
