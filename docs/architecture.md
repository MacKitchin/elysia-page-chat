# Architecture

Install and daily use: [README](../README.md).

Each colleague runs two processes **on their own computer**: a Manifest V3 Chrome extension and a local Node proxy. There is no shared hosted server.

```text
Active tab
  → content extract (executeScript)
  → side panel (query + pageContext)
  → extension service worker (fetch SSE)
  → local proxy  http://localhost:8788
  → Cognito client-credentials token
  → Elysia  POST /v1/ai/chat/stream/completion
```

The extension never holds `ELYSIA_CLIENT_SECRET`. Chrome’s side panel origin is `chrome-extension://<id>`. The proxy allows that origin, plus `localhost`, for CORS.

## Why a proxy

Elysia authenticates with OAuth2 client credentials. That is a confidential client. An unpacked extension is readable on disk, so the secret belongs on a process you control. The proxy in `server/` is that process on your machine. Other people in this repo run their own copy; they do not use yours.

## Page context

On each send the worker injects a function into the active tab. That function:

1. Clones the document
2. Strips `script`, `style`, `iframe`, form controls, and `[hidden]`
3. Prefers `article`, `main`, or `[role=main]` over `body`
4. Returns `{ url, title, text, selection }`

The proxy wraps that extract around the user question (`buildPageContextQuery`). Extracts longer than 12,000 characters are truncated. If the user toggles **+**, only the current selection is sent.

## Sessions

`chat_session` is a UUID stored in `chrome.storage.session`, keyed by `origin + pathname` (query and hash dropped). Follow-ups on the same path reuse the session. **New chat** issues a new UUID and clears the in-memory transcript for that path.

Transcripts live only in session storage. They vanish when the browser session ends.

## Models

The proxy picks a default from `ELYSIA_MODEL_PROVIDER` and `ELYSIA_MODEL_NAME` (GPT-4o / Azure unless you override). The options page can send a specific catalog entry on each completion.

## Demo mode

If `ELYSIA_MOCK=true` or credentials are missing, the proxy streams a placeholder instead of calling Elysia. If a live call fails, it falls back to the same placeholder and includes the error on a `stage` event.
