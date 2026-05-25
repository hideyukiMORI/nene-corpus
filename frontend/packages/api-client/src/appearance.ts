import { fetchJson } from './fetch-json';
import type { AppearanceSettingsResponse, UpdateAppearanceSettingsRequest, WidgetTheme } from './types';

export async function getAppearanceSettings(
  token: string,
  apiBase = '',
): Promise<AppearanceSettingsResponse> {
  return fetchJson<AppearanceSettingsResponse>(`${apiBase}/admin/appearance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateAppearanceSettings(
  token: string,
  body: UpdateAppearanceSettingsRequest,
  apiBase = '',
): Promise<AppearanceSettingsResponse> {
  return fetchJson<AppearanceSettingsResponse>(`${apiBase}/admin/appearance`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function fetchWidgetAppearance(apiBase = ''): Promise<AppearanceSettingsResponse> {
  return fetchJson<AppearanceSettingsResponse>(`${apiBase}/widget/appearance`);
}

export function buildWidgetPreviewSearchParams(
  theme: WidgetTheme,
  widgetLocale: string | null,
): string {
  const params = new URLSearchParams({
    color_primary: theme.color_primary,
    color_surface: theme.color_surface,
    color_text: theme.color_text,
    radius_md: theme.radius_md,
    max_width: theme.max_width,
    preview: '1',
  });

  if (widgetLocale !== null && widgetLocale !== '') {
    params.set('widget_locale', widgetLocale);
  }

  return params.toString();
}
