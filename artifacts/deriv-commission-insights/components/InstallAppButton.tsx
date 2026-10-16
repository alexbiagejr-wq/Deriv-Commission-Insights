import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function installInstructions(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "To install, tap Share in Safari, then Add to Home Screen.";
  }
  if (/android/.test(userAgent)) {
    return "Open your browser menu and choose Install app or Add to Home screen.";
  }
  return "Use the install icon in your browser’s address bar, or choose Install app from its menu.";
}

export function InstallAppButton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };
    const registerServiceWorker = () => {
      void navigator.serviceWorker.register("/service-worker.js").catch((error: unknown) => {
        console.error("Could not register the app service worker.", error);
      });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      registerServiceWorker();
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (Platform.OS !== "web" || installed) return null;

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstructions((visible) => !visible);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setShowInstructions(false);
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <View
      style={[styles.container, { top: Math.max(insets.top, 8) + 8 }]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Install this app"
        onPress={() => void handleInstall()}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Feather name="download" size={16} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          Install app
        </Text>
      </Pressable>
      {showInstructions ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.instructions,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.instructionsText, { color: colors.foreground }]}>
            {installInstructions()}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss installation instructions"
            onPress={() => setShowInstructions(false)}
            hitSlop={8}
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 18,
    zIndex: 1001,
    alignItems: "flex-end",
    gap: 8,
  },
  button: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 13,
    borderRadius: 13,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  instructions: {
    maxWidth: 300,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    elevation: 5,
  },
  instructionsText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
});
