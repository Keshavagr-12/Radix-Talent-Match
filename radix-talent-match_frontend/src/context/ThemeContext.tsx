import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  reducedMotion: boolean;
  setTheme: (theme: ThemeMode) => void;
  setReducedMotion: (reduced: boolean) => void;
}

const THEME_STORAGE_KEY = 'radix_tm_theme_v1';
const MOTION_STORAGE_KEY = 'radix_tm_reduced_motion_v1';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(MOTION_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const target =
        theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      setResolvedTheme(target);
      if (target === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore
    }
  };

  const setReducedMotion = (reduced: boolean) => {
    setReducedMotionState(reduced);
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, String(reduced));
    } catch {
      // Ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        reducedMotion,
        setTheme,
        setReducedMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
