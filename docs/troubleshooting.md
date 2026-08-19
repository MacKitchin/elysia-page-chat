# Troubleshooting

## Manifest file is missing or unreadable

You loaded the wrong folder. Chrome needs the directory that contains `manifest.json`:

```text
elysia-page-chat/extension
```

Remove the failed entry on `chrome://extensions`, then **Load unpacked** on `extension`.

Do not load:

- `elysia-page-chat` (repository root)
- `informa-intelligence-os`

## Side panel cannot reach the API

1. Confirm the proxy: open http://localhost:8788 — you should see a one-line status.
2. `npm run dev` from the repository root, not from `extension/`.
3. In the panel menu → **Proxy & model…**, set Proxy URL to `http://localhost:8788`.
4. If port 8788 is taken, set `PORT` in `.env` and match it in the options page.

## Demo answers / “I don’t have a live Elysia connection”

`.env` is missing credentials, `ELYSIA_MOCK=true`, or the live call failed. Check:

- `ELYSIA_CLIENT_ID`, `ELYSIA_CLIENT_SECRET`, `ELYSIA_APP_ID`
- `ELYSIA_BASE_URL` is `https://api.stage.ai.informa.com` for Community app ids
- Proxy logs for `Elysia 4xx/5xx`

Restart `npm run dev` after editing `.env`.

## Empty extract

PDFs in Chrome’s viewer, canvas apps, and some Google Docs surfaces have no `innerText`. The panel will say so. Copy the text, or select a range and use **+**.

`chrome://`, the Web Store, and `file://` cannot be read.

## Old Intelligence OS extension still listed

This project replaced that prototype. Remove any extension whose path is `informa-intelligence-os` or `informa-intelligence-os/chrome-extension`.

## Tests

```bash
npm test
```

Failures in `page-context`, `cors`, or `actions` mean the proxy’s prompt or origin rules changed. Fix those before reloading the extension.
