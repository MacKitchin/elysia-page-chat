# Contributing

To **install and use** the extension, follow the [README](README.md). Stop there unless you are changing the code.

This file is for people who want to patch or extend the project. Everyone invited to the repo can open a pull request.

## Before you change anything

Install as in the README so you can run the panel locally. Then:

```bash
npm test
```

## Making a change

1. Create a branch from `main`.
2. Keep the extension a thin UI. Elysia auth and completion stay in `server/`. Do not call the Elysia API from the extension.
3. If you change `page-context.ts`, `cors.ts`, or `actions.ts`, add or update a Vitest test first.
4. After UI work, reload the unpacked extension and check:
   - Summarize this page
   - A follow-up in the same session
   - Selected-text mode via **+**
   - Light and dark theme
   - A `chrome://` tab (extract should be refused)
5. Open a pull request. Do not push secrets, `.env`, or real page extracts.

After JS/CSS/HTML changes, click **Reload** on the Elysia card at `chrome://extensions`.

## Secrets

Do not commit `.env`, `.env.local`, tokens, or page text that contains personal data. Use synthetic text in tests. Do not paste credentials into the PR description.
