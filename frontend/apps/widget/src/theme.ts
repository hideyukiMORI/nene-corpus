import { cssVars } from '@nene-corpus/tokens';
import type { WidgetTheme } from '@nene-corpus/api-client';

export const DEFAULT_WIDGET_THEME: WidgetTheme = {
  color_primary: '#2563eb',
  color_surface: '#ffffff',
  color_text: '#1f2937',
  radius_md: '0.5rem',
  max_width: '100%',
};

export function applyWidgetTheme(root: HTMLElement, theme: WidgetTheme): void {
  root.style.setProperty(cssVars.colorPrimary, theme.color_primary);
  root.style.setProperty(cssVars.colorSurface, theme.color_surface);
  root.style.setProperty(cssVars.colorText, theme.color_text);
  root.style.setProperty(cssVars.radiusMd, theme.radius_md);
  root.style.setProperty(cssVars.maxWidth, theme.max_width);
}

export function readPreviewThemeFromSearchParams(): WidgetTheme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const keys = ['color_primary', 'color_surface', 'color_text', 'radius_md', 'max_width'] as const;
  const hasOverride = keys.some((key) => params.get(key) !== null);

  if (!hasOverride) {
    return null;
  }

  return {
    color_primary: params.get('color_primary') ?? DEFAULT_WIDGET_THEME.color_primary,
    color_surface: params.get('color_surface') ?? DEFAULT_WIDGET_THEME.color_surface,
    color_text: params.get('color_text') ?? DEFAULT_WIDGET_THEME.color_text,
    radius_md: params.get('radius_md') ?? DEFAULT_WIDGET_THEME.radius_md,
    max_width: params.get('max_width') ?? DEFAULT_WIDGET_THEME.max_width,
  };
}
