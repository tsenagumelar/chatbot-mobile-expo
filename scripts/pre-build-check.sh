#!/bin/bash

# Pre-build Checklist untuk Chat Assistant App
# Memastikan semua konfigurasi sudah benar sebelum build APK

echo "🔍 PRE-BUILD CHECKLIST"
echo "======================="
echo ""

ERRORS=0
WARNINGS=0

# Check 1: API Key exists in app.json
echo "1️⃣  Checking Google Maps API Key..."
API_KEY=$(grep -A 2 '"googleMaps"' app.json | grep '"apiKey"' | cut -d'"' -f4)

if [ -z "$API_KEY" ]; then
  echo "   ❌ GAGAL: Google Maps API Key tidak ditemukan di app.json"
  ERRORS=$((ERRORS + 1))
elif [ "$API_KEY" = "YOUR_GOOGLE_MAPS_API_KEY_HERE" ]; then
  echo "   ❌ GAGAL: API Key masih placeholder, belum diganti"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ API Key ditemukan: ${API_KEY:0:20}...${API_KEY: -4}"

  # Test API Key validity
  echo "   🔍 Testing API key validity..."
  RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/js?key=$API_KEY")

  if echo "$RESPONSE" | grep -q "InvalidKeyMapError"; then
    echo "   ❌ GAGAL: API Key tidak valid"
    ERRORS=$((ERRORS + 1))
  else
    echo "   ✅ API Key valid"
  fi
fi
echo ""

# Check 2: Backend URL
echo "2️⃣  Checking Backend URL..."
BACKEND_URL=$(grep 'API_BASE_URL' src/utils/constants.ts | cut -d'"' -f2)

if [ -z "$BACKEND_URL" ]; then
  echo "   ❌ GAGAL: Backend URL tidak ditemukan"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ Backend URL: $BACKEND_URL"

  # Check if using localhost (won't work in APK)
  if echo "$BACKEND_URL" | grep -q "localhost\|127.0.0.1"; then
    echo "   ⚠️  WARNING: Backend menggunakan localhost - tidak akan berfungsi di APK!"
    echo "      Gunakan IP address atau domain untuk production"
    WARNINGS=$((WARNINGS + 1))
  fi

  # Check cleartext traffic for HTTP
  if echo "$BACKEND_URL" | grep -q "^http://"; then
    CLEARTEXT=$(grep -A 10 '"android"' app.json | grep '"usesCleartextTraffic"')
    if [ -z "$CLEARTEXT" ]; then
      echo "   ⚠️  WARNING: Backend menggunakan HTTP tapi usesCleartextTraffic tidak aktif"
      WARNINGS=$((WARNINGS + 1))
    else
      echo "   ✅ usesCleartextTraffic aktif untuk HTTP backend"
    fi
  fi
fi
echo ""

# Check 3: Required assets
echo "3️⃣  Checking required assets..."
REQUIRED_ASSETS=("assets/icon.png" "assets/adaptive-icon.png" "assets/splash.png")

for asset in "${REQUIRED_ASSETS[@]}"; do
  if [ -f "$asset" ]; then
    echo "   ✅ $asset exists"
  else
    echo "   ❌ GAGAL: $asset tidak ditemukan"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Check 4: EAS configuration
echo "4️⃣  Checking EAS configuration..."
if [ -f "eas.json" ]; then
  echo "   ✅ eas.json exists"

  # Check project ID
  PROJECT_ID=$(grep '"projectId"' app.config.js | cut -d'"' -f4)
  if [ -z "$PROJECT_ID" ]; then
    echo "   ⚠️  WARNING: EAS projectId tidak ditemukan di app.config.js"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "   ✅ EAS Project ID: $PROJECT_ID"
  fi
else
  echo "   ❌ GAGAL: eas.json tidak ditemukan"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: Package dependencies
echo "5️⃣  Checking critical dependencies..."
CRITICAL_DEPS=("react-native-maps" "expo-location" "axios")

for dep in "${CRITICAL_DEPS[@]}"; do
  if grep -q "\"$dep\"" package.json; then
    echo "   ✅ $dep installed"
  else
    echo "   ⚠️  WARNING: $dep mungkin belum terinstall"
    WARNINGS=$((WARNINGS + 1))
  fi
done
echo ""

# Summary
echo "📊 SUMMARY"
echo "=========="
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✅ All critical checks passed!"
  echo ""

  if [ $WARNINGS -eq 0 ]; then
    echo "🎉 Perfect! Siap untuk build APK"
    echo ""
    echo "Run: eas build --platform android --profile preview"
  else
    echo "⚠️  Found $WARNINGS warning(s) - cek di atas"
    echo ""
    echo "Anda bisa build, tapi perhatikan warning di atas"
    echo "Run: eas build --platform android --profile preview"
  fi
  exit 0
else
  echo "❌ Found $ERRORS error(s) and $WARNINGS warning(s)"
  echo ""
  echo "Perbaiki error di atas sebelum build!"
  exit 1
fi
