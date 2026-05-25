import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LocaleProvider,
  LOCALE_STORAGE_KEY,
  applyLocaleFontFamily,
  resolveInitialLocale,
} from '@nene-corpus/i18n';
import { App } from './App';
import { ThemeProvider } from './ThemeProvider';
import { applyAdminTheme, resolveInitialAdminTheme } from './theme';
import './fonts';
import './index.css';

applyLocaleFontFamily(resolveInitialLocale(LOCALE_STORAGE_KEY));
applyAdminTheme(resolveInitialAdminTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </ThemeProvider>
  </StrictMode>,
);
