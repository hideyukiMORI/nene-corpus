import { fetchJson } from './fetch-json';

export async function changeAdminPassword(
  token: string,
  body: { current_password: string; new_password: string },
  base = '',
): Promise<void> {
  await fetchJson<unknown>(`${base}/admin/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function changeAdminEmail(
  token: string,
  body: { current_password: string; new_email: string },
  base = '',
): Promise<void> {
  await fetchJson<unknown>(`${base}/admin/auth/email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}
