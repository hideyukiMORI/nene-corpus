# Operator Guide (Post-Install)

Day-2 operations for NeNe Corpus after the web installer completes. For **first-time install** (FTP upload, `/install/`, database setup), see [`../deployment/shared-hosting.md`](../deployment/shared-hosting.md).

**Audience:** operators who manage corpus ingestion, embed widget, and LLM settings from the Admin UI — typically without SSH.

---

## Quick daily workflow

1. Sign in at **`/admin/`** (append your base path if installed in a subdirectory).
2. **Ingestion** — upload CSV/PDF or paste text; confirm **Sources** shows **Ready**.
3. **LLM settings** — verify Anthropic API key and model; use **Test connection** before **Save**.
4. **Appearance** — tune widget colors/HERO; copy the embed snippet.
5. Paste the snippet on a **same-origin** page and test the **embed widget**.
6. Review **Conversation logs** when visitors report issues.

The Admin **Help** panel (header → Help) mirrors much of this guide in your chosen UI language.

---

## Ingestion

| Source type | Admin path | Notes |
| --- | --- | --- |
| **CSV** | Ingestion → File | Preview first, then map title + content columns. Max 5 MB. |
| **PDF** | Ingestion → File | Text PDFs extract per page; scanned PDFs may fail. Max 5 MB. |
| **Text** | Ingestion → Paste text | One paste = one searchable document (FAQ, policy snippet, memo). |

After upload, open **Sources** and wait for status **Ready**. **Failed** usually means column mapping (CSV) or unreadable PDF text — re-upload or fix mapping.

---

## LLM settings (Anthropic)

Open **LLM settings** in Admin:

- The current API key is shown **masked only** — never copy the full secret from the API response.
- Leave the key field **blank** when saving to keep the existing key.
- Use **Test connection** before **Save** after changing key or model.
- Changes write to `.env` on the server (see ADR 0004). Prefer this UI over manual FTP edits when your host allows the web user to update `.env`.

Chat requires a valid `ANTHROPIC_API_KEY` and outbound HTTPS to Anthropic.

---

## Embed widget

NeNe Corpus is **not a WordPress plugin**. Add one script tag on any page on the **same origin**:

```html
<script src="/nene-corpus/widget.js" data-endpoint="/nene-corpus" defer></script>
```

Replace `/nene-corpus` with your install base path. Copy the exact snippet from **Admin → Appearance** after sign-in.

- **sync JSON chat** only — full reply + citations; loading indicator while waiting. No SSE token streaming.
- Test on staging before production. **HTTPS** recommended.

---

## Appearance & widget UX

**Appearance** controls colors, layout, HERO welcome copy, avatars, and default widget language. Use the preview iframe, then **Save settings**.

HERO spacing, bubble layout, and floating launcher are documented in Admin field help tooltips.

---

## Conversation logs

**Conversation logs** lists consumer chat sessions from the embed widget. Select a session to read messages and citations.

Each session stores **client IP**, **User-Agent**, and optional **Referer** at session creation. Treat this as personal data under your privacy policy. IP is taken from `REMOTE_ADDR` — behind a reverse proxy, configure the web server so the logged address reflects the real visitor. See [`../deployment/shared-hosting.md`](../deployment/shared-hosting.md) § Conversation log metadata.

---

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Admin login fails | Credentials; `/health` on your base URL returns JSON. |
| LLM settings **Non-JSON** / HTML error | Rebuild or re-upload admin assets so `admin/.htaccess` routes `settings/*` to PHP; hard-refresh browser. |
| Chat errors | **Test connection** in LLM settings; outbound HTTPS allowed; key not expired. |
| Sources **Failed** | CSV column mapping; PDF text extractable. |
| Widget blank | Browser devtools — `widget.js` and `widget.css` load from same origin. |
| After product update | Run database migrations (hosting panel or SSH per your tier). |

More hosting-specific notes: [`../deployment/shared-hosting.md`](../deployment/shared-hosting.md) § Troubleshooting.

---

## Where to read next

| Document | Purpose |
| --- | --- |
| [`../deployment/shared-hosting.md`](../deployment/shared-hosting.md) | Tier A install, Apache/nginx, release ZIP |
| [`../deployment/README.md`](../deployment/README.md) | Tier A vs Tier B overview |
| [`../development/docker.md`](../development/docker.md) | Docker / VPS development stack |
| Admin **Help** panel | Localized quick start, FAQ, troubleshooting |
