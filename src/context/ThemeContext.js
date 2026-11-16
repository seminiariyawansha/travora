// src/context/ThemeContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors } from "../theme/colors";

const STORAGE_KEY = "@travora_theme_pref";

const ThemeContext = createContext({
  theme: "system",          // 'light' | 'dark' | 'system'
  colors: lightColors,
  isDark: false,
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [theme, setThemePref] = useState("system");

  // load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => { if (val) setThemePref(val); })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((val) => {
    setThemePref(val);
    AsyncStorage.setItem(STORAGE_KEY, val).catch(() => {});
  }, []);

  // resolve effective scheme
  const effectiveScheme =
    theme === "system" ? (systemScheme ?? "light") : theme;
  const isDark = effectiveScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
