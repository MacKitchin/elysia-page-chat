# Proxy API

Install and daily use: [README](../README.md).

This is the local server each person starts with `npm run dev`. It is not a shared Informa host. Base URL on your machine: `http://localhost:8788` (override with `PORT`).

CORS: `chrome-extension://*` and `http://localhost` / `http://127.0.0.1` only.

## `GET /`

Plain-text health hint for a browser tab.

## `GET /api/health`

```json
{ "ok": true }
```

## `GET /api/status`

Used by the side panel and options page.

```json
{
  "mockForced": false,
  "credentialsPresent": true,
  "collectionName": "content_vectorstore",
  "model": { "id": "gpt-4o", "label": "GPT-4o", "provider": "azure", "nameOfModel": "gpt-4o", "region": "Global" },
  "models": [],
  "languages": ["English (US)"],
  "notice": "Internal prototype. …"
}
```

## `GET /api/actions`

Starter-chip definitions (id, label, hint, prompt). The side panel also ships a copy in `extension/actions.js` so the empty state still renders if the proxy is down.

## `POST /api/chat/stream`

SSE completion. Required JSON:

```json
{
  "query": "What is the booth fee?",
  "chatSession": "optional-uuid",
  "collectionName": "content_vectorstore",
  "language": "English (US)",
  "provider": "azure",
  "nameOfModel": "gpt-4o",
  "pageContext": {
    "url": "https://example.com/rfp",
    "title": "RFP",
    "text": "extracted readable text…",
    "selection": ""
  }
}
```

`query` is required. Missing it returns `400` `{ "error": "query is required" }`.

Events:

| Event | Payload |
|---|---|
| `meta` | `{ chatSession, mock, page }` — `page` includes `chars`, `truncated`, `usedSelection` |
| `token` | `{ content }` — append to the assistant message |
| `stage` | `{ id, status, detail }` — live call failed, demo fallback |
| `error` | `{ message }` |
| `done` | `{ chatSession }` |

The proxy builds the Elysia prompt from `query` + `pageContext` and forwards a streaming completion to `/v1/ai/chat/stream/completion`.

## Environment

Copy `.env.example` to `.env` on your machine. Do not commit `.env`.

| Variable | Purpose |
|---|---|
| `PORT` | Proxy port. Default `8788` |
| `ELYSIA_MOCK` | `true` skips live Elysia |
| `ELYSIA_CLIENT_ID` / `ELYSIA_CLIENT_SECRET` | Cognito app client |
| `ELYSIA_APP_ID` | Application id from onboarding |
| `ELYSIA_IDP_URL` | Default `https://idp.dev.ai.informa.com` |
| `ELYSIA_BASE_URL` | Default `https://api.stage.ai.informa.com` |
| `ELYSIA_SCOPE` | Default `iris.apis/ai` |
| `ELYSIA_API_VERSION` | Default `v1` |
| `ELYSIA_COLLECTION_NAME` | RAG collection |
| `ELYSIA_MODEL_PROVIDER` | `azure` or `aws` |
| `ELYSIA_MODEL_NAME` | Catalog model id |

Community app ids are registered on **stage**. Completions with those ids fail on `api.dev` even when health succeeds.
