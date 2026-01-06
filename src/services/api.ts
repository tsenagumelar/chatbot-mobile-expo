import axios, { AxiosError } from "axios";
import type {
  ChatContext,
  ChatResponse,
  RouteRequestCoords,
  RouteResponse,
  TrafficResponse
} from "../types";
import { API_BASE_URL } from "../utils/constants";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error("❌ Response Error:", error.message);
    return Promise.reject(error);
  }
);

/**
 * Send chat message to AI assistant with session management and documents
 */
export async function sendChatMessage(
  message: string,
  context: ChatContext,
  sessionId: string | null = null,
  imageUri?: string
): Promise<{ response: string; sessionId: string }> {
  try {
    // Build base payload
    const payload: any = {
      message,
      context,
    };

    if (sessionId && sessionId.trim() !== "") {
      payload.session_id = sessionId;
      console.log("🔄 Using existing session:", sessionId);
    } else {
      console.log("🆕 Starting new session");
    }

    // If there's an image, add documents array with random file_url
    if (imageUri) {
      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'document.jpg';
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Generate random file URL (backend doesn't need actual file upload)
      const randomId = Math.random().toString(36).substring(7);
      const fileUrl = `https://storage.chatbotapi.activa.id/uploads/${randomId}_${filename}`;
      
      // Build documents array
      payload.documents = [
        {
          file_name: filename,
          file_type: type,
          file_url: fileUrl,
          description: "User uploaded document"
        }
      ];

      console.log("📤 Sending with document:", {
        message,
        context,
        documents: payload.documents,
        sessionId: sessionId || "(new session)",
      });
    }

    console.log("🚀 API Request Payload:", JSON.stringify(payload, null, 2));

    const response = await api.post<ChatResponse>("/chat", payload);

    console.log(
      "📥 API Response Data:",
      JSON.stringify(response.data, null, 2)
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to get AI response");
    }

    // Ensure response is a string, not an object
    const aiResponse =
      typeof response.data.response === "string"
        ? response.data.response
        : JSON.stringify(response.data.response);

    const resultSessionId = response.data.session_id || sessionId || "";

    console.log("✅ Parsed response:", {
      responseType: typeof aiResponse,
      sessionId: resultSessionId,
    });

    return {
      response: aiResponse,
      sessionId: resultSessionId,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMsg = [
        `Backend URL: ${API_BASE_URL}`,
        `Endpoint: /chat`,
        `Error: ${error.response?.data?.error || error.message}`,
        error.code ? `Code: ${error.code}` : null,
        !error.response ? "⚠️ Backend Offline/Tidak dapat dijangkau" : `HTTP Status: ${error.response?.status}`,
      ].filter(Boolean).join("\n");
      throw new Error(errorMsg);
    }
    throw error;
  }
}

/**
 * Get traffic information for current location
 */
export async function getTrafficInfo(
  latitude: number,
  longitude: number
): Promise<TrafficResponse> {
  try {
    const response = await api.get<TrafficResponse>("/traffic", {
      params: { latitude, longitude },
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to get traffic info");
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMsg = [
        `Backend URL: ${API_BASE_URL}`,
        `Endpoint: /traffic`,
        `Error: ${error.response?.data?.error || error.message}`,
        error.code ? `Code: ${error.code}` : null,
        !error.response ? "⚠️ Backend Offline/Tidak dapat dijangkau" : `HTTP Status: ${error.response?.status}`,
      ].filter(Boolean).join("\n");
      throw new Error(errorMsg);
    }
    throw error;
  }
}

/**
 * Get alternative routes by address
 */
export async function getRoutesByAddress(
  origin: string,
  destination: string
): Promise<RouteResponse> {
  try {
    const response = await api.post<RouteResponse>("/routes", {
      origin,
      destination,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to get routes");
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMsg = [
        `Backend URL: ${API_BASE_URL}`,
        `Endpoint: /routes`,
        `Error: ${error.response?.data?.error || error.message}`,
        error.code ? `Code: ${error.code}` : null,
        !error.response ? "⚠️ Backend Offline/Tidak dapat dijangkau" : `HTTP Status: ${error.response?.status}`,
      ].filter(Boolean).join("\n");
      throw new Error(errorMsg);
    }
    throw error;
  }
}

/**
 * Get alternative routes by coordinates
 */
export async function getRoutesByCoords(
  coords: RouteRequestCoords
): Promise<RouteResponse> {
  try {
    const response = await api.post<RouteResponse>("/routes/coords", coords);

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to get routes");
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMsg = [
        `Backend URL: ${API_BASE_URL}`,
        `Endpoint: /routes/coords`,
        `Error: ${error.response?.data?.error || error.message}`,
        error.code ? `Code: ${error.code}` : null,
        !error.response ? "⚠️ Backend Offline/Tidak dapat dijangkau" : `HTTP Status: ${error.response?.status}`,
      ].filter(Boolean).join("\n");
      throw new Error(errorMsg);
    }
    throw error;
  }
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await axios.get(
      `${API_BASE_URL.replace("/api/v1", "")}/health`
    );
    return response.status === 200;
  } catch (error) {
    console.error("❌ API Connection Test Failed:", error);
    return false;
  }
}

/**
 * Search for location suggestions (geocoding)
 */
export async function searchLocation(
  query: string
): Promise<{ name: string; lat: number; lon: number }[]> {
  try {
    // Use Nominatim OpenStreetMap API for geocoding
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          limit: 5,
          countrycodes: "id", // Limit to Indonesia
        },
        headers: {
          "User-Agent": "ChatAssistantApp/1.0",
        },
      }
    );

    return response.data.map((item: any) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error("❌ Location search error:", error);
    return [];
  }
}

export default api;
