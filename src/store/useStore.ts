import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ChatMessage,
  ChatSession,
  IncidentReport,
  LocationData,
  AppNotification,
  RouteData,
  TrafficData,
} from "../types";

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  dob?: string;
  gender?: string;
}

interface OnboardingData {
  name?: string;
  primary_vehicle?: string;
  city?: string;
  destination_latitude?: number;
  destination_longitude?: number;
  main_goals?: string[];
  auth_method?: string;
  phone_verified?: boolean;
}

type AppMode = "normal" | "menyapa";

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
  chatSessions: ChatSession[];
  activeSessionId: string | null;

  // Routes
  routes: RouteData[];
  selectedRoute: RouteData | null;
  routesLoading: boolean;

  // UI
  isMapReady: boolean;

  // Auth
  user: UserProfile | null;
  hasLocationPermission: boolean;

  // Onboarding
  onboarding: OnboardingData;
  onboardingCompleted: boolean;
  appMode: AppMode;

  // Reports
  reports: IncidentReport[];

  // Notifications
  notifications: AppNotification[];
  notificationIntervalSeconds: number;
  silentMode: boolean;

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
  createNewSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  saveCurrentSession: () => void;

  setRoutes: (routes: RouteData[]) => void;
  setSelectedRoute: (route: RouteData | null) => void;
  setRoutesLoading: (loading: boolean) => void;

  setMapReady: (ready: boolean) => void;

  login: (user: UserProfile) => void;
  logout: () => void;
  setLocationPermission: (granted: boolean) => void;

  setOnboarding: (data: Partial<OnboardingData>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setAppMode: (mode: AppMode) => void;

  addReport: (report: IncidentReport) => void;
  deleteReport: (id: string) => void;

  upsertNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setNotificationIntervalSeconds: (seconds: number) => void;
  setSilentMode: (silent: boolean) => void;
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
      chatSessions: [],
      activeSessionId: null,

      routes: [],
      selectedRoute: null,
      routesLoading: false,

      isMapReady: false,

      user: null,
      hasLocationPermission: false,

      onboarding: {},
      onboardingCompleted: false,
      appMode: "menyapa",

      reports: [],
      notifications: [],
      notificationIntervalSeconds: 30,
      silentMode: false,

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

      createNewSession: () =>
        set((state) => {
          // Save current session if there are messages
          if (state.messages.length > 0) {
            const currentSession: ChatSession = {
              id: state.activeSessionId || Date.now().toString(),
              sessionId: state.sessionId,
              name: `Chat ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`,
              messages: state.messages,
              createdAt: state.messages[0]?.timestamp || Date.now(),
              lastMessageAt: state.messages[state.messages.length - 1]?.timestamp || Date.now(),
            };
            const updatedSessions = [currentSession, ...state.chatSessions.filter(s => s.id !== currentSession.id)];
            return {
              messages: [],
              sessionId: null,
              activeSessionId: null,
              chatSessions: updatedSessions,
            };
          }
          return { messages: [], sessionId: null, activeSessionId: null };
        }),

      switchSession: (sessionId) =>
        set((state) => {
          const session = state.chatSessions.find((s) => s.id === sessionId);
          if (session) {
            return {
              messages: session.messages,
              sessionId: session.sessionId,
              activeSessionId: session.id,
            };
          }
          return state;
        }),

      deleteSession: (sessionId) =>
        set((state) => ({
          chatSessions: state.chatSessions.filter((s) => s.id !== sessionId),
        })),

      saveCurrentSession: () =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const sessionToSave: ChatSession = {
            id: state.activeSessionId || Date.now().toString(),
            sessionId: state.sessionId,
            name: `Chat ${new Date(state.messages[0]?.timestamp || Date.now()).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`,
            messages: state.messages,
            createdAt: state.messages[0]?.timestamp || Date.now(),
            lastMessageAt: state.messages[state.messages.length - 1]?.timestamp || Date.now(),
          };
          const updatedSessions = [
            sessionToSave,
            ...state.chatSessions.filter((s) => s.id !== sessionToSave.id),
          ];
          return { chatSessions: updatedSessions, activeSessionId: sessionToSave.id };
        }),

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
          hasLocationPermission: false,
          sessionId: null,
          messages: [],
          chatSessions: [],
          activeSessionId: null,
          notifications: [],
          onboarding: {},
          onboardingCompleted: false,
        }),
      setLocationPermission: (granted) =>
        set({
          hasLocationPermission: granted,
        }),

      setOnboarding: (data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            ...data,
          },
        })),
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      setAppMode: (mode) => set({ appMode: mode }),

      addReport: (report) =>
        set((state) => ({
          reports: [report, ...state.reports].slice(0, 100),
        })),
      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        })),

      upsertNotification: (notification) =>
        set((state) => {
          const existingIndex = state.notifications.findIndex(
            (item) => item.id === notification.id
          );
          if (existingIndex >= 0) {
            const updated = [...state.notifications];
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              ...notification,
              read: existing.read || notification.read,
              data: { ...existing.data, ...notification.data },
            };
            return { notifications: updated };
          }
          return {
            notifications: [notification, ...state.notifications].slice(0, 100),
          };
        }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item
          ),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({
            ...item,
            read: true,
          })),
        })),
      setNotificationIntervalSeconds: (seconds) =>
        set({
          notificationIntervalSeconds: Math.max(30, Math.min(120, seconds)),
        }),
      setSilentMode: (silent) => set({ silentMode: silent }),
    }),
    {
      name: "assistant-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        hasLocationPermission: state.hasLocationPermission,
        onboarding: state.onboarding,
        onboardingCompleted: state.onboardingCompleted,
        appMode: state.appMode,
        reports: state.reports,
        chatSessions: state.chatSessions,
        activeSessionId: state.activeSessionId,
        notifications: state.notifications,
        notificationIntervalSeconds: state.notificationIntervalSeconds,
        silentMode: state.silentMode,
      }),
    }
  )
);
