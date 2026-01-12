// Auto-detect development mode
export const API_BASE_URL = "https://chatbotapi.activa.id/api/v1";

// Google Maps configuration
export const GOOGLE_MAPS_API_KEY = "AIzaSyDFmkTTk0jbtExDEE3EuN1HA9AWQu2ZYnc";

// Speed limits (km/h)
export const SPEED_LIMITS = {
  CITY: 50,
  HIGHWAY: 80,
  TOLL_ROAD: 100,
};

// Traffic conditions
export const TRAFFIC_CONDITIONS = {
  LIGHT: "light",
  MODERATE: "moderate",
  HEAVY: "heavy",
  UNKNOWN: "unknown",
} as const;

// Colors
export const COLORS = {
  PRIMARY: "#007AFF",
  SUCCESS: "#34C759",
  WARNING: "#FF9500",
  DANGER: "#FF3B30",

  TRAFFIC_LIGHT: "#34C759",
  TRAFFIC_MODERATE: "#FF9500",
  TRAFFIC_HEAVY: "#FF3B30",

  BACKGROUND: "#F2F2F7",
  CARD: "#FFFFFF",
  TEXT_PRIMARY: "#000000",
  TEXT_SECONDARY: "#8E8E93",
};

// Location update interval
export const LOCATION_UPDATE_INTERVAL = 2000; // 2 seconds
export const LOCATION_DISTANCE_INTERVAL = 10; // 10 meters

// Chat settings
export const MAX_CHAT_HISTORY = 50;
export const AUTO_SPEAK_RESPONSES = true;
