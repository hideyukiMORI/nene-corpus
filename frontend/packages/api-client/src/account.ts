export async function changeAdminPassword(
  token: string,
  body: { current_password: string; new_password: string },
  base = '',
): Promise<void> {
  const res = await fetch(`${base}/admin/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
}

export async function changeAdminEmail(
  token: string,
  body: { current_password: string; new_email: string },
  base = '',
): Promise<void> {
  const res = await fetch(`${base}/admin/auth/email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
}
