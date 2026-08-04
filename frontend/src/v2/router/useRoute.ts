/**
 * useRoute — returns the current internal route (org-slug stripped).
 *
 * Examples:
 *   single mode, URL /admin/dashboard       → '/dashboard'
 *   path   mode, URL /admin/acme/dashboard  → '/dashboard'
 */
import { useRouter } from './Router';

export function useRoute(): string {
  return useRouter().currentRoute;
}
