import { useStore } from "@/src/store/useStore";
import { router } from "expo-router";
import { useEffect } from "react";

const REDIRECT_DELAY_MS = 1400;

export default function useSplashScreen() {
  const { onboardingCompleted, appMode } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onboardingCompleted) {
        router.replace(appMode === "menyapa" ? "/menyapa" : "/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [appMode, onboardingCompleted]);
}
