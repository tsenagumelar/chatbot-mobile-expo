# ✅ Validasi Sebelum Build APK

Checklist untuk memastikan semua konfigurasi sudah benar sebelum build APK.

## 🚀 Quick Check (Otomatis)

Jalankan script pre-build check:

```bash
./scripts/pre-build-check.sh
```

Script ini akan check:
- ✅ Google Maps API Key valid
- ✅ Backend URL konfigurasi
- ✅ Asset files lengkap
- ✅ EAS configuration
- ✅ Dependencies installed

## 📋 Manual Checklist

### 1. Google Maps API Key

**Check API key di app.json:**
```bash
grep -A 2 "googleMaps" app.json
```

Harus menampilkan:
```json
"googleMaps": {
  "apiKey": "AIzaSy..." // Bukan "YOUR_GOOGLE_MAPS_API_KEY_HERE"
}
```

**Test API key validity:**
```bash
./scripts/test-maps-key.sh AIzaSyDFmkTTk0jbtExDEE3EuN1HA9AWQu2ZYnc
```

Output harus:
```
✅ API Key kemungkinan besar VALID!
```

**Manual test di browser:**

Buka URL ini di browser (ganti `YOUR_API_KEY`):
```
https://maps.googleapis.com/maps/api/staticmap?center=Jakarta&zoom=12&size=400x400&key=YOUR_API_KEY
```

Jika muncul peta Jakarta = ✅ API key valid
Jika error/blank = ❌ API key invalid

### 2. Maps SDK for Android Enabled

**Check di Google Cloud Console:**

1. Buka https://console.cloud.google.com/
2. Pilih project Anda
3. Menu **APIs & Services** → **Enabled APIs & services**
4. Pastikan **Maps SDK for Android** ada di list

**Jika belum enabled:**

1. Menu **APIs & Services** → **Library**
2. Cari "Maps SDK for Android"
3. Klik **Enable**
4. Tunggu 5-10 menit untuk propagasi

### 3. Backend Configuration

**Check backend URL:**
```bash
grep API_BASE_URL src/utils/constants.ts
```

Output:
```typescript
export const API_BASE_URL = "http://72.61.213.6:8080/api/v1";
```

**⚠️ Jika menggunakan HTTP (bukan HTTPS):**

Pastikan `usesCleartextTraffic` aktif di app.json:
```bash
grep usesCleartextTraffic app.json
```

Harus menampilkan:
```json
"usesCleartextTraffic": true,
```

**Test backend connection:**
```bash
curl http://72.61.213.6:8080/health
```

Jika dapat response = ✅ Backend reachable
Jika timeout/error = ❌ Backend offline/unreachable

### 4. Asset Files

**Check semua assets ada:**
```bash
ls -la assets/icon.png assets/adaptive-icon.png assets/splash.png assets/favicon.png
```

Semua file harus exists. Jika ada yang missing, copy dari `assets/images/`.

### 5. EAS Configuration

**Check eas.json:**
```bash
cat eas.json
```

Pastikan ada config untuk:
- `preview` profile (untuk testing)
- `production` profile (untuk release)

**Check EAS project ID:**
```bash
grep projectId app.config.js
```

Harus ada:
```javascript
projectId: "131af746-61da-4912-a89f-4217f17d8e10",
```

### 6. Dependencies Check

**Check react-native-maps installed:**
```bash
npm list react-native-maps
```

**If not installed:**
```bash
npm install react-native-maps
```

## 🧪 Test di Expo Go (Development)

Sebelum build APK, test dulu di Expo Go:

```bash
npm start
```

Buka di Expo Go app dan pastikan:
- ✅ Home screen muncul dengan map
- ✅ Routes screen bisa pilih destination di map
- ✅ Backend connection bekerja
- ✅ Tidak ada crash/error

## 🏗️ Build APK

Jika semua check ✅, build APK:

```bash
# Login dulu (sekali saja)
eas login

# Build preview APK
eas build --platform android --profile preview

# Atau build production
eas build --platform android --profile production
```

Build akan memakan waktu ~10-15 menit.

## 📥 Install & Test APK

Setelah build selesai:

1. **Download APK** dari link yang diberikan
2. **Install di device/emulator**
3. **Test checklist:**
   - [ ] App tidak crash saat buka
   - [ ] Home screen map muncul (bukan blank/abu-abu)
   - [ ] Routes screen map muncul dan bisa di-tap
   - [ ] Backend connection bekerja (cek chat, traffic, routes)
   - [ ] Location permission muncul dan bekerja
   - [ ] Voice input bekerja (jika digunakan)

## 🐛 Troubleshooting

### App crash saat buka (MapView error)

**Penyebab**: API key tidak valid atau Maps SDK belum enabled

**Solusi**:
1. Check API key di app.json
2. Enable Maps SDK for Android di Google Cloud
3. Tunggu 5-10 menit, rebuild

**Check error di logcat:**
```bash
adb logcat | grep -i "maps\|apikey"
```

### Map muncul tapi blank/abu-abu

**Penyebab**: SHA-1 fingerprint belum didaftarkan (jika API key restricted)

**Solusi 1** (Quick): Unrestrict API key sementara
1. Google Cloud Console → Credentials
2. Edit API key
3. Application restrictions: **None**
4. Save, tunggu 5 menit, rebuild

**Solusi 2** (Proper): Tambahkan SHA-1 fingerprint

Get SHA-1 dari EAS:
```bash
eas credentials
# Select Android → Production → Download keystore
# Extract SHA-1 dengan keytool
```

Tambahkan SHA-1 di API key restrictions.

### Backend selalu offline di APK

**Penyebab 1**: usesCleartextTraffic tidak aktif (untuk HTTP)

**Solusi**:
```json
// app.json
"android": {
  "usesCleartextTraffic": true
}
```

**Penyebab 2**: Backend tidak reachable dari device network

**Solusi**:
- Pastikan device dan backend di network yang sama
- Atau deploy backend ke cloud (Heroku, Railway, dll)

### Error: "BUILD_FAILED"

Check error message detail. Common issues:
- Asset files missing → Copy dari assets/images/
- Package name conflict → Check app.json package name
- Out of memory → Clear cache: `eas build --clear-cache`

## 🎯 Final Validation

Sebelum distribute APK ke user:

- [ ] Test di minimum 2 devices berbeda
- [ ] Test dengan internet WiFi dan Mobile data
- [ ] Test semua fitur utama (chat, routes, voice, dll)
- [ ] Test offline behavior
- [ ] Check app size tidak terlalu besar (< 50 MB ideal)
- [ ] Screenshot untuk Play Store (if publishing)

---

**Status Build Terakhir:**
- Google Maps API Key: ✅ Valid
- Backend URL: `http://72.61.213.6:8080/api/v1`
- usesCleartextTraffic: ✅ Enabled
- EAS Project ID: `131af746-61da-4912-a89f-4217f17d8e10`

Siap untuk build! 🚀
