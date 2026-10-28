import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, darkTheme, lightTheme } from './colors';

interface ThemeContextType {
  themeMode: 'system' | 'dark' | 'light';
  setThemeMode: (mode: 'system' | 'dark' | 'light') => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  setThemeMode: () => {},
  colors: darkTheme,
  isDark: true,
});

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: 'system' | 'dark' | 'light';
}> = ({ children, initialMode = 'dark' }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(initialMode);

  const isDark =
    themeMode === 'system'
      ? systemColorScheme !== 'light'
      : themeMode === 'dark';

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
