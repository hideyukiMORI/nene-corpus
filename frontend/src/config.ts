/**
 * Public API base path when Admin is served from a subdirectory (e.g. /nene-corpus/admin/).
 * Empty string when the app docroot is the API root (Docker, subdomain install).
 */
export function resolveAdminApiBase(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const path = window.location.pathname.replace(/\/+$/, '') || '';

  if (path === '/admin' || path.endsWith('/admin')) {
    const base = path.slice(0, -'/admin'.length);

    return base === '/' ? '' : base;
  }

  return '';
}

export const adminApiBase = resolveAdminApiBase();
