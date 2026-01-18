const fs = require("fs");
const path = require("path");

// Read notif.json
const notifPath = path.join(__dirname, "../src/services/notif.json");
const notifData = JSON.parse(fs.readFileSync(notifPath, "utf8"));

// Keywords mapping for notif.json
const notifKeywords = {
  1: [
    "lelah motor",
    "capek berkendara",
    "istirahat motor",
    "ngantuk naik motor",
  ],
  2: [
    "lelah mengemudi",
    "capek nyetir",
    "istirahat mobil",
    "ngantuk mengemudi",
  ],
  3: ["cuaca buruk motor", "hujan motor", "jalan licin motor"],
  4: ["cuaca buruk mobil", "hujan mobil", "kabut tebal", "jalan licin mobil"],
  5: ["lubang jalan", "gangguan jalan", "kerusakan jalan", "jalan rusak"],
  6: ["zona sekolah", "area sekolah", "dekat sekolah", "kawasan sekolah"],
  7: ["helm", "helm motor", "pengingat helm", "keselamatan helm"],
  8: ["sabuk pengaman", "sabuk keselamatan", "seatbelt", "pengingat sabuk"],
  9: ["charging mobil", "isi daya listrik", "spklu", "stasiun pengisian"],
  10: ["kecepatan aman", "batas kecepatan", "kurangi kecepatan", "pelan pelan"],
  11: ["keramaian", "event besar", "acara ramai", "banyak orang"],
  12: ["insiden", "kecelakaan", "tabrakan", "kejadian lalu lintas"],
  13: ["demo", "unjuk rasa", "aksi massa", "kegiatan masyarakat"],
  14: ["rest area motor", "tempat istirahat motor", "area istirahat motor"],
  15: ["rest area mobil", "tempat istirahat mobil", "area istirahat mobil"],
};

// Add keywords to each notification
notifData.forEach((item) => {
  if (notifKeywords[item.no]) {
    item.keywords = notifKeywords[item.no];
  }
});

// Write back to file
fs.writeFileSync(notifPath, JSON.stringify(notifData, null, 2), "utf8");
console.log("✅ notif.json updated with keywords");

// Read notif_free.json
const notifFreePath = path.join(__dirname, "../src/services/notif_free.json");
const notifFreeData = JSON.parse(fs.readFileSync(notifFreePath, "utf8"));

// Keywords mapping for notif_free.json
const notifFreeKeywords = {
  1: ["sim habis", "perpanjang sim", "masa sim", "sim expired"],
  2: ["stnk habis", "perpanjang stnk", "masa stnk", "stnk expired"],
  3: ["bayar pajak", "pajak kendaraan", "pajak motor", "pajak mobil"],
  4: ["surat polisi", "dokumen polisi", "konfirmasi surat", "surat resmi"],
  5: ["info demo", "kegiatan masyarakat", "unjuk rasa hari ini"],
  6: ["jalur puncak", "buka tutup puncak", "rute puncak", "akses puncak"],
  7: ["contraflow tol", "jalur tol berlawanan", "tol pagi"],
  8: ["info cuaca", "prakiraan cuaca", "cuaca hari ini", "ramalan cuaca"],
  9: ["tempat parkir", "area parkir", "parkir terdekat", "cari parkir"],
  10: ["tips keselamatan", "edukasi berkendara", "safety tips", "cara aman"],
  11: [
    "rumah sakit terdekat",
    "rs terdekat",
    "fasilitas kesehatan",
    "hospital",
  ],
  12: ["polsek terdekat", "kantor polisi", "pos polisi", "markas polisi"],
  13: [
    "update lalu lintas",
    "info traffic",
    "kondisi jalan",
    "status lalu lintas",
  ],
  14: ["terima kasih", "apresiasi", "selesai perjalanan", "tiba tujuan"],
};

// Add keywords to each notification
notifFreeData.forEach((item) => {
  if (notifFreeKeywords[item.no]) {
    item.keywords = notifFreeKeywords[item.no];
  }
});

// Write back to file
fs.writeFileSync(notifFreePath, JSON.stringify(notifFreeData, null, 2), "utf8");
console.log("✅ notif_free.json updated with keywords");

console.log("\n🎉 All files updated successfully!");
