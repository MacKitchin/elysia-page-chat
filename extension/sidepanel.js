import { PAGE_ACTIONS } from "./actions.js";
import { renderMarkdown } from "./markdown.js";

const emptyEl = document.getElementById("empty");
const chipsEl = document.getElementById("chips");
const messagesEl = document.getElementById("messages");
const threadEl = document.getElementById("thread");
const form = document.getElementById("form");
const queryEl = document.getElementById("query");
const sendBtn = document.getElementById("send");
const plusBtn = document.getElementById("plusBtn");
const contextLabel = document.getElementById("contextLabel");
const noticeEl = document.getElementById("notice");
const modelBtn = document.getElementById("modelBtn");
const newChatBtn = document.getElementById("newChat");
const themeBtn = document.getElementById("themeBtn");
const menuBtn = document.getElementById("menuBtn");
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const drawerTitle = document.getElementById("drawerTitle");
const drawerUrl = document.getElementById("drawerUrl");

const CHIP_ICONS = {
  summarize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 6h10M7 12h10M7 18h6"/></svg>`,
  takeaways: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3l2.2 6.6H21l-5.4 4 2.1 6.4L12 16.8 6.3 20l2.1-6.4L3 9.6h6.8L12 3Z"/></svg>`,
  actions: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>`,
  explain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 18v-5M12 7h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/></svg>`,
  quotes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 17h4l2 4H9l-2-4Zm8 0h4l2 4h-4l-2-4ZM6 7h5v7H6V7Zm8 0h5v7h-5V7Z"/></svg>`,
  risks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 4.7 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.7a2 2 0 0 0-3.4 0Z"/></svg>`,
  outline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
  translate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5h7M7 5v1a7 7 0 0 0 7 7M8 12h7m2 7 3-7 3 7M18.2 16h3.6"/></svg>`,
};

let page = null;
let chatSession = null;
let messages = [];
let running = false;
let port = null;
let useSelection = false;
let theme = "system";
let lastUrl = "";

function sendMessage(payload) {
  return chrome.runtime.sendMessage(payload);
}

function applyTheme(next) {
  theme = next || theme;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function setNotice(text, kind) {
  if (!text) {
    noticeEl.classList.add("hidden");
    noticeEl.textContent = "";
    return;
  }
  noticeEl.classList.remove("hidden");
  noticeEl.className = `notice${kind === "error" ? " error" : ""}`;
  noticeEl.textContent = text;
}

function resizeComposer() {
  queryEl.style.height = "auto";
  queryEl.style.height = `${Math.min(queryEl.scrollHeight, 140)}px`;
  sendBtn.disabled = running || !queryEl.value.trim();
}

function renderChips() {
  chipsEl.innerHTML = "";
  for (const action of PAGE_ACTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.innerHTML = `${CHIP_ICONS[action.id] || ""}${action.label}`;
    btn.addEventListener("click", () => submitPrompt(action.prompt, action.label));
    chipsEl.append(btn);
  }
}

function renderMessages() {
  const has = messages.length > 0;
  emptyEl.classList.toggle("hidden", has);
  messagesEl.replaceChildren();
  for (const item of messages) {
    const turn = document.createElement("div");
    turn.className = `turn ${item.role}`;
    if (item.role === "user") {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = item.content;
      turn.append(bubble);
    } else {
      const body = document.createElement("div");
      body.className = "assistant-body markdown";
      if (!item.content && running) {
        body.innerHTML = `<div class="dots" aria-label="Thinking"><span></span><span></span><span></span></div>`;
      } else {
        body.innerHTML = renderMarkdown(item.content) + (running && item === messages.at(-1) ? '<span class="caret"></span>' : "");
        const actions = document.createElement("div");
        actions.className = "turn-actions";
        const copy = document.createElement("button");
        copy.className = "icon-btn";
        copy.type = "button";
        copy.title = "Copy";
        copy.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>`;
        copy.addEventListener("click", () => navigator.clipboard.writeText(item.content || ""));
        actions.append(copy);
        turn.append(body, actions);
      }
      if (!turn.contains(body)) turn.append(body);
    }
    messagesEl.append(turn);
  }
  threadEl.scrollTop = threadEl.scrollHeight;
}

async function persist() {
  if (chatSession) {
    await sendMessage({ type: "SAVE_TRANSCRIPT", chatSession, messages });
  }
}

async function loadPage() {
  const res = await sendMessage({ type: "GET_PAGE" });
  page = res?.page || null;
  const pending = await sendMessage({ type: "CONSUME_PENDING" });
  const url = page?.url || "";
  if (url !== lastUrl) {
    useSelection = Boolean(pending?.preferSelection && page?.selection);
    lastUrl = url;
  } else if (pending?.preferSelection && page?.selection) {
    useSelection = true;
  }
  plusBtn.classList.toggle("active", useSelection);
  plusBtn.setAttribute("aria-pressed", String(useSelection));

  const host = (() => {
    try {
      return page?.url ? new URL(page.url).hostname : "";
    } catch {
      return "";
    }
  })();
  const chars = (useSelection ? page?.selection : page?.text || "").length;
  contextLabel.innerHTML = page?.url
    ? `<b>${host || "this page"}</b> · ${chars.toLocaleString()} chars${useSelection ? " selected" : ""}`
    : "Open a web page to chat about it";
  drawerTitle.textContent = page?.title || "Untitled";
  drawerUrl.textContent = page?.url || "";

  if (res?.error) setNotice(res.error, "error");
  else if (page && !page.text && !page.selection) {
    setNotice("No readable text on this page.");
  } else {
    setNotice("");
  }

  if (page?.url) {
    const session = await sendMessage({ type: "GET_SESSION", url: page.url });
    chatSession = session?.chatSession || null;
    const transcript = await sendMessage({ type: "GET_TRANSCRIPT", chatSession });
    messages = transcript?.messages || [];
    renderMessages();
  }

  if (pending?.pendingAction === "summarize") {
    const action = PAGE_ACTIONS.find((item) => item.id === "summarize");
    if (action) submitPrompt(action.prompt, action.label);
  }
}

async function loadStatus() {
  try {
    const settings = await sendMessage({ type: "GET_SETTINGS" });
    applyTheme(settings.theme || "system");
    const status = await sendMessage({ type: "GET_STATUS" });
    if (status?.error) throw new Error(status.error);
    document.getElementById("modelLabel").textContent = status.model?.label || "Elysia";
  } catch (err) {
    setNotice(
      `${err instanceof Error ? err.message : String(err)} From the elysia-page-chat folder, run npm run dev and leave that terminal open.`,
      "error",
    );
  }
}

function startStream(query) {
  if (port) {
    port.postMessage({ type: "abort" });
    port.disconnect();
  }
  port = chrome.runtime.connect({ name: "chat" });
  running = true;
  sendBtn.disabled = true;

  port.onMessage.addListener((msg) => {
    if (msg.type === "error") {
      setNotice(msg.message, "error");
      finishStream();
      return;
    }
    if (msg.type === "closed") {
      finishStream();
      persist();
      return;
    }
    if (msg.type !== "event") return;
    const { event, data } = msg;
    if (event === "meta" && data?.chatSession) chatSession = data.chatSession;
    if (event === "stage" && data?.detail) setNotice(data.detail);
    if (event === "error") setNotice(data?.message || "Stream error", "error");
    if (event === "token" && data?.content) {
      const last = messages[messages.length - 1];
      if (!last || last.role !== "assistant") {
        messages.push({ role: "assistant", content: data.content });
      } else {
        last.content += data.content;
      }
      renderMessages();
    }
  });
  port.onDisconnect.addListener(() => finishStream());
  port.postMessage({
    type: "send",
    query,
    chatSession,
    pageContext: page,
    useSelection,
  });
}

function finishStream() {
  running = false;
  sendBtn.disabled = !queryEl.value.trim();
  renderMessages();
}

function submitPrompt(prompt, display) {
  const text = (prompt || "").trim();
  if (!text || running) return;
  if (!page?.url) {
    setNotice("Open a normal web page first.");
    return;
  }
  messages.push({ role: "user", content: display || text });
  messages.push({ role: "assistant", content: "" });
  renderMessages();
  persist();
  startStream(text);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = queryEl.value.trim();
  if (!text) return;
  queryEl.value = "";
  resizeComposer();
  submitPrompt(text, text);
});

queryEl.addEventListener("input", resizeComposer);
queryEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

plusBtn.addEventListener("click", () => {
  if (!page?.selection) {
    setNotice("Select text on the page first, then click + to use only that selection.");
    return;
  }
  useSelection = !useSelection;
  plusBtn.classList.toggle("active", useSelection);
  plusBtn.setAttribute("aria-pressed", String(useSelection));
  const host = (() => {
    try {
      return page?.url ? new URL(page.url).hostname : "";
    } catch {
      return "";
    }
  })();
  const chars = (useSelection ? page.selection : page.text || "").length;
  contextLabel.innerHTML = `<b>${host || "this page"}</b> · ${chars.toLocaleString()} chars${useSelection ? " selected" : ""}`;
});

async function resetChat() {
  if (!page?.url) return;
  const session = await sendMessage({ type: "NEW_SESSION", url: page.url });
  chatSession = session?.chatSession || null;
  messages = [];
  renderMessages();
}

newChatBtn.addEventListener("click", resetChat);
document.getElementById("drawerNew").addEventListener("click", () => {
  resetChat();
  closeDrawer();
});

function openDrawer() {
  drawer.classList.remove("hidden");
  backdrop.classList.remove("hidden");
}
function closeDrawer() {
  drawer.classList.add("hidden");
  backdrop.classList.add("hidden");
}
menuBtn.addEventListener("click", openDrawer);
backdrop.addEventListener("click", closeDrawer);

async function cycleTheme() {
  const order = ["system", "light", "dark"];
  const next = order[(order.indexOf(theme) + 1) % order.length];
  applyTheme(next);
  await sendMessage({ type: "SAVE_SETTINGS", settings: { theme: next } });
}
themeBtn.addEventListener("click", cycleTheme);
document.getElementById("drawerTheme").addEventListener("click", cycleTheme);
document.getElementById("drawerSettings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
modelBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "TAB_CHANGED" && !running) loadPage();
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (theme === "system") applyTheme("system");
});

renderChips();
resizeComposer();
loadPage();
loadStatus();
