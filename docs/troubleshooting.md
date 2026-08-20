# Troubleshooting

Install and daily use: [README](../README.md).

## Manifest file is missing or unreadable

You loaded the wrong folder. Chrome needs the directory that contains `manifest.json`:

```text
elysia-page-chat/extension
```

Remove the failed entry on `chrome://extensions`, then **Load unpacked** on `extension`. Do not load the repository root (`elysia-page-chat`).

## Side panel cannot reach the API

1. Confirm the proxy: open http://localhost:8788 — you should see a one-line status.
2. `npm run dev` from the repository root, not from `extension/`. Leave that terminal open.
3. In the panel menu → **Proxy & model…**, set Proxy URL to `http://localhost:8788`.
4. If port 8788 is taken, set `PORT` in `.env`, restart `npm run dev`, and match that origin in the options page.

The proxy runs only on your computer. Another colleague’s machine cannot serve it to you.

## Demo answers / “I don’t have a live Elysia connection”

`.env` is missing credentials, `ELYSIA_MOCK=true`, or the live call failed. Check:

- `ELYSIA_CLIENT_ID`, `ELYSIA_CLIENT_SECRET`, `ELYSIA_APP_ID` in **your** `.env`
- `ELYSIA_BASE_URL` is `https://api.stage.ai.informa.com` for Community app ids
- The terminal running `npm run dev` for `Elysia 4xx/5xx`

Restart `npm run dev` after editing `.env`. Ask whoever invited you if you were never given credentials.

## Empty extract

PDFs in Chrome’s viewer, canvas apps, and some Google Docs surfaces have no `innerText`. The panel will say so. Copy the text, or select a range and use **+**.

`chrome://`, the Web Store, and `file://` cannot be read.

## After `git pull` nothing changed in Chrome

Go to `chrome://extensions` and click **Reload** on the Elysia card. Restart `npm run dev` if `package.json` or `server/` changed.

## Tests (for people changing the code)

```bash
npm test
```

Failures in `page-context`, `cors`, or `actions` mean the proxy’s prompt or origin rules changed. See [CONTRIBUTING.md](../CONTRIBUTING.md).
