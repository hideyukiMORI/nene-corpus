/**
 * Router — mode-aware path router for Admin SPA (#289)
 *
 * Fetches GET /admin/bootstrap on startup to determine:
 *   - tenant_resolution_mode: 'single' | 'subdomain' | 'path'
 *   - tenant_org_slug: e.g. 'default' | 'acme'
 *
 * URL structure:
 *   single/subdomain : {installBase}/{route}           e.g. /admin/dashboard
 *   path             : {installBase}/{orgSlug}/{route}  e.g. /admin/acme/dashboard
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveAdminApiBase } from '../../config';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TenantResolutionMode = 'single' | 'subdomain' | 'path';

export interface RouterState {
  /** 'single' | 'subdomain' | 'path' */
  mode: TenantResolutionMode;
  /** org slug from bootstrap (used only when mode === 'path') */
  orgSlug: string;
  /** install-base prefix, e.g. '' or '/nene-corpus' */
  installBase: string;
  /** current internal route, always starts with '/', e.g. '/dashboard' */
  currentRoute: string;
}

export interface RouterContextValue extends RouterState {
  navigate: (to: string) => void;
  /** true while the initial bootstrap fetch is in-flight */
  isReady: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const RouterContext = createContext<RouterContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute install-base from current pathname.
 * Mirrors resolveAdminApiBase() in config.ts but also handles paths like
 * /admin/acme/dashboard where /admin is the base.
 */
function resolveInstallBase(): string {
  if (typeof window === 'undefined') return '';
  const path = window.location.pathname.replace(/\/+$/, '') || '';
  // Find the /admin segment
  const adminIdx = path.indexOf('/admin');
  if (adminIdx === -1) return '';
  const before = path.slice(0, adminIdx);
  return before === '' ? '' : before;
}

/**
 * Given the current pathname, mode, orgSlug and installBase, return the
 * internal route (the part after installBase[/orgSlug]).
 */
function resolveCurrentRoute(
  pathname: string,
  mode: TenantResolutionMode,
  orgSlug: string,
  installBase: string,
): string {
  // Strip install base
  let path = pathname;
  const adminPrefix = installBase + '/admin';
  if (path.startsWith(adminPrefix)) {
    path = path.slice(adminPrefix.length) || '/';
  }

  // Strip org slug if mode === 'path'
  if (mode === 'path' && orgSlug !== '' && path.startsWith('/' + orgSlug)) {
    path = path.slice(orgSlug.length + 1) || '/';
  }

  // Ensure leading slash
  if (!path.startsWith('/')) path = '/' + path;
  // Normalise trailing slash (keep '/' as-is, strip from others)
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path || '/';
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface RouterProviderProps {
  children: ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  const installBase = useMemo(() => resolveInstallBase(), []);

  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<TenantResolutionMode>('single');
  const [orgSlug, setOrgSlug] = useState('default');
  const [currentRoute, setCurrentRoute] = useState('/dashboard');

  // ── Fetch bootstrap ────────────────────────────────────────────────────────
  useEffect(() => {
    const apiBase = resolveAdminApiBase();
    const url = `${apiBase}/admin/bootstrap`;

    fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as {
          tenant_resolution_mode?: string;
          tenant_org_slug?: string;
        };
        const resolvedMode = (data.tenant_resolution_mode ?? 'single') as TenantResolutionMode;
        const resolvedSlug = data.tenant_org_slug ?? 'default';
        setMode(resolvedMode);
        setOrgSlug(resolvedSlug);
        // Resolve initial route based on fetched mode/slug
        setCurrentRoute(
          resolveCurrentRoute(window.location.pathname, resolvedMode, resolvedSlug, installBase),
        );
      })
      .catch(() => {
        // Bootstrap unavailable — fall back to 'single' mode and resolve route
        setCurrentRoute(
          resolveCurrentRoute(window.location.pathname, 'single', 'default', installBase),
        );
      })
      .finally(() => {
        setIsReady(true);
      });
  }, [installBase]);

  // ── popstate listener ──────────────────────────────────────────────────────
  useEffect(() => {
    function handlePopState() {
      setCurrentRoute(
        resolveCurrentRoute(window.location.pathname, mode, orgSlug, installBase),
      );
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mode, orgSlug, installBase]);

  // ── navigate ───────────────────────────────────────────────────────────────
  const navigate = useCallback(
    (to: string) => {
      const normalized = to.startsWith('/') ? to : '/' + to;
      let href: string;
      if (mode === 'path') {
        href = installBase + '/admin/' + orgSlug + normalized;
      } else {
        href = installBase + '/admin' + normalized;
      }
      window.history.pushState(null, '', href);
      setCurrentRoute(normalized);
    },
    [mode, orgSlug, installBase],
  );

  const value = useMemo<RouterContextValue>(
    () => ({ mode, orgSlug, installBase, currentRoute, navigate, isReady }),
    [mode, orgSlug, installBase, currentRoute, navigate, isReady],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

// ── useRouter ─────────────────────────────────────────────────────────────────

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (ctx === null) {
    throw new Error('useRouter must be used inside <RouterProvider>');
  }
  return ctx;
}
