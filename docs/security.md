# Security

Install and daily use: [README](../README.md).

Treat this as a draft on Informa infrastructure. It is not a customer-facing product. Everyone invited to the repo runs it locally; nothing here is a shared production service.

## Secrets

Elysia uses OAuth2 **client credentials**. Put `ELYSIA_CLIENT_ID` and `ELYSIA_CLIENT_SECRET` in your local `.env` only.

- Do not put secrets in `extension/`
- Do not commit `.env` or `.env.local` (each person has their own)
- Do not paste tokens into issues, pull requests, Slack, or email
- Do not email a populated `.env` to colleagues; send credentials through the channel your team already uses for secrets

The proxy caches the access token in memory until near expiry.

## What leaves the browser

Each send posts page URL, title, and extracted text (or the current selection) to the local proxy, which forwards a wrapped prompt to Elysia (stage API, EU/AWS or Azure depending on model).

That is a processing event. Page text may include unpublished copy, customer data, or personal data.

Do:

- Require an explicit Send or action click (nothing is auto-sent on tab change)
- Show hostname and extract size above the composer
- Skip pages with customer or employee personal data unless you have a lawful basis

Do not:

- Ingest pages into a shared knowledge collection from this tool
- Point Community keys at a public or customer-facing host

Information Security should review any rollout beyond this invited group (for example a company-wide store listing or a hosted proxy).

## CORS

The proxy echoes `Access-Control-Allow-Origin` only for:

- `chrome-extension://<id>`
- `http://localhost` and `http://127.0.0.1`

Other origins get no CORS grant.

## Truncation

Extracts are capped at 12,000 characters on the server. The `meta` event reports `truncated: true` when that happens. Truncation is a size limit, not a privacy control.

## Trademark

The interface imitates ChatGPT’s layout so the product feels familiar. It must not ship as “ChatGPT,” use OpenAI marks, or imply OpenAI built or endorses it.
