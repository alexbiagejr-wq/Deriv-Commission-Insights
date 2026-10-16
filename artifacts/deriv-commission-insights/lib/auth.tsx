import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { DerivSession } from "@/lib/deriv";
import { DEFAULT_DERIV_APP_ID } from "@/lib/config";

const TOKEN_KEY = "deriv.access-token";
const METHOD_KEY = "deriv.auth-method";
const SETTINGS_KEY = "deriv.connection-settings";

export interface DerivSettings {
  appId: string;
}

interface AuthContextValue {
  isReady: boolean;
  session: DerivSession | null;
  settings: DerivSettings;
  connectWithToken: (token: string) => Promise<void>;
  saveSettings: (settings: DerivSettings) => Promise<void>;
  disconnect: () => Promise<void>;
}

const defaultSettings: DerivSettings = {
  appId: DEFAULT_DERIV_APP_ID,
};

const AuthContext = createContext<AuthContextValue | null>(null);

function nextSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<DerivSettings>(defaultSettings);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [savedToken, savedMethod, savedSettings] = await Promise.all([
          Platform.OS === "web"
            ? Promise.resolve(null)
            : SecureStore.getItemAsync(TOKEN_KEY),
          AsyncStorage.getItem(METHOD_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (!mounted) return;
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings) as Partial<DerivSettings>;
          setSettings({ appId: parsed.appId ?? defaultSettings.appId });
        }
        if (savedToken && savedMethod === "pat") {
          setToken(savedToken);
          setSessionId(nextSessionId());
        }
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const session = useMemo<DerivSession | null>(() => {
    if (!token || !sessionId) return null;
    return { token, appId: settings.appId, id: sessionId };
  }, [sessionId, settings.appId, token]);

  const saveSettings = useCallback(async (next: DerivSettings) => {
    const normalized = {
      appId: next.appId.trim(),
    };
    if (!normalized.appId) throw new Error("Enter a Deriv App ID.");
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    setSettings(normalized);
  }, []);

  const finishConnection = useCallback(
    async (accessToken: string) => {
      if (!settings.appId.trim())
        throw new Error("Enter a Deriv App ID in Settings.");
      if (Platform.OS !== "web") {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      }
      await AsyncStorage.setItem(METHOD_KEY, "pat");
      setToken(accessToken);
      setSessionId(nextSessionId());
      await queryClient.invalidateQueries();
    },
    [queryClient, settings.appId],
  );

  const connectWithToken = useCallback(
    async (value: string) => {
      const accessToken = value.trim();
      if (!accessToken)
        throw new Error("Paste your Deriv API token.");
      await finishConnection(accessToken);
    },
    [finishConnection],
  );

  const disconnect = useCallback(async () => {
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    await AsyncStorage.removeItem(METHOD_KEY);
    setToken(null);
    setSessionId(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      isReady,
      session,
      settings,
      connectWithToken,
      saveSettings,
      disconnect,
    }),
    [
      connectWithToken,
      disconnect,
      isReady,
      saveSettings,
      session,
      settings,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
