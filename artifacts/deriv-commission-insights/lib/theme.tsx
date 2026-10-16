import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, Platform } from "react-native";

type AppTheme = "light" | "dark";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => Promise<void>;
  error: string | null;
}

const THEME_KEY = "app.theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(THEME_KEY)
      .then((savedTheme) => {
        if (!mounted || (savedTheme !== "light" && savedTheme !== "dark")) {
          return;
        }
        setThemeState(savedTheme);
        if (Platform.OS !== "web") {
          Appearance.setColorScheme(savedTheme);
        }
      })
      .catch((loadError: unknown) => {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the saved appearance setting.",
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = useCallback(async (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    if (Platform.OS !== "web") {
      Appearance.setColorScheme(nextTheme);
    }
    setError(null);
    try {
      await AsyncStorage.setItem(THEME_KEY, nextTheme);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Could not save the appearance setting.";
      setError(message);
      throw new Error(message);
    }
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, error }),
    [theme, setTheme, error],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
