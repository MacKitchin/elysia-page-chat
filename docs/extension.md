# Chrome extension

Install and daily use: [README](../README.md).

Load **`extension/`** unpacked. That directory contains `manifest.json`.

Manifest V3, minimum Chrome 114. The side panel opens on toolbar click and on **Alt+Shift+E** (Windows) or **Option+Shift+E** (macOS).

## Permissions

| Permission | Why |
|---|---|
| `sidePanel` | Persistent chat while the page stays visible |
| `activeTab` + `scripting` | Extract readable text from the tab you invoked |
| `tabs` | Title/URL and tab-change refresh |
| `storage` | Settings (sync) and session transcripts |
| `contextMenus` | Right-click actions |
| `host_permissions` `http(s)://*/*` | Inject extract on ordinary web pages; call the local proxy |

Chrome will warn that the extension can read data on all sites. That is required for “any open page.”

## UI

The side panel copies ChatGPT’s compact chat:

- Top bar: menu, model label, theme, new chat
- Empty state: “What can I help with?” plus action chips
- User turns: right-aligned gray pills
- Assistant turns: full-width markdown, copy on hover
- Composer: rounded field, **+** for selection, circular send
- Footer: “Elysia can make mistakes. Check important info.”

Theme is `system`, `light`, or `dark` (`chrome.storage.sync` key `elysiaPageChat`).

## Actions

Chips send a prepared prompt with the current page attached:

| Chip | Intent |
|---|---|
| Summarize this page | 8–12 bullets, dates and prices called out |
| Key takeaways | Five one-sentence points |
| Extract action items | Checklist with owners/dates only if present |
| Explain simply | Briefing for a colleague who has not read the page |
| Quotes & stats | Named claims; numbers unchanged |
| Risks & caveats | Limitations and easy-to-miss details |
| Outline | Hierarchical structure |
| Translate | English (US), names and figures kept |

Right-click the page for **Ask Elysia about this page**, **Ask Elysia about selection**, or **Summarize this page with Elysia**.

**+** in the composer toggles “selected text only.” Select text on the page first.

## Restricted URLs

Extract is refused for `chrome:`, `chrome-extension:`, `edge:`, `about:`, `devtools:`, `view-source:`, `file:`, and the Chrome Web Store. Those surfaces do not allow content scripts.

## Settings

Open from the menu (**Proxy & model…**) or via the extension’s options page. Set:

- Proxy URL (default `http://localhost:8788`)
- Collection, language, model
- Theme

Settings are stored in Chrome as `elysiaPageChat` on that browser profile only. They do not sync through this GitHub repo.
