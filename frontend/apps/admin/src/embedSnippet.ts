/** HTML snippet operators paste into their homepage (WordPress custom HTML, etc.). */
export function buildEmbedSnippet(apiBase: string): string {
  const base = apiBase.replace(/\/+$/, '');
  const pathPrefix = base === '' ? '' : base;

  return `<script src="${pathPrefix}/widget.js" data-endpoint="${base}" defer></script>`;
}
