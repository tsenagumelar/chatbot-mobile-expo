import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ChatMessage,
  IncidentReport,
  LocationData,
  RouteData,
  TrafficData,
} from "../types";

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  dob?: string;
}

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

  // Auth
  user: UserProfile | null;
  hasLocationPermission: boolean;

  // Reports
  reports: IncidentReport[];

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

  login: (user: UserProfile) => void;
  logout: () => void;
  setLocationPermission: (granted: boolean) => void;

  addReport: (report: IncidentReport) => void;
  deleteReport: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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

      user: null,
      hasLocationPermission: false,

      reports: [],

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

      login: (user) => set({ user }),
      logout: () =>
        set({
          user: null,
          sessionId: null,
          messages: [],
        }),
      setLocationPermission: (granted) =>
        set({
          hasLocationPermission: granted,
        }),

      addReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports].slice(0, 100),
        })),
      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "assistant-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        hasLocationPermission: state.hasLocationPermission,
        reports: state.reports,
      }),
    }
  )
);
