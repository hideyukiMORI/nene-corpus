const TOKEN_STORAGE_KEY = 'nene-corpus.admin_token';

export function loadStoredAdminToken(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeAdminToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}
