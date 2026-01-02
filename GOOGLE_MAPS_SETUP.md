# 🗺️ Setup Google Maps API Key

Aplikasi ini menggunakan Google Maps untuk menampilkan peta. Untuk build APK production, Anda perlu Google Maps API Key.

## Kenapa Perlu API Key?

- **Expo Go**: Sudah include API key development dari Expo (makanya jalan)
- **APK Production**: Perlu API key sendiri (tanpa ini aplikasi akan crash)

## Cara Mendapatkan Google Maps API Key (GRATIS)

### Langkah 1: Buka Google Cloud Console

1. Buka https://console.cloud.google.com/
2. Login dengan akun Google Anda
3. Buat project baru atau pilih project yang ada

### Langkah 2: Enable Maps SDK for Android

1. Di menu, pilih **APIs & Services** → **Library**
2. Cari **Maps SDK for Android**
3. Klik **Enable**

### Langkah 3: Create API Key

1. Kembali ke **APIs & Services** → **Credentials**
2. Klik **+ CREATE CREDENTIALS** → **API Key**
3. Copy API key yang muncul
4. (Opsional) Klik **Restrict Key** untuk keamanan

### Langkah 4: Restrict API Key (Recommended)

Untuk keamanan, batasi API key:

1. **Application restrictions**:
   - Pilih **Android apps**
   - Klik **Add an item**
   - Package name: `com.policeassistant.app`
   - SHA-1 certificate fingerprint: Dapatkan dengan command di bawah

2. **API restrictions**:
   - Pilih **Restrict key**
   - Centang **Maps SDK for Android**
   - Save

#### Mendapatkan SHA-1 Fingerprint

**Untuk development (debug):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Untuk production (release):**
```bash
# Jika sudah punya keystore
keytool -list -v -keystore /path/to/your-release-key.keystore

# Atau ambil dari EAS Build
eas credentials
```

### Langkah 5: Masukkan API Key ke Project

Edit file `app.json`, ganti `YOUR_GOOGLE_MAPS_API_KEY_HERE` dengan API key Anda:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      }
    }
  }
}
```

**PENTING**: Jangan commit API key ke git! Tambahkan ke `.gitignore` atau gunakan environment variables.

### Langkah 6: Rebuild APK

Setelah menambahkan API key:

```bash
eas build --platform android --profile preview
```

---

## Quota & Pricing

Google Maps API **GRATIS** untuk usage rendah:

- **$200 kredit gratis per bulan**
- **28,000 map loads per bulan** = gratis
- Cocok untuk aplikasi kecil/medium

Lihat pricing: https://mapsplatform.google.com/pricing/

---

## Troubleshooting

### Error: "Google Maps API error: API_KEY_INVALID"

- Pastikan API key sudah correct
- Pastikan **Maps SDK for Android** sudah enabled
- Tunggu 5-10 menit setelah create key (propagasi)

### Error: "This app won't run unless you update Google Play services"

- Update Google Play Services di device/emulator
- Atau gunakan emulator dengan Google APIs

### Maps tidak muncul (blank/abu-abu)

- Cek API key sudah benar
- Cek SHA-1 fingerprint sudah didaftarkan
- Cek billing sudah diaktifkan di Google Cloud (walaupun gratis)

---

## Alternative: Gunakan Mapbox (Gratis Juga)

Jika tidak mau pakai Google Maps, bisa ganti ke Mapbox:

1. Daftar di https://www.mapbox.com/
2. Dapatkan access token
3. Install `@rnmapbox/maps`
4. Ganti component MapView

**Quota Mapbox**: 50,000 map loads per bulan (gratis)

---

## Security Best Practice

### Jangan commit API key ke git:

**.gitignore**:
```
# API Keys
app.json
.env
```

### Gunakan environment variables:

**app.config.js**:
```javascript
export default {
  expo: {
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    }
  }
}
```

**.env**:
```
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
```

---

## Check API Key Working

Setelah setup, test di APK:

1. Install APK di device
2. Buka Home screen atau Routes screen
3. Map harus muncul dengan tiles Google Maps
4. Jika crash, cek logcat: `adb logcat | grep -i "maps\|apikey"`

---

**Need Help?**
- Google Maps docs: https://developers.google.com/maps/documentation/android-sdk/get-api-key
- Expo Maps docs: https://docs.expo.dev/versions/latest/sdk/map-view/
