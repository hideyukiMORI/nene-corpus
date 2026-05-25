import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyAdminTheme,
  resolveInitialAdminTheme,
  toggleAdminTheme,
  writeStoredAdminTheme,
  type AdminTheme,
} from './theme';

interface ThemeContextValue {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(() => resolveInitialAdminTheme());

  const setTheme = useCallback((nextTheme: AdminTheme) => {
    setThemeState(nextTheme);
    applyAdminTheme(nextTheme);
    writeStoredAdminTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme = toggleAdminTheme(current);
      applyAdminTheme(nextTheme);
      writeStoredAdminTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAdminTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useAdminTheme must be used within ThemeProvider.');
  }

  return context;
}
