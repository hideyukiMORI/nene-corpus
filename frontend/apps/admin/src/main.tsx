import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LocaleProvider,
  LOCALE_STORAGE_KEY,
  applyLocaleFontFamily,
  resolveInitialLocale,
} from '@nene-corpus/i18n';
import { App } from './App';
import './fonts';
import './index.css';

applyLocaleFontFamily(resolveInitialLocale(LOCALE_STORAGE_KEY));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
