import axios, { AxiosError } from "axios";
import type {
  ChatContext,
  ChatResponse,
  RouteRequestCoords,
  RouteResponse,
  TrafficResponse,
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
 * Send chat message to AI assistant with session management
 */
export async function sendChatMessage(
  message: string,
  context: ChatContext,
  sessionId: string | null = null
): Promise<{ response: string; sessionId: string }> {
  try {
    const payload = {
      message,
      context,
      session_id: sessionId || "",
    };

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
      throw new Error(
        error.response?.data?.error || error.message || "Network error"
      );
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
      throw new Error(
        error.response?.data?.error || error.message || "Network error"
      );
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
      throw new Error(
        error.response?.data?.error || error.message || "Network error"
      );
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
      throw new Error(
        error.response?.data?.error || error.message || "Network error"
      );
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

export default api;
