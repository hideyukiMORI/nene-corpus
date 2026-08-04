import { fetchJson } from './fetch-json';
import { createAdminTransport } from './transport';
import type {
  AppearanceSettingsResponse,
  UpdateAppearanceSettingsRequest,
  UploadHeroImageRequest,
  UploadHeroImageResponse,
  UploadAvatarImageRequest,
  UploadAvatarImageResponse,
  WidgetChat,
  WidgetHero,
  WidgetLayout,
  WidgetTheme,
} from './types';

export async function getAppearanceSettings(
  token: string,
  apiBase = '',
): Promise<AppearanceSettingsResponse> {
  return createAdminTransport(token, apiBase).get<AppearanceSettingsResponse>('/admin/appearance');
}

export async function updateAppearanceSettings(
  token: string,
  body: UpdateAppearanceSettingsRequest,
  apiBase = '',
): Promise<AppearanceSettingsResponse> {
  return createAdminTransport(token, apiBase).put<AppearanceSettingsResponse>(
    '/admin/appearance',
    body,
  );
}

// Unauthenticated (widget) — untouched by the transport migration, keeps `fetchJson`.
export async function fetchWidgetAppearance(apiBase = ''): Promise<AppearanceSettingsResponse> {
  return fetchJson<AppearanceSettingsResponse>(`${apiBase}/widget/appearance`);
}

export async function uploadHeroImage(
  token: string,
  body: UploadHeroImageRequest,
  apiBase = '',
): Promise<UploadHeroImageResponse> {
  return createAdminTransport(token, apiBase).post<UploadHeroImageResponse>(
    '/admin/appearance/hero-image',
    body,
  );
}

export async function uploadAvatarImage(
  token: string,
  body: UploadAvatarImageRequest,
  apiBase = '',
): Promise<UploadAvatarImageResponse> {
  return createAdminTransport(token, apiBase).post<UploadAvatarImageResponse>(
    '/admin/appearance/avatar-image',
    body,
  );
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

  params.set('hero_gap_after', hero.gap_after);
  params.set('hero_padding_bottom', hero.padding_bottom);
  params.set('hero_show_divider', hero.show_divider ? '1' : '0');
}

function appendChatPreviewParams(params: URLSearchParams, chat: WidgetChat): void {
  params.set('chat_user_avatar_mode', chat.user_avatar_mode);
  params.set('chat_show_assistant_avatar', chat.show_assistant_avatar ? '1' : '0');

  if (chat.assistant_avatar_url) {
    params.set('chat_assistant_avatar_url', chat.assistant_avatar_url);
  }

  if (chat.assistant_avatar_alt) {
    params.set('chat_assistant_avatar_alt', chat.assistant_avatar_alt);
  }
}

function appendLayoutPreviewParams(params: URLSearchParams, layout: WidgetLayout): void {
  params.set('layout_max_height', layout.max_height);
  params.set('layout_position', layout.position);
  params.set('layout_offset_x', String(layout.offset_x));
  params.set('layout_offset_y', String(layout.offset_y));
  params.set('layout_floating_launcher', layout.floating_launcher ? '1' : '0');
}

export function buildWidgetPreviewSearchParams(
  theme: WidgetTheme,
  widgetLocale: string | null,
  hero?: WidgetHero | null,
  chat?: WidgetChat | null,
  layout?: WidgetLayout | null,
): string {
  const params = new URLSearchParams({
    color_primary: theme.color_primary,
    color_surface: theme.color_surface,
    color_text: theme.color_text,
    radius_panel: theme.radius_panel,
    radius_control: theme.radius_control,
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

  if (layout !== null && layout !== undefined) {
    appendLayoutPreviewParams(params, layout);
  }

  return params.toString();
}
