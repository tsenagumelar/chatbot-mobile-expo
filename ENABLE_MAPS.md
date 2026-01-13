# 🗺️ Re-Enable Google Maps

MapView telah di-disable sementara untuk mencegah crash di APK. Ikuti langkah ini untuk mengaktifkannya kembali setelah setup Google Maps API.

## Status Saat Ini

✅ **Google Maps API Key sudah ada**: `AIzaSyDZx9uIw7vYdZomB3fvNujWqa3lSsa5mkI` di [app.json:40](app.json:40)

❌ **Maps SDK for Android belum enabled** di Google Cloud Console

📝 **MapView di-comment** di:
- [app/(tabs)/index.tsx](app/(tabs)/index.tsx) - Home screen
- [app/(tabs)/routes.tsx](app/(tabs)/routes.tsx) - Routes screen

## Langkah 1: Enable Maps SDK for Android

1. Buka https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com
2. Pastikan project yang benar dipilih
3. Klik **"ENABLE"**
4. Tunggu 5-10 menit untuk propagasi

## Langkah 2: Verifikasi API Key Working

Test API key sudah berfungsi:

```bash
./scripts/test-maps-key.sh AIzaSyDZx9uIw7vYdZomB3fvNujWqa3lSsa5mkI
```

Harus menampilkan:
```
✅ API Key kemungkinan besar VALID!
```

## Langkah 3: Re-enable MapView di Code

### File 1: app/(tabs)/index.tsx

**Uncomment import:**
```typescript
// Baris 16 - Uncomment ini:
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
```

**Uncomment MapView component:**
```typescript
// Baris 283-320 - Hapus /* dan */ untuk uncomment:
{location && (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Ionicons name="map" size={20} color="#007AFF" />
      <Text style={styles.cardTitle}>Map View</Text>
    </View>
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        mapType="standard"
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="Your Location"
          description={address}
          pinColor="#007AFF"
        />
      </MapView>
    </View>
  </View>
)}
```

### File 2: app/(tabs)/routes.tsx

**Uncomment import:**
```typescript
// Baris 18 - Uncomment ini:
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
```

**Uncomment handleMapPress function:**
```typescript
// Baris 69-75 - Uncomment:
const handleMapPress = (event: any) => {
  const { latitude, longitude } = event.nativeEvent.coordinate;
  setSelectedDestination({ lat: latitude, lon: longitude });
  setDestination(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  setShowSuggestions(false);
};
```

**Uncomment MapView component:**
```typescript
// Baris 344-410 - Hapus /* dan */ untuk uncomment:
{location && (
  <View style={styles.mapCard}>
    <View style={styles.mapHeader}>
      <Ionicons name="map" size={20} color={COLORS.PRIMARY} />
      <Text style={styles.mapTitle}>
        {routes.length > 0 ? "Lokasi Rute" : "Lokasi Anda"}
      </Text>
    </View>
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        mapType="standard"
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsTraffic={true}
        onPress={handleMapPress}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="Your Location"
          description="Starting Point"
          pinColor={COLORS.PRIMARY}
        />
        {selectedDestination && (
          <Marker
            coordinate={{
              latitude: selectedDestination.lat,
              longitude: selectedDestination.lon,
            }}
            title="Destination"
            description="Tap to select"
            pinColor="#FF3B30"
          />
        )}
      </MapView>
    </View>
    <View style={styles.mapHint}>
      <Ionicons
        name={selectedDestination ? "checkmark-circle" : "information-circle"}
        size={16}
        color={selectedDestination ? "#34C759" : COLORS.PRIMARY}
      />
      <Text style={[
        styles.mapHintText,
        selectedDestination && { color: "#34C759" }
      ]}>
        {selectedDestination
          ? `Tujuan dipilih: ${selectedDestination.lat.toFixed(4)}, ${selectedDestination.lon.toFixed(4)}`
          : "Tap map untuk memilih lokasi tujuan"}
      </Text>
    </View>
  </View>
)}
```

## Langkah 4: Test di Development

Test dulu di Expo Go sebelum build APK:

```bash
npm start
```

Buka di Expo Go, pastikan:
- ✅ Map muncul di Home screen
- ✅ Map muncul di Routes screen
- ✅ Bisa tap map untuk pilih destination
- ✅ Tidak ada error di console

## Langkah 5: Build APK Baru

Setelah yakin semua bekerja:

```bash
eas build --platform android --profile preview
```

## Langkah 6: Test APK

Install APK hasil build dan test:
- [ ] App tidak crash saat buka
- [ ] Home screen map muncul (tidak blank/abu-abu)
- [ ] Routes screen map muncul
- [ ] Bisa tap map untuk pilih tujuan
- [ ] Backend connection bekerja

## Troubleshooting

### Map masih blank/abu-abu di APK

**Penyebab**: SHA-1 fingerprint belum didaftarkan (jika API key restricted)

**Solusi Quick**: Unrestrict API key
1. Google Cloud Console → Credentials
2. Edit API key
3. Application restrictions: **None**
4. Save, tunggu 5 menit

**Solusi Proper**: Tambah SHA-1 fingerprint
1. Get SHA-1 dari build: `eas credentials`
2. Tambahkan ke API key restrictions di Google Cloud

### Error: "This API project is not authorized"

Maps SDK for Android belum enabled. Ulangi Langkah 1.

### Map crash aplikasi

1. Check logcat: `adb logcat | grep -i "maps\|google"`
2. Pastikan API key di app.json benar
3. Clear cache dan rebuild: `eas build --clear-cache`

---

## Quick Checklist

Sebelum re-enable MapView:

- [ ] Maps SDK for Android sudah enabled di Google Cloud
- [ ] API key sudah di-test dan valid
- [ ] Tunggu 5-10 menit setelah enable SDK
- [ ] Uncomment semua code MapView di kedua file
- [ ] Test di Expo Go dulu
- [ ] Build APK baru
- [ ] Test APK di real device

---

**Dokumentasi terkait:**
- [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) - Setup Google Maps dari awal
- [VALIDATE_BEFORE_BUILD.md](VALIDATE_BEFORE_BUILD.md) - Validasi sebelum build
