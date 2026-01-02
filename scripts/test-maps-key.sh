#!/bin/bash

# Test Google Maps API Key
# Usage: ./scripts/test-maps-key.sh YOUR_API_KEY

API_KEY=$1

if [ -z "$API_KEY" ]; then
  echo "❌ Error: API Key tidak diberikan"
  echo "Usage: ./scripts/test-maps-key.sh YOUR_API_KEY"
  exit 1
fi

echo "🔍 Testing Google Maps API Key..."
echo "API Key: ${API_KEY:0:20}...${API_KEY: -4}"
echo ""

# Test 1: Maps JavaScript API (basic test)
echo "📍 Test 1: Basic API validation..."
RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/js?key=$API_KEY")

if echo "$RESPONSE" | grep -q "InvalidKeyMapError"; then
  echo "❌ GAGAL: API Key tidak valid atau belum diaktifkan"
  echo ""
  echo "Solusi:"
  echo "1. Pastikan API key benar"
  echo "2. Enable 'Maps SDK for Android' di Google Cloud Console"
  echo "3. Tunggu 5-10 menit untuk propagasi"
  exit 1
fi

# Test 2: Geocoding API (optional test)
echo "✅ Test 1 Passed"
echo ""
echo "📍 Test 2: Geocoding API (optional)..."
GEO_RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/geocode/json?address=Jakarta&key=$API_KEY")

if echo "$GEO_RESPONSE" | grep -q "REQUEST_DENIED"; then
  echo "⚠️  Warning: Geocoding API belum diaktifkan (optional)"
  echo "   API key tetap valid untuk Maps"
elif echo "$GEO_RESPONSE" | grep -q "OK"; then
  echo "✅ Test 2 Passed: Geocoding API aktif"
else
  echo "⚠️  Test 2: Status tidak jelas, cek manual di console"
fi

echo ""
echo "✅ API Key kemungkinan besar VALID!"
echo ""
echo "⚡ Next steps:"
echo "1. Pastikan 'Maps SDK for Android' sudah enabled"
echo "2. (Optional) Restrict API key dengan SHA-1 fingerprint"
echo "3. Update app.json dengan API key ini"
echo "4. Build APK: eas build --platform android --profile preview"
