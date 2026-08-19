# Contributing

This is an internal prototype. Keep changes small and documented.

## Setup

```bash
cp .env.example .env
# fill ELYSIA_CLIENT_ID, ELYSIA_CLIENT_SECRET, ELYSIA_APP_ID
npm install
npm test
npm run dev
```

Load `extension/` unpacked in Chrome. After JS/CSS/HTML changes, click **Reload** on `chrome://extensions`.

## Tests

Proxy logic is covered by Vitest:

```bash
npm test
```

Add a failing test before changing `page-context.ts`, `cors.ts`, or `actions.ts`.

The side panel itself is not unit-tested. After UI work, load the unpacked extension, open a public page, and run:

- empty-state action (Summarize this page)
- a free-text follow-up in the same session
- selected-text mode via **+**
- light and dark theme
- a `chrome://` tab (should refuse extract)

## Secrets

Do not commit `.env`, `.env.local`, tokens, or real page extracts that contain personal data. Use synthetic text in tests.

## Scope

The extension must remain a thin UI. Elysia auth and completion stay in `server/`. Do not call `api.stage.ai.informa.com` from the extension.
