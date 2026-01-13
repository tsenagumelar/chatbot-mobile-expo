// Location types
export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number;
  timestamp: number;
}

export interface LocationAddress {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  formattedAddress?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  documents?: DocumentInfo[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  sessionId: string | null;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  lastMessageAt: number;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  location: string;
  speed: number;
  traffic: string;
  latitude: number;
  longitude: number;
}

export interface DocumentInfo {
  file_name: string;
  file_type: string;
  file_url: string;
  description?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  session_id?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  file_url: string;
  file_name: string;
  error?: string;
}

// Traffic types
export interface TrafficData {
  status: string;
  distance: string;
  duration: string;
  avg_speed: string;
  condition: "light" | "moderate" | "heavy" | "unknown";
  condition_emoji: string;
}

export interface TrafficResponse {
  success: boolean;
  traffic: TrafficData;
  error?: string;
}

// Route types
export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface RouteData {
  route_number: number;
  summary: string;
  distance: string;
  duration: string;
  avg_speed: string;
  traffic_condition: "light" | "moderate" | "heavy";
  condition_emoji: string;
  start_address: string;
  end_address: string;
  steps: RouteStep[];
  total_steps: number;
}

export interface RouteResponse {
  success: boolean;
  routes: RouteData[];
  error?: string;
}

export interface RouteRequest {
  origin: string;
  destination: string;
}

export interface RouteRequestCoords {
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
}

// Report types
export type IncidentType = "kecelakaan" | "pelanggaran" | "lainnya";

export interface IncidentReport {
  id: string;
  type: IncidentType;
  customType?: string;
  description: string;
  photoUri?: string;
  isAnonymous: boolean;
  reporterName?: string;
  reporterPhone?: string;
  reporterEmail?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
}

// Notification types
export type NotificationSeverity = "warning" | "danger" | "info";

export interface NotificationCTA {
  type: string;
  label: string;
}

export interface NotificationDataPayload {
  scenarioId?: string;
  kategori?: string;
  trigger?: string;
  data_utama?: string[];
  sapaan_ringkas?: string;
  pengguna?: string[];
  icon?: string;
  color?: string;
  type?: NotificationSeverity;
  address?: string;
  coords?: {
    latitude: number;
    longitude: number;
  };
  cta?: NotificationCTA;
  user_latitude?: number;
  user_longitude?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  receivedAt: number;
  read: boolean;
  data?: NotificationDataPayload;
}
