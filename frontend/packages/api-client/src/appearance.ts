import { fetchJson } from './fetch-json';
import type {
  AppearanceSettingsResponse,
  UpdateAppearanceSettingsRequest,
  UploadHeroImageRequest,
  UploadHeroImageResponse,
  WidgetChat,
  WidgetHero,
  WidgetTheme,
} from './types';

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

export async function uploadHeroImage(
  token: string,
  body: UploadHeroImageRequest,
  apiBase = '',
): Promise<UploadHeroImageResponse> {
  return fetchJson<UploadHeroImageResponse>(`${apiBase}/admin/appearance/hero-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function appendHeroPreviewParams(params: URLSearchParams, hero: WidgetHero): void {
  params.set('hero_show_title', hero.show_title ? '1' : '0');
  params.set('hero_show_description', hero.show_description ? '1' : '0');
  params.set('hero_show_cta', hero.show_cta ? '1' : '0');
  params.set('hero_show_image', hero.show_image ? '1' : '0');

  if (hero.title) {
    params.set('hero_title', hero.title);
  }

  if (hero.description) {
    params.set('hero_description', hero.description);
  }

  if (hero.cta_label) {
    params.set('hero_cta_label', hero.cta_label);
  }

  if (hero.image_url) {
    params.set('hero_image_url', hero.image_url);
  }

  if (hero.image_alt) {
    params.set('hero_image_alt', hero.image_alt);
  }
}

function appendChatPreviewParams(params: URLSearchParams, chat: WidgetChat): void {
  params.set('chat_user_avatar_mode', chat.user_avatar_mode);
  params.set('chat_show_assistant_avatar', chat.show_assistant_avatar ? '1' : '0');
}

export function buildWidgetPreviewSearchParams(
  theme: WidgetTheme,
  widgetLocale: string | null,
  hero?: WidgetHero | null,
  chat?: WidgetChat | null,
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

  if (chat !== null && chat !== undefined) {
    appendChatPreviewParams(params, chat);
  }

  return params.toString();
}
