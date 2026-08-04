import { createAdminTransport } from './transport';

export async function changeAdminPassword(
  token: string,
  body: { current_password: string; new_password: string },
  base = '',
): Promise<void> {
  await createAdminTransport(token, base).put<void>('/admin/auth/password', body);
}

export async function changeAdminEmail(
  token: string,
  body: { current_password: string; new_email: string },
  base = '',
): Promise<void> {
  await createAdminTransport(token, base).put<void>('/admin/auth/email', body);
}
