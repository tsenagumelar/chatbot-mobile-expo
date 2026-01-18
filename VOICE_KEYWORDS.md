# Voice Triggered Notifications

## Overview

Setiap notifikasi sekarang memiliki field `keywords` yang berisi array kata kunci unik. User dapat memicu notifikasi tertentu dengan menyebutkan salah satu keyword melalui voice input.

## Keywords Structure

### notif.json (Route-based Notifications)

| No  | ID                     | Mode          | Keywords                                                                   | Kategori     |
| --- | ---------------------- | ------------- | -------------------------------------------------------------------------- | ------------ |
| 1   | fatigue_time_to_rest   | Motor         | "lelah motor", "capek berkendara", "istirahat motor", "ngantuk naik motor" | Kelelahan    |
| 2   | fatigue_time_to_rest   | Mobil         | "lelah mengemudi", "capek nyetir", "istirahat mobil", "ngantuk mengemudi"  | Kelelahan    |
| 3   | weather_risk           | Motor         | "cuaca buruk motor", "hujan motor", "jalan licin motor"                    | Cuaca        |
| 4   | weather_risk           | Mobil         | "cuaca buruk mobil", "hujan mobil", "kabut tebal", "jalan licin mobil"     | Cuaca        |
| 5   | road_hazard            | Motor/Mobil   | "lubang jalan", "gangguan jalan", "kerusakan jalan", "jalan rusak"         | Jalan        |
| 6   | school_zone_active     | Motor/Mobil   | "zona sekolah", "area sekolah", "dekat sekolah", "kawasan sekolah"         | Zona Sekolah |
| 7   | helmet_seatbelt        | Motor         | "helm", "helm motor", "pengingat helm", "keselamatan helm"                 | Keselamatan  |
| 8   | seatbelt_reminder      | Mobil         | "sabuk pengaman", "sabuk keselamatan", "seatbelt", "pengingat sabuk"       | Keselamatan  |
| 9   | ev_charger_info        | Mobil Listrik | "charging mobil", "isi daya listrik", "spklu", "stasiun pengisian"         | Energi       |
| 10  | safe_speed_dynamic     | Motor/Mobil   | "kecepatan aman", "batas kecepatan", "kurangi kecepatan", "pelan pelan"    | Kecepatan    |
| 11  | event_crowd            | Motor/Mobil   | "keramaian", "event besar", "acara ramai", "banyak orang"                  | Event        |
| 12  | incident_notification  | Motor/Mobil   | "insiden", "kecelakaan", "tabrakan", "kejadian lalu lintas"                | Insiden      |
| 13  | demonstration_activity | Motor/Mobil   | "demo", "unjuk rasa", "aksi massa", "kegiatan masyarakat"                  | Demonstrasi  |
| 14  | rest_area_info         | Motor         | "rest area motor", "tempat istirahat motor", "area istirahat motor"        | Rest Area    |
| 15  | rest_area_info         | Mobil         | "rest area mobil", "tempat istirahat mobil", "area istirahat mobil"        | Rest Area    |

### notif_free.json (General/Free Ride Notifications)

| No  | ID                           | Mode        | Keywords                                                                    | Kategori             |
| --- | ---------------------------- | ----------- | --------------------------------------------------------------------------- | -------------------- |
| 1   | sim_expiry_reminder          | Motor/Mobil | "sim habis", "perpanjang sim", "masa sim", "sim expired"                    | Administrasi         |
| 2   | stnk_expiry_reminder         | Motor/Mobil | "stnk habis", "perpanjang stnk", "masa stnk", "stnk expired"                | Administrasi         |
| 3   | tax_payment_reminder         | Motor/Mobil | "bayar pajak", "pajak kendaraan", "pajak motor", "pajak mobil"              | Pajak                |
| 4   | official_letter_confirmation | Motor/Mobil | "surat polisi", "dokumen polisi", "konfirmasi surat", "surat resmi"         | Layanan              |
| 5   | demonstration_info           | Motor/Mobil | "info demo", "kegiatan masyarakat", "unjuk rasa hari ini"                   | Informasi            |
| 6   | puncak_route_open_close      | Mobil       | "jalur puncak", "buka tutup puncak", "rute puncak", "akses puncak"          | Rekayasa Lalu Lintas |
| 7   | toll_contraflow_morning      | Mobil       | "contraflow tol", "jalur tol berlawanan", "tol pagi"                        | Rekayasa Lalu Lintas |
| 8   | weather_general_info         | Motor/Mobil | "info cuaca", "prakiraan cuaca", "cuaca hari ini", "ramalan cuaca"          | Cuaca                |
| 9   | parking_info                 | Motor/Mobil | "tempat parkir", "area parkir", "parkir terdekat", "cari parkir"            | Parkir               |
| 10  | educational_safety_tip       | Motor/Mobil | "tips keselamatan", "edukasi berkendara", "safety tips", "cara aman"        | Edukasi              |
| 11  | nearby_hospital              | Motor/Mobil | "rumah sakit terdekat", "rs terdekat", "fasilitas kesehatan", "hospital"    | Kesehatan            |
| 12  | nearby_police_station        | Motor/Mobil | "polsek terdekat", "kantor polisi", "pos polisi", "markas polisi"           | Polisi               |
| 13  | traffic_update_general       | Motor/Mobil | "update lalu lintas", "info traffic", "kondisi jalan", "status lalu lintas" | Traffic              |
| 14  | gratitude_message            | Motor/Mobil | "terima kasih", "apresiasi", "selesai perjalanan", "tiba tujuan"            | Pesan                |

## Usage Example

### Cara Kerja:

1. User menekan tombol mic atau voice input
2. User menyebutkan keyword (misal: "cuaca buruk motor")
3. Sistem mencari notifikasi yang memiliki keyword tersebut
4. Sistem menampilkan notifikasi yang sesuai dengan mode kendaraan user

### Contoh Implementasi (hooks.ts):

```typescript
const findNotificationByKeyword = (voiceText: string, vehicleMode: string) => {
  const normalized = voiceText.toLowerCase();

  // Cari di notifData (route-based)
  const routeNotif = (notifData as any[]).find(
    (item) =>
      item.pengguna?.includes(vehicleMode) &&
      item.keywords?.some((keyword: string) =>
        normalized.includes(keyword.toLowerCase()),
      ),
  );

  if (routeNotif) return { notif: routeNotif, type: "route" };

  // Cari di notifFreeData (general)
  const freeNotif = (notifFreeData as any[]).find(
    (item) =>
      item.pengguna?.includes(vehicleMode) &&
      item.keywords?.some((keyword: string) =>
        normalized.includes(keyword.toLowerCase()),
      ),
  );

  if (freeNotif) return { notif: freeNotif, type: "free" };

  return null;
};

// Di dalam handleVoiceResult:
const handleVoiceResult = async (text: string, isFinal?: boolean) => {
  if (isFinal) {
    const vehicleMode =
      activeVehicle.value === "public" ? "angkutan_umum" : activeVehicle.value;
    const found = findNotificationByKeyword(text, vehicleMode);

    if (found) {
      triggerOverlay({
        text: found.notif.message,
        title: found.notif.title,
        category: found.notif.kategori,
        ctaLabel: found.notif.cta?.label ?? "",
        action: buildOverlayAction(found.notif, location),
      });
    }
  }
};
```

## Testing Keywords

### Motor Mode:

- "cuaca buruk motor" → Weather Risk notification
- "lelah motor" → Fatigue notification
- "zona sekolah" → School zone notification
- "rest area motor" → Rest area info

### Mobil Mode:

- "sabuk pengaman" → Seatbelt reminder
- "charging mobil" → EV charger info
- "jalur puncak" → Puncak route info
- "contraflow tol" → Toll contraflow info

### Universal (Motor & Mobil):

- "sim habis" → SIM expiry reminder
- "bayar pajak" → Tax payment reminder
- "insiden" → Incident notification
- "lubang jalan" → Road hazard notification

## Notes

- Keywords bersifat partial match (case-insensitive)
- User bisa menyebutkan bagian dari keyword (misal: "lelah" akan match "lelah motor")
- Sistem akan filter berdasarkan mode kendaraan aktif user
- Setiap notifikasi memiliki 3-4 keywords untuk variasi
