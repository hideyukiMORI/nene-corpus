import { fetchJson } from './fetch-json';
import type { AppearanceSettingsResponse, UpdateAppearanceSettingsRequest, WidgetHero, WidgetTheme } from './types';

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

function appendHeroPreviewParams(params: URLSearchParams, hero: WidgetHero): void {
  params.set('hero_show_title', hero.show_title ? '1' : '0');
  params.set('hero_show_description', hero.show_description ? '1' : '0');
  params.set('hero_show_cta', hero.show_cta ? '1' : '0');

  if (hero.title) {
    params.set('hero_title', hero.title);
  }

  if (hero.description) {
    params.set('hero_description', hero.description);
  }

  if (hero.cta_label) {
    params.set('hero_cta_label', hero.cta_label);
  }
}

export function buildWidgetPreviewSearchParams(
  theme: WidgetTheme,
  widgetLocale: string | null,
  hero?: WidgetHero | null,
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

  if (hero !== null && hero !== undefined) {
    appendHeroPreviewParams(params, hero);
  }

  return params.toString();
}
