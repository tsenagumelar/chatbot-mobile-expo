import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert } from "react-native";

type InfoTab = "traffic" | "cctv" | "incidents";

type InfoItem = {
  id: string;
  title: string;
  status: string;
  detail: string;
  time: string;
  reportedBy?: string;
  validVotes?: number;
  invalidVotes?: number;
};

type ListItem = InfoItem | (InfoItem & { video?: any; image?: any });

const dummyTraffic: (InfoItem & { image: any })[] = [
  {
    id: "t1",
    title: "Jl. Sudirman → Senayan",
    status: "Padat",
    detail: "Kecepatan rata-rata 18 km/j, antrean 600 m.",
    time: "3 mnt lalu",
    image: require("@/assets/info/Lalu Lintas 1.jpg"),
  },
  {
    id: "t2",
    title: "Tol Purbaleunyi KM 130",
    status: "Lancar",
    detail: "Semua lajur dibuka, cuaca cerah.",
    time: "8 mnt lalu",
    image: require("@/assets/info/Lalu Lintas 2.jpg"),
  },
  {
    id: "t3",
    title: "Jl. Asia Afrika",
    status: "Lancar",
    detail: "Arus lalu lintas lancar, tidak ada kendala.",
    time: "5 mnt lalu",
    image: require("@/assets/info/Lalu Lintas 3.jpg"),
  },
];

const dummyCctv: (InfoItem & { video: any })[] = [
  {
    id: "c1",
    title: "CCTV Alun-Alun",
    status: "Aktif",
    detail: "Menampilkan arus lalin bundaran utama.",
    time: "Live",
    video: require("@/assets/info/CCTV 1.mp4"),
  },
  {
    id: "c2",
    title: "CCTV Flyover Pasteur",
    status: "Aktif",
    detail: "Kepadatan sedang, jalur kiri lebih lancar.",
    time: "Live",
    video: require("@/assets/info/CCTV 2.mp4"),
  },
  {
    id: "c3",
    title: "CCTV Simpang Gasibu",
    status: "Aktif",
    detail: "Lalin lancar, cuaca cerah, zebra cross ramai pejalan.",
    time: "Live",
    video: require("@/assets/info/CCTV 3.mp4"),
  },
];

const dummyIncidents: (InfoItem & { image: any })[] = [
  {
    id: "i1",
    title: "Insiden minor di Jl. Dago",
    status: "Ditangani",
    detail: "Tabrakan kecil, tidak ada korban. Petugas mengatur arus.",
    time: "12 mnt lalu",
    reportedBy: "Ahmad S.",
    validVotes: 12,
    invalidVotes: 2,
    image: require("@/assets/info/Kejadian 1.jpg"),
  },
  {
    id: "i2",
    title: "Pohon tumbang Jl. Setiabudi",
    status: "Proses",
    detail: "Jalur kanan ditutup sementara, gunakan jalur alternatif.",
    time: "25 mnt lalu",
    reportedBy: "Budi W.",
    validVotes: 8,
    invalidVotes: 1,
    image: require("@/assets/info/Kejadian 2.jpg"),
  },
  {
    id: "i3",
    title: "Kecelakaan di Jl. Pasteur",
    status: "Ditangani",
    detail: "Kecelakaan ringan, sudah ditangani petugas.",
    time: "30 mnt lalu",
    reportedBy: "Siti N.",
    validVotes: 15,
    invalidVotes: 0,
    image: require("@/assets/info/Kejadian 3.jpg"),
  },
];

export default function useInfoScreen() {
  const [activeTab, setActiveTab] = useState<InfoTab>("traffic");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportLocation, setReportLocation] = useState("");
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [userIncidents, setUserIncidents] = useState<(InfoItem & { image: any })[]>(
    []
  );
  const [incidentVotes, setIncidentVotes] = useState<
    Record<string, { valid: number; invalid: number }>
  >({});

  const data = useMemo<ListItem[]>(() => {
    switch (activeTab) {
      case "traffic":
        return dummyTraffic;
      case "cctv":
        return dummyCctv;
      case "incidents":
      default:
        return [...userIncidents, ...dummyIncidents];
    }
  }, [activeTab, userIncidents]);

  const handleSubmitReport = () => {
    if (!reportTitle.trim() || !reportDetail.trim() || !reportLocation.trim()) {
      Alert.alert("Error", "Semua field harus diisi!");
      return;
    }

    if (!reportImage) {
      Alert.alert("Error", "Silakan upload foto kejadian!");
      return;
    }

    const newIncident: InfoItem & { image: any } = {
      id: `user-${Date.now()}`,
      title: reportTitle,
      status: "Dilaporkan",
      detail: reportDetail + " (Lokasi: " + reportLocation + ")",
      time: "Baru saja",
      reportedBy: "Anda",
      validVotes: 0,
      invalidVotes: 0,
      image: { uri: reportImage },
    };

    setUserIncidents((prev) => [newIncident, ...prev]);
    setShowReportModal(false);
    setReportTitle("");
    setReportDetail("");
    setReportLocation("");
    setReportImage(null);
    Alert.alert("Berhasil", "Laporan kejadian berhasil dikirim!");
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Error", "Izin akses galeri diperlukan!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReportImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Error", "Izin akses kamera diperlukan!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setReportImage(result.assets[0].uri);
    }
  };

  const handleVote = (itemId: string, voteType: "valid" | "invalid") => {
    setIncidentVotes((prev) => {
      const current = prev[itemId] || { valid: 0, invalid: 0 };
      return {
        ...prev,
        [itemId]: {
          valid: voteType === "valid" ? current.valid + 1 : current.valid,
          invalid: voteType === "invalid" ? current.invalid + 1 : current.invalid,
        },
      };
    });
  };

  const getItemStatus = (item: InfoItem) => {
    if (activeTab !== "incidents") return item.status;

    const votes = incidentVotes[item.id];
    const totalValid = (item.validVotes || 0) + (votes?.valid || 0);
    const totalInvalid = (item.invalidVotes || 0) + (votes?.invalid || 0);

    if (totalValid > 0 || totalInvalid > 0) {
      if (totalValid > totalInvalid) {
        return "Terkonfirmasi";
      }
    }
    return item.status;
  };

  const getVoteCounts = (item: InfoItem) => {
    const votes = incidentVotes[item.id];
    return {
      valid: (item.validVotes || 0) + (votes?.valid || 0),
      invalid: (item.invalidVotes || 0) + (votes?.invalid || 0),
    };
  };

  const title = useMemo(() => {
    switch (activeTab) {
      case "traffic":
        return "Info Lalu Lintas";
      case "cctv":
        return "CCTV Sekitar";
      case "incidents":
      default:
        return "Kejadian Terbaru Di Sekitar Kamu";
    }
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    showReportModal,
    setShowReportModal,
    reportTitle,
    setReportTitle,
    reportDetail,
    setReportDetail,
    reportLocation,
    setReportLocation,
    reportImage,
    setReportImage,
    data,
    title,
    handleSubmitReport,
    handlePickImage,
    handleTakePhoto,
    handleVote,
    getItemStatus,
    getVoteCounts,
  };
}
