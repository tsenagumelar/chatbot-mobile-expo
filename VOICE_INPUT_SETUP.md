# 🎤 Voice Input Setup & Troubleshooting

## Perbaikan Terbaru (v2)

### ✅ Fixed Issues:
1. **"Recognition already started" error** - Sekarang auto-detect dan force restart
2. **Stuck di "Listening"** - Added proper state management & auto-stop
3. **Tidak mendeteksi speech** - Explicit microphone permission request
4. **`continuous: true`** - Keep listening sampai user stop manual
5. **Debug info** - Menampilkan status real-time di UI

### Perubahan yang Sudah Dilakukan

### 1. **Permissions Android**
Menambahkan permission yang diperlukan:
- ✅ `RECORD_AUDIO` - untuk mengakses mikrofon
- ✅ `MODIFY_AUDIO_SETTINGS` - untuk kontrol audio
- ✅ `INTERNET` - untuk Web Speech API (memerlukan internet)

### 2. **WebView Configuration**
- ✅ Runtime permission request untuk mikrofon
- ✅ JavaScript & DOM storage enabled
- ✅ Media playback & inline support
- ✅ Mixed content mode untuk HTTPS/HTTP
- ✅ File access enabled

### 3. **Web Speech API**
- ✅ Menggunakan Web Speech API (Google)
- ✅ Support Bahasa Indonesia (`id-ID`)
- ✅ **continuous: true** - Keep listening sampai stop manual
- ✅ Explicit microphone permission request dengan getUserMedia()
- ✅ Auto-detect & fix "already started" error
- ✅ Better state management untuk prevent stuck
- ✅ Real-time debug info di UI
- ✅ Console logging lengkap untuk debugging

## How It Works Now

```
1. User tap mic button
2. Request microphone permission via getUserMedia() first
3. If granted → Start Web Speech API
4. Status: "Listening..." dengan debug info
5. Microphone tetap aktif (continuous: true)
6. Real-time transcript muncul saat user bicara
7. User tap mic lagi untuk stop
8. Send transcript to chat
```

## Requirements

### Untuk Voice Input Bekerja:
1. **Google App** harus terinstall di Android device
2. **WebView** harus up-to-date (Android System WebView)
3. **Internet Connection** - Web Speech API perlu koneksi internet
4. **Microphone Permission** - akan diminta saat pertama kali

## Testing Voice Input

### 1. Build APK
```bash
npm run build:preview
# atau
npm run build:production
```

### 2. Install di Device Android
- Download APK dari Expo dashboard
- Install di perangkat fisik (tidak bisa di emulator tanpa hardware mic)

### 3. Test Voice Input
1. Buka aplikasi
2. Pergi ke tab **Chat**
3. Tap tombol **microphone** (ikon mic di samping input text)
4. Akan muncul modal Voice Input
5. **IMPORTANT**: Tap tombol mic besar di tengah
6. **Browser akan minta permission mikrofon 2x**:
   - Permission 1: getUserMedia (akses mic)
   - Permission 2: Web Speech API (speech recognition)
   - **Tap Allow untuk kedua-duanya**
7. Perhatikan debug info di bawah:
   - "🔄 Initializing microphone..." → sedang request permission
   - "✅ Microphone ready" → permission granted
   - "🎤 Microphone active" → recognition started
   - "✅ Detecting speech..." → sedang mendeteksi suara
8. **Bicara dengan jelas** dalam Bahasa Indonesia
9. Lihat transcript muncul real-time
10. Tap mic lagi untuk stop
11. Tap "Send to Chat" untuk mengirim

## Troubleshooting

### Problem: "Recognition has already started"
**Sudah diperbaiki!** Sekarang auto-detect dan force restart.
- Jika masih muncul, tap Stop → tunggu 1 detik → Start lagi

### Problem: Stuck di "Listening..." tapi tidak deteksi speech
**Solusi:**
1. **Cek debug info di bawah transcript:**
   - Jika "🔄 Initializing..." → permission belum granted
   - Jika "✅ Microphone ready" tapi tidak "🎤 Microphone active" → recognition gagal start
   - Jika "🎤 Microphone active" tapi tidak "✅ Detecting speech..." → microphone tidak detect suara

2. **Test microphone:**
   - Buka Voice Recorder app lain
   - Record suara → play back
   - Jika tidak ada suara → problem di hardware microphone

3. **Bicara lebih keras & jelas:**
   - Google Speech API perlu suara cukup kuat
   - Jangan terlalu jauh dari mic
   - Bicara dengan kecepatan normal (tidak terlalu cepat)

4. **Perhatikan console logs:**
   - Look for "✅ Recognition started successfully"
   - Look for "📝 Got result" saat bicara
   - Jika tidak ada logs → speech API tidak jalan

### Problem: Permission popup tidak muncul
**Solusi:**
- Buka Chrome settings (jika WebView menggunakan Chrome engine)
- Clear site permissions
- Atau: Settings → Apps → POLANTAS MENYAPA → Permissions → Reset
- Restart app

## Architecture

```
Voice Input Flow:
1. User taps mic button → Opens modal with WebView
2. WebView loads HTML dengan Web Speech API
3. Request mic permission (first time only)
4. User taps mic → Start speech recognition
5. Speech → Text conversion (real-time)
6. User taps "Send to Chat" → Transcript sent to chat
```

## Alternative: Native Speech Recognition

Jika WebView approach tidak bekerja, bisa gunakan `expo-speech-recognition`:

```bash
# Install package
npx expo install expo-speech-recognition

# Build dengan dev client
eas build --platform android --profile development
```

Kemudian uncomment kode di:
- `/src/services/voice.ts` (lines 90-150)
- `/app/(tabs)/chat.tsx` (lines 62-84)

**Note**: Native approach memerlukan Development Build, tidak bisa di Expo Go.

## Logs untuk Debugging

Saat testing, perhatikan logs di Metro bundler atau DevTools:

**WebView Console Logs (in Chrome remote debugging):**
```
✅ Speech Recognition available: true
🎬 Starting recognition...
✅ Microphone permission granted
✅ Microphone ready
✅ Recognition started successfully
🎤 Microphone active
📝 Got result, results count: 1
⏳ Interim transcript: halo
✅ Final transcript: halo, confidence: 0.95
✅ Speech detected: 5 chars
```

**Debug Chrome WebView:**
```bash
# Enable USB debugging on Android
adb forward tcp:9222 localabstract:chrome_devtools_remote

# Open in Chrome:
chrome://inspect/#devices
```

**Expected Flow:**
1. "🔄 Initializing microphone..."
2. "✅ Microphone ready" (permission granted)
3. "🎤 Microphone active" (recognition started)
4. "✅ Detecting speech..." (while you talk)
5. "✅ Speech detected: X chars" (transcript received)

**If stuck at "Listening":**
- Check if any logs appear when you speak
- If no "📝 Got result" → Google Speech API not detecting
- Possible reasons:
  - Network issue (no internet)
  - Microphone hardware issue
  - Background noise too loud
  - Speaking too softly

## Supported Languages

Voice input mendukung bahasa:
- 🇮🇩 Bahasa Indonesia (`id-ID`) - Default
- 🇺🇸 English US (`en-US`)
- 🇬🇧 English UK (`en-GB`)

User bisa ganti bahasa di dropdown di modal Voice Input.
