# 📦 Panduan Build APK & IPA

Panduan lengkap untuk membuat APK (Android) dan IPA (iOS) dari project Chat Assistant.

## Pilihan Build

Ada 2 cara untuk build:
1. **EAS Build** (Recommended) - Build di cloud, mudah dan cepat
2. **Local Build** - Build di komputer sendiri, perlu setup Android Studio / Xcode

---

## Metode 1: EAS Build (Recommended) ⭐

### Langkah 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Langkah 2: Login ke Expo Account

```bash
eas login
```

Jika belum punya akun:
- Buka https://expo.dev/signup
- Daftar dengan email (gratis)
- Atau gunakan command: `eas register`

### Langkah 3: Configure Project

```bash
eas build:configure
```

Pilih platform: **Android**

### Langkah 4: Build APK Preview

```bash
eas build --platform android --profile preview
```

**Pilihan saat build:**
- Generate new Android Keystore? → **Yes**
- Build akan dimulai di cloud Expo

**Waktu build:** ~10-15 menit

### Langkah 5: Download APK

Setelah build selesai:
1. Akan ada link download di terminal
2. Atau cek di: https://expo.dev/accounts/[username]/projects/police-assistant-app/builds
3. Download APK dan install di Android

---

## Build Production APK

Untuk APK production (siap publish):

```bash
eas build --platform android --profile production
```

---

## Build iOS (.ipa) 🍎

### Option 1: iOS Simulator Build (Gratis, hanya untuk Mac)

```bash
eas build --platform ios --profile preview
```

**Catatan:**
- Build ini hanya untuk simulator, tidak bisa di-install di iPhone fisik
- Cocok untuk testing di Mac dengan Xcode Simulator
- Tidak perlu Apple Developer Account

### Option 2: iOS Device Build (Perlu Apple Developer Account)

```bash
eas build --platform ios --profile production
```

**Requirements:**
- Apple Developer Account ($99/tahun)
- Saat build, akan diminta Apple ID dan App-specific password
- Generate App-specific password di: https://appleid.apple.com/account/manage

**Langkah-langkah:**

1. **Pastikan sudah login EAS CLI**
   ```bash
   eas login
   ```

2. **Build untuk iOS**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Ikuti prompt:**
   - Apple ID: email developer account Anda
   - App-specific password: generate di Apple ID settings
   - Team ID: akan auto-detect jika punya

4. **Tunggu build selesai** (~15-20 menit)

5. **Download .ipa file**

### Install iOS Build

**Simulator (Mac only):**
```bash
# Install Xcode dari App Store
# Drag & drop .ipa ke Simulator
```

**Device (iPhone fisik):**
- Option 1: Upload ke TestFlight
- Option 2: Install via Apple Configurator
- Option 3: Ad-hoc distribution

### Build Both Platforms

Build Android dan iOS sekaligus:

```bash
eas build --platform all --profile production
```

---

## Metode 2: Local Build (Advanced)

### Prerequisites

1. **Android Studio** sudah terinstall
2. **Android SDK** dan tools
3. **JDK 11** atau lebih tinggi

### Langkah-langkah

#### 1. Prebuild

```bash
npx expo prebuild --platform android
```

Ini akan generate folder `android/`

#### 2. Build APK

```bash
cd android
./gradlew assembleRelease
```

APK akan ada di:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### 3. Sign APK (Optional)

Untuk production, APK harus di-sign. Generate keystore:

```bash
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

---

## Tips & Troubleshooting

### Update API URL untuk Production

Edit `src/utils/constants.ts`:

```typescript
// Ganti dengan URL backend production
const PROD_API_URL = "https://your-backend-api.com/api/v1";

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
```

### Build Size

- **Debug APK**: ~50-60 MB
- **Release APK**: ~30-40 MB (setelah minify)

### Error: Out of Memory

Jika build gagal karena memory, edit `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

### Error: SDK License

```bash
cd ~/Library/Android/sdk/tools/bin
./sdkmanager --licenses
```

Accept semua licenses.

### Build Slow?

EAS Build free tier:
- Priority: Low
- Concurrent builds: 1
- Build time: 10-20 menit

Upgrade ke paid plan untuk build lebih cepat.

---

## Check APK Info

Setelah download APK:

```bash
# Check APK size
ls -lh app.apk

# Extract APK info (perlu aapt)
aapt dump badging app.apk
```

---

## Install APK di Device

### Via ADB

```bash
adb install app.apk
```

### Via File Transfer

1. Copy APK ke HP via USB/email/drive
2. Buka file manager
3. Tap APK
4. Enable "Install from Unknown Sources" jika diminta
5. Install

---

## Publish ke Play Store (Optional)

### 1. Build AAB (Android App Bundle)

Edit `eas.json`, ganti `buildType` jadi `aab`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

Build:
```bash
eas build --platform android --profile production
```

### 2. Upload ke Play Console

1. Buat akun Google Play Developer ($25 one-time)
2. Buat aplikasi baru
3. Upload AAB file
4. Isi metadata (screenshot, description, dll)
5. Submit for review

---

## Update Version

Sebelum build baru, update version di `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

- `version`: Versi user-facing (1.0.0, 1.0.1, dst)
- `versionCode`: Angka increment untuk setiap build

---

## EAS Build Commands Cheat Sheet

```bash
# Login
eas login

# Build preview APK
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Cancel build
eas build:cancel

# Clear cache
eas build --clear-cache
```

---

## Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- EAS Pricing: https://expo.dev/pricing

---

## Quick Start (TL;DR)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK
eas build --platform android --profile preview

# Download from link provided
# Install APK on Android device
```

**Build selesai dalam ~15 menit!** ⚡
