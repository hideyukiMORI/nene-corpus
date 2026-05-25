import { useCallback, useEffect, useState } from 'react';
import { getAdminMe, loginAdmin, type AdminMeResponse } from '@nene-corpus/api-client';
import { Msg, useMsg } from '@nene-corpus/i18n';
import { clearAdminToken, loadStoredAdminToken, storeAdminToken } from './authStorage';

interface UseAdminAuthResult {
  token: string | null;
  profile: AdminMeResponse | null;
  isReady: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export function useAdminAuth(): UseAdminAuthResult {
  const t = useMsg();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminMeResponse | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stored = loadStoredAdminToken();

    if (stored === null) {
      setIsReady(true);
      return;
    }

    async function restoreSession(): Promise<void> {
      try {
        const me = await getAdminMe(stored!);

        if (cancelled) {
          return;
        }

        setToken(stored);
        setProfile(me);
      } catch {
        if (!cancelled) {
          clearAdminToken();
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);

      try {
        const response = await loginAdmin(email, password);
        storeAdminToken(response.access_token);
        const me = await getAdminMe(response.access_token);
        setToken(response.access_token);
        setProfile(me);
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : t(Msg.admin.auth.loginFailed));
        throw cause;
      }
    },
    [t],
  );

  const logout = useCallback(() => {
    clearAdminToken();
    setToken(null);
    setProfile(null);
    setError(null);
  }, []);

  return { token, profile, isReady, error, login, logout };
}
