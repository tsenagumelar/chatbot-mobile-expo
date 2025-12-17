import { create } from "zustand";
import type {
  ChatMessage,
  LocationData,
  RouteData,
  TrafficData,
} from "../types";

interface AppState {
  // Location
  location: LocationData | null;
  address: string;
  speed: number;

  // Traffic
  traffic: TrafficData | null;
  trafficLoading: boolean;

  // Chat
  messages: ChatMessage[];
  chatLoading: boolean;
  sessionId: string | null;

  // Routes
  routes: RouteData[];
  selectedRoute: RouteData | null;
  routesLoading: boolean;

  // UI
  isMapReady: boolean;

  // Actions
  setLocation: (location: LocationData | null) => void;
  setAddress: (address: string) => void;
  setSpeed: (speed: number) => void;

  setTraffic: (traffic: TrafficData | null) => void;
  setTrafficLoading: (loading: boolean) => void;

  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setChatLoading: (loading: boolean) => void;
  setSessionId: (sessionId: string | null) => void;

  setRoutes: (routes: RouteData[]) => void;
  setSelectedRoute: (route: RouteData | null) => void;
  setRoutesLoading: (loading: boolean) => void;

  setMapReady: (ready: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  location: null,
  address: "Unknown location",
  speed: 0,

  traffic: null,
  trafficLoading: false,

  messages: [],
  chatLoading: false,
  sessionId: null,

  routes: [],
  selectedRoute: null,
  routesLoading: false,

  isMapReady: false,

  // Location actions
  setLocation: (location) => set({ location }),
  setAddress: (address) => set({ address }),
  setSpeed: (speed) => set({ speed }),

  // Traffic actions
  setTraffic: (traffic) => set({ traffic }),
  setTrafficLoading: (loading) => set({ trafficLoading: loading }),

  // Chat actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [], sessionId: null }),
  setChatLoading: (loading) => set({ chatLoading: loading }),
  setSessionId: (sessionId) => set({ sessionId }),

  // Routes actions
  setRoutes: (routes) => set({ routes }),
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  setRoutesLoading: (loading) => set({ routesLoading: loading }),

  // UI actions
  setMapReady: (ready) => set({ isMapReady: ready }),
}));
