import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const THEME_KEY = '@beauty_ai_theme';

// Reddit-style dark theme colors
export const themes = {
  light: {
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F2F2F7',
    backgroundTertiary: '#E5E5EA',
    card: '#FFFFFF',

    // Text
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#AEAEB2',
    textInverse: '#FFFFFF',

    // Accents
    primary: '#007AFF',
    primaryLight: '#E3F2FF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',

    // Borders
    border: '#C6C6C8',
    borderLight: '#E5E5EA',

    // Components
    inputBackground: '#F2F2F7',
    navBar: '#F2F2F7',
    tabBar: '#FFFFFF',
    tabBarBorder: '#C6C6C8',

    // Specific
    searchBar: '#F2F2F7',
    modalOverlay: 'rgba(0, 0, 0, 0.4)',
    shadow: '#000000',
  },
  dark: {
    // Reddit-style dark backgrounds
    background: '#1A1A1B',
    backgroundSecondary: '#272729',
    backgroundTertiary: '#343536',
    card: '#272729',

    // Text
    text: '#D7DADC',
    textSecondary: '#818384',
    textTertiary: '#6A6A6B',
    textInverse: '#1A1A1B',

    // Accents (Reddit orange as primary)
    primary: '#FF4500',
    primaryLight: '#3D2314',
    success: '#46D160',
    warning: '#FFB000',
    error: '#FF585B',

    // Borders
    border: '#343536',
    borderLight: '#3D3D3E',

    // Components
    inputBackground: '#272729',
    navBar: '#1A1A1B',
    tabBar: '#1A1A1B',
    tabBarBorder: '#343536',

    // Specific
    searchBar: '#272729',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    shadow: '#000000',
  },
};

export type Theme = typeof themes.light;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  // Determine actual theme based on mode
  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = isDark ? themes.dark : themes.light;

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
