import { useStore } from "@/src/store/useStore";
import type { IncidentReport, IncidentType } from "@/src/types";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert } from "react-native";

const INCIDENT_TYPES: { label: string; value: IncidentType }[] = [
  { label: "Kecelakaan", value: "kecelakaan" },
  { label: "Pelanggaran", value: "pelanggaran" },
  { label: "Lainnya", value: "lainnya" },
];

const REPORT_IMAGES: Record<string, any> = {
  "memotong_jalan.jpg": require("@/assets/pelanggaran/memotong_jalan.jpg"),
  "parkir_di_trotoar.jpg": require("@/assets/pelanggaran/parkir_di_trotoar.jpg"),
  "terobos_lampu_merah.jpg": require("@/assets/pelanggaran/terobos_lampu_merah.jpg"),
  "lawan_arus.jpg": require("@/assets/pelanggaran/lawan_arus.jpg"),
  "terobos_lampu_merah_mobil.jpg": require("@/assets/pelanggaran/terobos_lampu_merah_mobil.jpg"),
};

const ALL_REPORTS: IncidentReport[] = [
  {
    id: "dummy-1",
    type: "pelanggaran",
    description:
      "Pengendara motor memotong jalur kendaraan lain secara tiba-tiba tanpa memberi isyarat.",
    photoUri: "@/assets/pelanggaran/memotong_jalan.jpg",
    isAnonymous: false,
    reporterName: "Ahmad Wijaya",
    address: "Jl. Sudirman No. 45, Jakarta Pusat",
    latitude: -6.2088,
    longitude: 106.8456,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "dummy-2",
    type: "pelanggaran",
    description: "Parkir sembarangan di trotoar menghalangi pejalan kaki.",
    photoUri: "@/assets/pelanggaran/parkir_di_trotoar.jpg",
    isAnonymous: true,
    address: "Jl. Gatot Subroto, Jakarta Selatan",
    latitude: -6.2297,
    longitude: 106.8114,
    createdAt: Date.now() - 7200000,
  },
  {
    id: "dummy-3",
    type: "pelanggaran",
    description:
      "Pengendara motor menerobos lampu merah saat lampu masih menyala merah.",
    photoUri: "@/assets/pelanggaran/terobos_lampu_merah.jpg",
    isAnonymous: false,
    reporterName: "Siti Nurhaliza",
    address: "Jl. Thamrin, Jakarta Pusat",
    latitude: -6.1944,
    longitude: 106.8229,
    createdAt: Date.now() - 14400000,
  },
  {
    id: "dummy-4",
    type: "pelanggaran",
    description:
      "Kendaraan melawan arus di jalan raya, sangat membahayakan pengendara lain.",
    photoUri: "@/assets/pelanggaran/lawan_arus.jpg",
    isAnonymous: false,
    reporterName: "Budi Santoso",
    address: "Jl. Rasuna Said, Jakarta Selatan",
    latitude: -6.2241,
    longitude: 106.8294,
    createdAt: Date.now() - 21600000,
  },
  {
    id: "dummy-5",
    type: "pelanggaran",
    description:
      "Mobil menerobos lampu merah dengan kecepatan tinggi di persimpangan ramai.",
    photoUri: "@/assets/pelanggaran/terobos_lampu_merah_mobil.jpg",
    isAnonymous: true,
    address: "Jl. Kuningan, Jakarta Selatan",
    latitude: -6.2382,
    longitude: 106.8317,
    createdAt: Date.now() - 28800000,
  },
];

export default function useReportScreen() {
  const {
    location,
    address,
    user,
    reports,
    addReport,
    deleteReport,
    hasLocationPermission,
    logout,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [showModal, setShowModal] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>("kecelakaan");
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentLocationLabel = useMemo(() => {
    if (address && address !== "Unknown location") return address;
    if (location) {
      return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
    }
    return "Lokasi belum tersedia";
  }, [address, location]);

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Izin dibutuhkan", "Berikan akses galeri untuk melampirkan foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Izin kamera dibutuhkan",
        "Aktifkan izin kamera untuk mengambil foto."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
    }
  };

  const handlePhotoAction = () => {
    Alert.alert(
      "Lampirkan foto",
      "Pilih sumber foto",
      [
        { text: "Batal", style: "cancel" },
        { text: "Kamera", onPress: takePhoto },
        { text: "Galeri", onPress: pickFromLibrary },
      ],
      { cancelable: true }
    );
  };

  const handleSubmit = () => {
    if (!hasLocationPermission || !location) {
      Alert.alert("Lokasi wajib", "Aktifkan lokasi sebelum mengirim laporan.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Isi penjelasan", "Tuliskan penjelasan kejadian.");
      return;
    }

    setSubmitting(true);

    const now = Date.now();
    const report: IncidentReport = {
      id: now.toString(),
      type: incidentType,
      customType: incidentType === "lainnya" ? customType.trim() : undefined,
      description: description.trim(),
      photoUri,
      isAnonymous,
      reporterName: isAnonymous ? undefined : user?.name,
      address: currentLocationLabel,
      latitude: location?.latitude,
      longitude: location?.longitude,
      createdAt: now,
    };

    addReport(report);

    setDescription("");
    setCustomType("");
    setIncidentType("kecelakaan");
    setPhotoUri(undefined);
    setIsAnonymous(false);
    setSubmitting(false);
    setShowModal(false);

    Alert.alert("Laporan dikirim", "Terima kasih atas laporannya.");
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const displayReports = activeTab === "all" ? ALL_REPORTS : reports;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return {
    INCIDENT_TYPES,
    REPORT_IMAGES,
    displayReports,
    activeTab,
    setActiveTab,
    showModal,
    setShowModal,
    incidentType,
    setIncidentType,
    customType,
    setCustomType,
    description,
    setDescription,
    photoUri,
    isAnonymous,
    setIsAnonymous,
    submitting,
    currentLocationLabel,
    handlePhotoAction,
    handleSubmit,
    deleteReport,
    formatDate,
    handleLogout,
  };
}
