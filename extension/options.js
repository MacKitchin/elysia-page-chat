const apiBaseUrl = document.getElementById("apiBaseUrl");
const collectionName = document.getElementById("collectionName");
const language = document.getElementById("language");
const model = document.getElementById("model");
const theme = document.getElementById("theme");
const statusEl = document.getElementById("status");
const form = document.getElementById("form");

function applyTheme(value) {
  const dark =
    value === "dark" ||
    (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function setStatus(text, kind) {
  statusEl.className = `notice${kind === "error" ? " error" : ""}`;
  statusEl.textContent = text;
}

function fillSelect(select, items, value) {
  select.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item.value;
    opt.textContent = item.label;
    select.append(opt);
  }
  if (value != null) select.value = value;
}

async function refresh(settings) {
  applyTheme(settings.theme || "system");
  try {
    if (settings) await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings });
    const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
    if (status?.error) throw new Error(status.error);
    fillSelect(
      language,
      (status.languages || ["English (US)"]).map((item) => ({ value: item, label: item })),
      settings?.language || language.value,
    );
    fillSelect(
      model,
      [
        { value: "", label: "Server default" },
        ...(status.models || []).map((item) => ({
          value: `${item.provider}::${item.nameOfModel}`,
          label: item.label,
        })),
      ],
      settings?.provider && settings?.nameOfModel
        ? `${settings.provider}::${settings.nameOfModel}`
        : "",
    );
    if (status.collectionName && !collectionName.value) {
      collectionName.value = status.collectionName;
    }
    setStatus(
      status.credentialsPresent && !status.mockForced
        ? "Connected to Elysia."
        : "Connected. Running in demo mode until credentials are set on the proxy.",
    );
    return true;
  } catch (err) {
    fillSelect(language, [{ value: "English (US)", label: "English (US)" }], "English (US)");
    fillSelect(model, [{ value: "", label: "Server default" }], "");
    setStatus(err instanceof Error ? err.message : String(err), "error");
    return false;
  }
}

async function currentSettings() {
  const [provider, nameOfModel] = (model.value || "").split("::");
  return {
    apiBaseUrl: apiBaseUrl.value.trim().replace(/\/$/, ""),
    collectionName: collectionName.value.trim(),
    language: language.value || "English (US)",
    provider: provider || "",
    nameOfModel: nameOfModel || "",
    theme: theme.value,
  };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const settings = await currentSettings();
  const ok = await refresh(settings);
  if (ok) setStatus("Saved.");
});

document.getElementById("test").addEventListener("click", async () => {
  await refresh(await currentSettings());
});

theme.addEventListener("change", () => applyTheme(theme.value));

const settings = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
apiBaseUrl.value = settings.apiBaseUrl || "http://localhost:8788";
collectionName.value = settings.collectionName || "";
theme.value = settings.theme || "system";
applyTheme(theme.value);
await refresh(settings);
