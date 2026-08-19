# Elysia Page Chat

A standalone Chrome side panel that asks [Elysia](https://api.stage.ai.informa.com) about the page you have open.

The UI follows ChatGPT’s layout: stacked conversation, pill composer, starter actions, light and dark theme. A local Node proxy holds Elysia credentials so secrets never sit in the extension.

This is an **internal Informa prototype**. It is not an official Informa product and is not affiliated with OpenAI.

## What it does

- Reads title, URL, and readable text from the active tab
- Sends that extract with your question to Elysia’s streaming completion API
- Keeps a chat session per page origin + path
- Offers one-click actions: summarize, key takeaways, action items, explain simply, quotes and stats, risks, outline, translate
- Optionally scopes the next question to selected text

## Load this folder in Chrome

Chrome looks for `manifest.json` in the folder you pick. Load **`extension/`**, not this repository root.

```text
elysia-page-chat/extension
```

1. Copy `.env.example` to `.env` and fill `ELYSIA_CLIENT_ID`, `ELYSIA_CLIENT_SECRET`, and `ELYSIA_APP_ID`.
2. `npm install && npm run dev` — the proxy listens on **http://localhost:8788**.
3. Open `chrome://extensions` → enable Developer mode → **Load unpacked** → select **`extension`**.
4. Open a normal https page. Click the Elysia icon or press **Alt+Shift+E**.

If Chrome says the manifest is missing, you selected the parent folder. Choose `extension`.

## Requirements

- Node.js 20 or later
- Google Chrome 114 or later (side panel API)
- An Elysia app id and Cognito client credentials

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Watch-mode proxy on port 8788 |
| `npm start` | Proxy without file watching |
| `npm test` | Unit tests (Vitest) |
| `npm run icons` | Regenerate `extension/icons/*.png` |

## Project layout

```text
elysia-page-chat/
  extension/          Load this unpacked in Chrome
    manifest.json
    background.js     Tab extract, SSE bridge, context menus
    sidepanel.*       ChatGPT-style chat UI
    options.*         Proxy URL, model, theme
  server/src/         Local Elysia proxy
    index.ts          HTTP + SSE
    page-context.ts   Prompt wrapping and truncation
    elysia/           Auth, completion client, models
  docs/               Architecture, API, security, troubleshooting
```

The extension talks only to the proxy. The proxy calls `POST /v1/ai/chat/stream/completion`.

## Documentation

- [Architecture](docs/architecture.md) — data flow, sessions, truncation
- [Proxy API](docs/proxy-api.md) — endpoints and payloads
- [Chrome extension](docs/extension.md) — permissions, UI, actions
- [Security](docs/security.md) — secrets, CORS, page data, GDPR
- [Troubleshooting](docs/troubleshooting.md) — load errors, proxy down, empty extracts
- [Contributing](CONTRIBUTING.md)

## Security in brief

- Never commit `.env`. Client secrets stay on the proxy.
- Each send includes page text. Do not use this on customer or employee personal data without a lawful basis.
- Chrome internal pages, the Web Store, and `file://` URLs cannot be read.

## License

Internal Informa use only. See [NOTICE](NOTICE).
