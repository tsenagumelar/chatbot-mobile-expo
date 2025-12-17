# 🎉 Chat History di Backend - Session Management

## Overview

History chat sekarang disimpan di **backend** menggunakan session management. Frontend hanya perlu mengirim `session_id` tanpa perlu mengelola history sendiri.

## ✅ Keuntungan

1. **Lebih Simple**: Frontend tidak perlu track history
2. **Konsisten**: History disimpan terpusat di backend
3. **Aman**: History otomatis dibersihkan setelah 24 jam tidak aktif
4. **Efficient**: Otomatis batasi max 30 pesan per session

## 🚀 Cara Kerja

### Flow Sederhana:

```
1. Frontend kirim pesan TANPA session_id
   → Backend otomatis buat session baru
   → Return response + session_id

2. Frontend simpan session_id, kirim pesan berikutnya DENGAN session_id
   → Backend ambil history dari session
   → AI ingat konteks
   → Return response + session_id yang sama

3. Frontend terus pakai session_id yang sama untuk percakapan
   → AI selalu ingat konteks
```

## 📡 API Endpoints

### 1. Chat (Otomatis Handle Session)

```bash
POST /api/v1/chat
```

**Request Body:**

```json
{
  "message": "Halo, nama saya Taufan",
  "session_id": "", // Kosong untuk session baru, atau kirim session_id yang ada
  "context": {
    "location": "Jakarta Selatan",
    "latitude": -6.2608,
    "longitude": 106.7819,
    "speed": 0,
    "traffic": "smooth"
  }
}
```

**Response:**

```json
{
  "success": true,
  "response": "Halo Taufan! Senang berkenalan dengan Anda...",
  "session_id": "550e8400-e29b-41d4-a716-446655440000" // ⭐ Simpan ini!
}
```

### 2. Create Session (Optional - Manual)

```bash
POST /api/v1/session
```

**Response:**

```json
{
  "success": true,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Session created successfully"
}
```

### 3. Clear Session History

```bash
POST /api/v1/session/{session_id}/clear
```

**Response:**

```json
{
  "success": true,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Session history cleared"
}
```

### 4. Delete Session

```bash
DELETE /api/v1/session/{session_id}
```

**Response:**

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

### 5. Get Session Info (Debug)

```bash
GET /api/v1/session/{session_id}
```

**Response:**

```json
{
  "success": true,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message_count": 4,
  "created_at": "2025-12-16T17:00:00Z",
  "updated_at": "2025-12-16T17:05:00Z"
}
```

## 💻 Frontend Implementation

### Implementasi Lengkap (Simple):

```javascript
// Simpan session ID di state/memory
let currentSessionId = null;

async function sendMessage(message, context) {
  try {
    const response = await fetch("http://localhost:8080/api/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        session_id: currentSessionId || "", // Kosong jika belum ada
        context: context,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // ⭐ SIMPAN session_id dari response
      currentSessionId = data.session_id;

      return data.response;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Reset chat = hapus session_id lokal
function resetChat() {
  currentSessionId = null;
  // Atau call API untuk clear history:
  // fetch(`http://localhost:8080/api/v1/session/${currentSessionId}/clear`, {method: 'POST'})
}
```

### Implementasi dengan React:

```javascript
import { useState } from "react";

function ChatApp() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  const sendMessage = async (message, context) => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          session_id: sessionId || "",
          context: context,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Simpan session ID
        if (!sessionId) {
          setSessionId(data.session_id);
        }

        // Update UI
        setMessages([
          ...messages,
          { role: "user", content: message },
          { role: "assistant", content: data.response },
        ]);

        return data.response;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const resetChat = () => {
    setSessionId(null);
    setMessages([]);
  };

  return <div>{/* UI components */}</div>;
}
```

## 🧪 Testing

### Test 1: Otomatis Create Session

```bash
# Pesan pertama - TANPA session_id
curl -X POST http://localhost:8080/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Halo, nama saya Taufan",
    "session_id": "",
    "context": {
      "location": "Jakarta",
      "latitude": -6.2,
      "longitude": 106.8,
      "speed": 0,
      "traffic": "smooth"
    }
  }'

# Response akan include session_id:
# {"success":true,"response":"...","session_id":"550e8400-..."}
```

### Test 2: Gunakan Session yang Ada

```bash
# Pesan kedua - DENGAN session_id dari response pertama
curl -X POST http://localhost:8080/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Siapa nama saya?",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "context": {
      "location": "Jakarta",
      "latitude": -6.2,
      "longitude": 106.8,
      "speed": 0,
      "traffic": "smooth"
    }
  }'

# AI akan jawab "Taufan" ✅
```

### Test 3: Clear History

```bash
curl -X POST http://localhost:8080/api/v1/session/550e8400-e29b-41d4-a716-446655440000/clear
```

### Test 4: Get Session Info

```bash
curl http://localhost:8080/api/v1/session/550e8400-e29b-41d4-a716-446655440000
```

## 🔑 Key Points

1. **Tidak perlu manual buat session**: Kirim `session_id: ""` dan backend otomatis buat
2. **Simpan session_id**: Frontend hanya perlu simpan dan kirim ulang session_id
3. **Auto cleanup**: Session otomatis dihapus setelah 24 jam tidak aktif
4. **Max 30 pesan**: History otomatis dibatasi untuk efisiensi
5. **Backward compatible**: Masih support `history` di request body jika tidak pakai session

## 🆚 Perbandingan

### Frontend-Managed History (Sebelum):

```javascript
// ❌ Kompleks - Frontend harus track
let chatHistory = [];

fetch("/api/chat", {
  body: JSON.stringify({
    message: msg,
    history: chatHistory, // Frontend manage
  }),
});

// Frontend harus push ke history
chatHistory.push({ role: "user", content: msg });
chatHistory.push({ role: "assistant", content: resp });
```

### Backend-Managed Session (Sekarang):

```javascript
// ✅ Simple - Backend yang handle
let sessionId = null;

fetch("/api/chat", {
  body: JSON.stringify({
    message: msg,
    session_id: sessionId, // Hanya kirim ID
  }),
});

// Backend otomatis simpan history
sessionId = response.session_id; // Hanya simpan ID
```

## 📁 File Test

- `test_session.sh` - Script test dengan curl
- `test_session_frontend.html` - Test page dengan UI

## ⚙️ Storage

- **Type**: In-memory (sync.Map)
- **Persistence**: Session hilang saat server restart
- **Cleanup**: Auto delete session tidak aktif > 24 jam
- **Future**: Bisa upgrade ke Redis/Database jika perlu persistence

---

**Status**: ✅ Ready to use!
**Version**: 2.0 (Session-based)
