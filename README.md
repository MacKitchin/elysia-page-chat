# Elysia Page Chat

Ask Elysia about the web page you have open, from a Chrome side panel.

This is an **internal Informa prototype** for anyone invited to this private repository. Each person installs it on their own computer. It is not an official Informa product and is not affiliated with OpenAI.

You install two things on your machine:

1. A **local proxy** (a small Node server) that holds your Elysia credentials and talks to the Elysia API
2. A **Chrome extension** that reads the current tab and shows a ChatGPT-style chat

The extension never stores the API secret. The proxy must be running whenever you use the panel.

---

## What you need

| Requirement | Notes |
|---|---|
| Access to this GitHub repo | You should already have been invited. If clone fails with 404, ask whoever invited you to add your GitHub account. |
| macOS or Windows | Steps below cover both. |
| Google Chrome 114 or later | Edge may work; these steps are written for Chrome. |
| Node.js 20 or later | Checked in step 2. |
| Elysia credentials | `ELYSIA_CLIENT_ID`, `ELYSIA_CLIENT_SECRET`, and `ELYSIA_APP_ID`. Ask whoever invited you if you do not have them yet. Each person keeps these in a local `.env` file — never commit them. |

This project is standalone. You do not need any other Informa app installed.

---

## Install

Work through these steps in order. Do not load the Chrome extension until the proxy is running.

### 1. Clone the repository

**Option A — Terminal (macOS)**

```bash
cd ~
git clone https://github.com/MacKitchin/elysia-page-chat.git
cd elysia-page-chat
```

**Option B — Windows (PowerShell or Git Bash)**

```powershell
cd ~
git clone https://github.com/MacKitchin/elysia-page-chat.git
cd elysia-page-chat
```

**Option C — GitHub Desktop**

1. Open GitHub Desktop and sign in with the account that was invited.
2. **File → Clone repository…**
3. Choose **elysia-page-chat**.
4. Note the local path (for example `Documents/GitHub/elysia-page-chat`). You will need that folder in step 6.

If Git asks you to authenticate, use the GitHub account that has access to this private repo. A 404 on clone usually means you are signed in as a different account.

### 2. Confirm Node.js

In the project folder:

```bash
node -v
```

You need **v20** or higher (v22 and v24 are fine).

If the command is not found, or the version is 18 or older:

- macOS: [https://nodejs.org](https://nodejs.org) (LTS installer), or `brew install node`
- Windows: [https://nodejs.org](https://nodejs.org) (LTS installer). Tick “Add to PATH”. Open a **new** terminal after installing.

Run `node -v` again in a new terminal before continuing.

### 3. Install project packages

From the **repository root** (`elysia-page-chat`, not `extension/`):

```bash
npm install
```

This only affects this folder. Wait until it finishes without errors.

### 4. Add your Elysia credentials

From the repository root:

macOS / Git Bash:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `.env` in a text editor. Fill these three values. Leave the other lines as they are unless you have been told otherwise.

```bash
ELYSIA_CLIENT_ID=your-client-id
ELYSIA_CLIENT_SECRET=your-client-secret
ELYSIA_APP_ID=your-app-id
```

Do not wrap the values in quotes unless the value itself contains spaces (these should not).

Do **not** commit `.env`. Do **not** paste the secret into Slack, email, or a GitHub issue. Other people with repo access have their own clone and their own `.env`.

If you already have these three values from another Elysia prototype on your machine, you can reuse them.

Community app ids should keep:

```bash
ELYSIA_BASE_URL=https://api.stage.ai.informa.com
ELYSIA_IDP_URL=https://idp.dev.ai.informa.com
```

### 5. Start the local proxy

From the repository root:

```bash
npm run dev
```

Leave this terminal open. You should see:

```text
Elysia Page Chat proxy listening on http://localhost:8788
```

Check it: open [http://localhost:8788](http://localhost:8788) in Chrome. You should get a one-line message that the proxy is running.

If the port is already in use, set `PORT=8789` (or another free port) in `.env`, restart `npm run dev`, and use that origin in step 6’s settings if the panel cannot connect.

**You must start this proxy every time you want to use the extension.** Closing the terminal stops it.

### 6. Load the extension in Chrome

Chrome looks for `manifest.json` in the folder you pick. That file lives in **`extension`**, not in the repo root.

1. In Chrome, go to `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the **`extension`** folder inside the clone, for example:
   - macOS: `…/elysia-page-chat/extension`
   - Windows: `…\elysia-page-chat\extension`
5. Confirm the card named **Elysia** appears with no errors.
6. Click the puzzle-piece icon in Chrome’s toolbar and **pin** Elysia.

Chrome will warn that the extension can read data on all websites. That is how it extracts the current page. Accept only if you are comfortable with that on this machine.

**If you see “Manifest file is missing or unreadable”:** you selected `elysia-page-chat` (the parent). Remove that failed entry, click **Load unpacked** again, and select the inner **`extension`** folder.

### 7. Have a first conversation

1. Keep the `npm run dev` terminal running.
2. Open a normal https page (news article, docs page, public site).
3. Click the Elysia toolbar icon, or press **Alt+Shift+E** (Windows / Chrome OS) or **Option+Shift+E** (macOS).
4. A side panel opens on the right. You should see “What can I help with?” and action chips.
5. Click **Summarize this page**, or type a question and press Enter.

The first live answer can take a few seconds. The model label in the top bar (for example GPT-4o) means the proxy responded.

If the panel says it cannot reach the API, the proxy is not running, or the options page still points at the wrong origin. Open the menu (top left) → **Proxy & model…** and set Proxy URL to `http://localhost:8788`.

---

## Using it day to day

1. Start the proxy: in the project folder, `npm run dev`.
2. Open a page in Chrome and click the Elysia icon.

Useful controls:

| Control | What it does |
|---|---|
| Action chips (empty state) | Summarize, key takeaways, action items, explain simply, quotes and stats, risks, outline, translate |
| Type in the composer | Free-form question about the current page |
| **+** in the composer | Use only the text you selected on the page |
| Pencil (top right) | New chat for this page |
| Moon icon | Cycle system / light / dark theme |
| Right-click the page | Ask about the page, the selection, or summarize |

Follow-ups on the same URL path stay in the same conversation until you start a new chat or quit Chrome.

---

## What it will not read

Chrome blocks extract on `chrome://` pages, the Chrome Web Store, and local `file://` files. Some PDFs and canvas-heavy apps have no readable text; select a range and use **+**, or paste into the composer.

Each send includes the page extract. Do not use it on pages with customer or employee personal data unless you have a lawful basis.

---

## If something goes wrong

| Symptom | Fix |
|---|---|
| Clone 404 | You are not signed into the GitHub account that was invited. |
| `node: command not found` | Install Node 20+ and open a new terminal. |
| Manifest missing | Load `elysia-page-chat/extension`, not the parent folder. |
| Panel cannot connect | Run `npm run dev` from the **repo root**. Open http://localhost:8788 to confirm. |
| Placeholder / demo answers | `.env` is missing the three credentials, or you did not restart the proxy after saving `.env`. |
| `Invalid appId` | Community ids use `ELYSIA_BASE_URL=https://api.stage.ai.informa.com`. |
| Nothing extracted | Try a public article. Avoid `chrome://` and PDF viewer tabs. |

More detail: [docs/troubleshooting.md](docs/troubleshooting.md).

To stop the proxy, focus the terminal and press **Ctrl+C**. To pick up extension file changes after a pull, go to `chrome://extensions` and click **Reload** on the Elysia card.

---

## Updating later

```bash
cd elysia-page-chat
git pull
npm install
npm run dev
```

Then **Reload** the extension on `chrome://extensions`.

---

Install and daily use stop here. The links below are optional.

## Further reading

- [Architecture](docs/architecture.md)
- [Proxy API](docs/proxy-api.md)
- [Chrome extension](docs/extension.md)
- [Security](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Contributing](CONTRIBUTING.md)

Internal Informa use only. See [NOTICE](NOTICE).
