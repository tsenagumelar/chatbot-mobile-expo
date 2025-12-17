// API Configuration
const DEV_API_URL = "http://10.74.26.102:8080/api/v1";
const PROD_API_URL = "https://your-production-url.com/api/v1";

// Auto-detect development mode
export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// OpenStreetMap Tile Servers (FREE!)
export const MAP_TILES = {
  OSM_DEFAULT: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  CARTO_LIGHT: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  CARTO_DARK: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  TOPO: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
} as const;

// Default map tile
export const DEFAULT_MAP_TILE = MAP_TILES.CARTO_LIGHT;

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
