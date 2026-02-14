import {
  clearDebugBuffer,
  createDebugChannel,
  getDebugBuffer,
  isDebugEnabled,
  setDebugEnabled,
} from "./modules/debug-bus.js";

const debugState = document.getElementById("debugState");
const countLabel = document.getElementById("countLabel");
const btnToggleDebug = document.getElementById("btnToggleDebug");
const btnClear = document.getElementById("btnClear");
const btnExport = document.getElementById("btnExport");
const kindFilter = document.getElementById("kindFilter");
const levelFilter = document.getElementById("levelFilter");
const textFilter = document.getElementById("textFilter");
const eventsList = document.getElementById("eventsList");

let events = getDebugBuffer();

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts || "");
  }
}

function escapeHtml(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function syncState() {
  const enabled = isDebugEnabled();
  debugState.textContent = `Debug: ${enabled ? "ON" : "OFF"}`;
  debugState.className = `pill ${enabled ? "ok" : ""}`.trim();
}

function getFilteredEvents() {
  const kind = kindFilter.value;
  const level = levelFilter.value;
  const text = (textFilter.value || "").trim().toLowerCase();

  return events.filter((evt) => {
    if (kind !== "all" && !String(evt.kind || "").startsWith(kind)) return false;
    if (level !== "all" && String(evt.level || "info") !== level) return false;
    if (!text) return true;
    const blob = `${evt.kind || ""} ${evt.source || ""} ${evt.summary || ""} ${JSON.stringify(evt.details || {})}`.toLowerCase();
    return blob.includes(text);
  });
}

function render() {
  const rows = getFilteredEvents().slice().reverse();
  countLabel.textContent = `${rows.length} eventos`;
  eventsList.innerHTML = "";
  if (!rows.length) {
    eventsList.innerHTML = `<div class="row"><div class="summary">Sin eventos.</div></div>`;
    return;
  }
  for (const evt of rows) {
    const row = document.createElement("div");
    row.className = "row";
    const levelClass = evt.level === "error" ? "error" : evt.level === "warn" ? "warn" : "";
    row.innerHTML = `
      <div class="meta">
        <span class="pill ${levelClass}">${escapeHtml(evt.level || "info")}</span>
        <span class="pill">${escapeHtml(evt.kind || "")}</span>
        <span class="pill">${escapeHtml(evt.source || "")}</span>
        <span>${escapeHtml(fmtDate(evt.ts))}</span>
      </div>
      <div class="summary">${escapeHtml(evt.summary || "")}</div>
      <details>
        <summary>Detalles</summary>
        <pre>${escapeHtml(JSON.stringify(evt.details || {}, null, 2))}</pre>
      </details>
    `;
    eventsList.appendChild(row);
  }
}

function bindEvents() {
  btnToggleDebug.addEventListener("click", () => {
    setDebugEnabled(!isDebugEnabled());
    syncState();
  });
  btnClear.addEventListener("click", () => {
    clearDebugBuffer();
    events = [];
    render();
  });
  btnExport.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `music-skin-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  [kindFilter, levelFilter].forEach((el) => el.addEventListener("change", render));
  textFilter.addEventListener("input", render);

  const channel = createDebugChannel();
  if (!channel) return;
  channel.onmessage = (event) => {
    if (!event || !event.data || typeof event.data !== "object") return;
    events.push(event.data);
    if (events.length > 1200) events = events.slice(events.length - 1200);
    render();
  };
}

syncState();
render();
bindEvents();
