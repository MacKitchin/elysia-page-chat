const STORAGE_KEY = "elysiaPageChat";

const DEFAULTS = {
  apiBaseUrl: "http://localhost:8788",
  collectionName: "content_vectorstore",
  language: "English (US)",
  provider: "",
  nameOfModel: "",
  theme: "system",
};

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "ask-page",
      title: "Ask Elysia about this page",
      contexts: ["page"],
    });
    chrome.contextMenus.create({
      id: "ask-selection",
      title: "Ask Elysia about selection",
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: "summarize",
      title: "Summarize this page with Elysia",
      contexts: ["page"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (tab?.id == null) return;
  await chrome.sidePanel.open({ tabId: tab.id });
  await chrome.storage.session.set({
    preferSelection: info.menuItemId === "ask-selection",
    pendingAction: info.menuItemId === "summarize" ? "summarize" : null,
  });
  chrome.runtime.sendMessage({ type: "TAB_CHANGED" }).catch(() => {});
});

chrome.tabs.onActivated.addListener(() => {
  chrome.runtime.sendMessage({ type: "TAB_CHANGED" }).catch(() => {});
});

chrome.tabs.onUpdated.addListener((_id, info) => {
  if (info.status === "complete" || info.url) {
    chrome.runtime.sendMessage({ type: "TAB_CHANGED" }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err instanceof Error ? err.message : String(err) }));
  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "chat") return;
  let abort = null;
  port.onMessage.addListener((msg) => {
    if (msg?.type === "abort") {
      abort?.abort();
      return;
    }
    if (msg?.type !== "send") return;
    abort?.abort();
    abort = new AbortController();
    streamChat(port, msg, abort.signal).catch((err) => {
      port.postMessage({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    });
  });
  port.onDisconnect.addListener(() => abort?.abort());
});

async function handleMessage(message) {
  switch (message?.type) {
    case "GET_SETTINGS":
      return getSettings();
    case "SAVE_SETTINGS":
      await chrome.storage.sync.set({
        [STORAGE_KEY]: { ...(await getSettings()), ...message.settings },
      });
      return getSettings();
    case "GET_PAGE":
      return extractActivePage();
    case "GET_STATUS":
      return fetchStatus();
    case "NEW_SESSION":
      return newSession(message.url);
    case "GET_SESSION":
      return getOrCreateSession(message.url);
    case "GET_TRANSCRIPT":
      return getTranscript(message.chatSession);
    case "SAVE_TRANSCRIPT":
      await saveTranscript(message.chatSession, message.messages);
      return { ok: true };
    case "CONSUME_PENDING": {
      const stored = await chrome.storage.session.get(["preferSelection", "pendingAction"]);
      await chrome.storage.session.set({ preferSelection: false, pendingAction: null });
      return stored;
    }
    default:
      return { error: "unknown message" };
  }
}

async function getSettings() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  return { ...DEFAULTS, ...(stored[STORAGE_KEY] || {}) };
}

function isRestrictedUrl(url) {
  const value = (url || "").trim().toLowerCase();
  if (!value) return true;
  if (
    value.startsWith("chrome://") ||
    value.startsWith("chrome-extension://") ||
    value.startsWith("edge://") ||
    value.startsWith("about:") ||
    value.startsWith("devtools://") ||
    value.startsWith("view-source:") ||
    value.startsWith("file:") ||
    value.startsWith("moz-extension://")
  ) {
    return true;
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "chrome.google.com" && parsed.pathname.startsWith("/webstore")) return true;
    if (host === "chromewebstore.google.com") return true;
  } catch {
    return false;
  }
  return false;
}

function sessionKeyForUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url || "unknown";
  }
}

async function activeTab() {
  const [tab] = (await chrome.tabs.query({ active: true, lastFocusedWindow: true })) || [];
  return tab;
}

function extractPageInTab() {
  const selection = window.getSelection()?.toString() || "";
  const clone = document.documentElement.cloneNode(true);
  clone
    .querySelectorAll(
      "script, style, noscript, iframe, svg, canvas, input, textarea, select, [hidden]",
    )
    .forEach((el) => el.remove());
  const article = clone.querySelector("article, main, [role='main']");
  const root = article || clone.querySelector("body") || clone;
  const text = (root.innerText || root.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    url: location.href,
    title: document.title || "",
    text,
    selection: selection.trim(),
  };
}

async function extractActivePage() {
  const tab = await activeTab();
  if (!tab?.id) {
    return { error: "No active tab.", restricted: true, page: null };
  }
  if (isRestrictedUrl(tab.url || "")) {
    return {
      error: "This page can’t be read (Chrome internal, Web Store, or local file).",
      restricted: true,
      page: { url: tab.url || "", title: tab.title || "", text: "", selection: "" },
    };
  }
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageInTab,
    });
    const page = result?.result;
    if (!page) {
      return { error: "Could not extract text from this tab.", restricted: false, page: null };
    }
    return { page, restricted: false };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      restricted: false,
      page: { url: tab.url || "", title: tab.title || "", text: "", selection: "" },
    };
  }
}

async function getOrCreateSession(url) {
  const key = sessionKeyForUrl(url);
  const stored = await chrome.storage.session.get("sessions");
  const sessions = stored.sessions || {};
  if (!sessions[key]) {
    sessions[key] = crypto.randomUUID();
    await chrome.storage.session.set({ sessions });
  }
  return { chatSession: sessions[key], key };
}

async function newSession(url) {
  const key = sessionKeyForUrl(url);
  const stored = await chrome.storage.session.get(["sessions", "transcripts"]);
  const sessions = stored.sessions || {};
  const transcripts = stored.transcripts || {};
  const previous = sessions[key];
  if (previous) delete transcripts[previous];
  sessions[key] = crypto.randomUUID();
  await chrome.storage.session.set({ sessions, transcripts });
  return { chatSession: sessions[key], key };
}

async function getTranscript(chatSession) {
  const stored = await chrome.storage.session.get("transcripts");
  return { messages: stored.transcripts?.[chatSession] || [] };
}

async function saveTranscript(chatSession, messages) {
  if (!chatSession) return;
  const stored = await chrome.storage.session.get("transcripts");
  const transcripts = stored.transcripts || {};
  transcripts[chatSession] = messages;
  await chrome.storage.session.set({ transcripts });
}

async function fetchStatus() {
  const settings = await getSettings();
  const base = settings.apiBaseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/api/status`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(
      `Proxy returned ${res.status}. In a terminal, from the elysia-page-chat folder, run npm run dev and leave it open.`,
    );
  }
  return res.json();
}

async function streamChat(port, msg, signal) {
  const settings = await getSettings();
  const base = settings.apiBaseUrl.replace(/\/$/, "");
  const page = msg.pageContext || null;
  if (page && !msg.useSelection) page.selection = "";

  const res = await fetch(`${base}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      query: msg.query,
      chatSession: msg.chatSession,
      collectionName: settings.collectionName,
      language: settings.language,
      provider: settings.provider || undefined,
      nameOfModel: settings.nameOfModel || undefined,
      pageContext: page,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(text || `Chat failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.replace(/\r$/, "");
      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim();
        continue;
      }
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      let data = payload;
      try {
        data = JSON.parse(payload);
      } catch {
        /* raw */
      }
      port.postMessage({ type: "event", event: currentEvent, data });
    }
  }
  port.postMessage({ type: "closed" });
}
