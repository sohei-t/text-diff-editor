import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeName } from '../types';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  availableThemes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEMES: ThemeName[] = ['light', 'dark', 'high-contrast'];
const STORAGE_KEY = 'textDiffEditor_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.includes(saved as ThemeName)) {
        return saved as ThemeName;
      }
    } catch {
      // Use default
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    const timer = setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 300);
    return () => clearTimeout(timer);
  }, [theme]);

  const setTheme = useCallback((t: ThemeName) => {
    if (!THEMES.includes(t)) return;
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const idx = THEMES.indexOf(current);
      const next = THEMES[(idx + 1) % THEMES.length];
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme, availableThemes: THEMES }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
