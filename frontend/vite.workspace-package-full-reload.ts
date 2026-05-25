import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** Vite HMR can serve stale modules from `@fs` aliased workspace packages — full reload on package edits. */
export function workspacePackageFullReload(appRoot: string): Plugin {
  const packageRoots = [
    resolve(appRoot, '../../packages/i18n/src'),
    resolve(appRoot, '../../packages/api-client/src'),
  ];

  return {
    name: 'nene-workspace-package-full-reload',
    handleHotUpdate({ file, server }) {
      const shouldReload = packageRoots.some((root) => {
        if (!file.startsWith(root)) {
          return false;
        }

        if (root.endsWith('/i18n/src')) {
          return file.includes('/locales/') || file.endsWith('/keys.ts') || file.endsWith('/catalog.ts');
        }

        return true;
      });

      if (shouldReload) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}
