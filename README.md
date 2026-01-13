# 🚓 Police Assistant Mobile App

AI-powered police assistant untuk pengemudi di Indonesia. Built with React Native + Expo.

## Features ✨

- 🗺️ **Real-time GPS Tracking** - Track lokasi dan kecepatan
- 🚦 **Traffic Information** - Info kondisi lalu lintas real-time
- 💬 **AI Chat Assistant** - Chat dengan AI tentang berkendara
- 🎤 **Voice Output** - Text-to-speech untuk respons AI
- 🛣️ **Route Planning** - Cari rute alternatif dengan traffic info
- 📍 **Google Maps** - Maps dengan Google Maps API

## Tech Stack 🛠️

- **React Native** + **Expo** - Framework mobile
- **TypeScript** - Type safety
- **Zustand** - State management
- **Axios** - HTTP client
- **React Navigation** - Navigation
- **expo-location** - GPS tracking
- **expo-speech** - Text-to-speech
- **react-native-maps** - Google Maps integration

## Prerequisites 📋

- Node.js 18+
- npm atau yarn
- Expo Go app di smartphone (untuk testing)
- Backend API running (lihat backend README)

## Installation 🚀

### 1. Install Dependencies

```bash
cd police-assistant-app
npm install
```

### 2. Configure Backend URL

Edit `src/utils/constants.ts`:

```typescript
const DEV_API_URL = "http://YOUR_LOCAL_IP:8080/api/v1";
// Ganti YOUR_LOCAL_IP dengan IP komputer Anda
// Jangan pakai localhost! Harus IP (misal: 192.168.1.100)
```

**Cara cek IP:**

```bash
# macOS/Linux
ifconfig | grep inet

# Windows
ipconfig
```

### 3. Run Development Server

```bash
# Start Expo
npx expo start
```

### 4. Test di Smartphone

1. Install **Expo Go** dari Play Store/App Store
2. Scan QR code dari terminal
3. App akan terbuka di Expo Go

## Project Structure 📁

```
police-assistant-app/
├── App.tsx                    # Main app with navigation
├── app.json                   # Expo config
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Map + Speed meter
│   │   ├── ChatScreen.tsx     # AI chat
│   │   └── RoutesScreen.tsx   # Route planning
│   ├── components/
│   │   ├── MapView.tsx        # OSM map
│   │   ├── SpeedMeter.tsx     # Speed display
│   │   ├── ChatMessage.tsx    # Chat bubble
│   │   └── VoiceButton.tsx    # Voice input button
│   ├── services/
│   │   ├── api.ts             # API calls
│   │   ├── location.ts        # GPS service
│   │   └── voice.ts           # TTS service
│   ├── store/
│   │   └── useStore.ts        # Global state
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── utils/
│       └── constants.ts       # Config & constants
```

## Usage 💡

### Home Screen

- Menampilkan peta dengan posisi real-time
- Speed meter menampilkan kecepatan saat ini
- Traffic indicator menunjukkan kondisi lalu lintas
- Auto-tracking GPS saat app dibuka

### Chat Screen

- Tanya apa saja tentang berkendara
- AI akan menjawab dengan context lokasi & kecepatan
- Respons otomatis dibacakan (TTS)
- Contoh: "Bagaimana kondisi lalu lintas saya?"

### Routes Screen

- Cari rute dari lokasi saat ini ke tujuan
- Tampilkan beberapa alternatif rute
- Informasi traffic untuk setiap rute
- Turn-by-turn directions

## Configuration ⚙️

### Change Map Tiles

Edit `src/components/MapView.tsx`:

```typescript
import { MAP_TILES } from '../utils/constants';

// Light theme (default)
<MapComponent tileUrl={MAP_TILES.CARTO_LIGHT} />

// Dark theme
<MapComponent tileUrl={MAP_TILES.CARTO_DARK} />

// Topographic
<MapComponent tileUrl={MAP_TILES.TOPO} />
```

### Disable Auto-Speak

Edit `src/utils/constants.ts`:

```typescript
export const AUTO_SPEAK_RESPONSES = false;
```

## Troubleshooting 🔧

### Maps tidak muncul

- Pastikan permissions lokasi sudah granted
- Cek koneksi internet (OSM tiles butuh internet)
- Restart app

### Location tidak update

- Pastikan GPS aktif di smartphone
- Buka Settings → Privacy → Location → Expo Go → Allow
- Coba di outdoor (GPS lebih akurat)

### API Error / Network Failed

- Pastikan backend running
- Cek `API_BASE_URL` di constants.ts
- Pastikan smartphone dan komputer di network yang sama
- Jangan pakai `localhost`, pakai IP address!

### Slow Performance

- Jangan run di debug mode untuk production
- Build dengan `expo build`
- Gunakan production mode

## Building for Production 📦

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform android --profile preview
```

### iOS

```bash
eas build --platform ios --profile preview
```

## API Endpoints 🌐

App menggunakan endpoint berikut:

- `POST /api/v1/chat` - AI conversation
- `GET /api/v1/traffic` - Traffic info
- `POST /api/v1/routes` - Route search
- `POST /api/v1/routes/coords` - Route by coordinates

## Environment Variables 🔐

Google Maps API key sudah terkonfigurasi di:
- `app.config.js` - iOS dan Android configuration
- `src/services/api.ts` - Geocoding service

API Key: AIzaSyDZx9uIw7vYdZomB3fvNujWqa3lSsa5mkI

## Performance Tips 🚀

1. **Location Updates**: Default 2 detik, bisa dikurangi jika butuh real-time
2. **Traffic Updates**: Default 30 detik, sesuaikan sesuai kebutuhan
3. **Map Rendering**: Google Maps native rendering untuk performa optimal
4. **Chat History**: Max 50 messages (configurable)

## Future Improvements 🎯

- [ ] Voice input (Speech-to-Text)
- [ ] Offline maps
- [ ] Speed limit alerts
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Weather integration
- [ ] Emergency contacts quick dial

## License 📄

MIT License

## Support 💬

Untuk pertanyaan atau issues, buka issue di GitHub atau hubungi developer.

---

Built with ❤️ for Indonesian drivers
