import { createAdminTransport } from './transport';

export interface NotificationSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password_set: boolean;
  smtp_encryption: 'tls' | 'ssl' | 'none';
  smtp_from_address: string;
  smtp_from_name: string;
  smtp_configured: boolean;
  notify_email: string;
  rate_limit_notify_enabled: boolean;
  rate_limit_cooldown_minutes: number;
  daily_report_enabled: boolean;
  daily_report_token: string;
}

export interface UpdateNotificationSettingsBody {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password?: string | null;
  smtp_encryption: 'tls' | 'ssl' | 'none';
  smtp_from_address: string;
  smtp_from_name: string;
  notify_email: string;
  rate_limit_notify_enabled: boolean;
  rate_limit_cooldown_minutes: number;
  daily_report_enabled: boolean;
  regenerate_daily_report_token?: boolean;
}

export async function getNotificationSettings(
  token: string,
  base = '',
): Promise<NotificationSettings> {
  return createAdminTransport(token, base).get<NotificationSettings>(
    '/admin/notifications/settings',
  );
}

export async function updateNotificationSettings(
  token: string,
  body: UpdateNotificationSettingsBody,
  base = '',
): Promise<NotificationSettings> {
  return createAdminTransport(token, base).put<NotificationSettings>(
    '/admin/notifications/settings',
    body,
  );
}

export async function sendTestMail(token: string, email: string, base = ''): Promise<void> {
  await createAdminTransport(token, base).post<void>('/admin/notifications/test-mail', { email });
}
