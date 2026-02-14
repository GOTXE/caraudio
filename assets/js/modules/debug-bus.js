const DEBUG_ENABLED_KEY = "carplayer.navidrome.debug.enabled";
const DEBUG_BUFFER_KEY = "carplayer.navidrome.debug.buffer";
const DEBUG_BUFFER_MAX = 1200;
const DEBUG_CHANNEL_NAME = "carplayer-debug";

function nowTs() {
  return Date.now();
}

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function scrubString(text) {
  return String(text || "")
    .replace(/([?&])(u|t|s|p)=([^&]*)/gi, "$1$2=<redacted>")
    .replace(/("?(?:pass|password|token|auth|salt|hash)"?\s*:\s*)"[^"]*"/gi, '$1"<redacted>"');
}

function scrubObject(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => scrubObject(item));
  if (typeof value === "string") return scrubString(value);
  if (typeof value !== "object") return value;

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (/^(pass|password|token|auth|salt|hash|t|s|p)$/i.test(key)) {
      out[key] = "<redacted>";
      continue;
    }
    out[key] = scrubObject(val);
  }
  return out;
}

function normalizeEvent(input) {
  const raw = input && typeof input === "object" ? input : {};
  return {
    id: `${nowTs()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: nowTs(),
    kind: String(raw.kind || "app.event"),
    level: String(raw.level || "info"),
    source: String(raw.source || "app"),
    summary: scrubString(raw.summary || ""),
    details: scrubObject(raw.details || {}),
  };
}

function getStoredBuffer() {
  const raw = localStorage.getItem(DEBUG_BUFFER_KEY);
  const parsed = safeJsonParse(raw || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
}

function setStoredBuffer(buffer) {
  localStorage.setItem(DEBUG_BUFFER_KEY, JSON.stringify(buffer));
}

function addToBuffer(event) {
  const buffer = getStoredBuffer();
  buffer.push(event);
  if (buffer.length > DEBUG_BUFFER_MAX) {
    buffer.splice(0, buffer.length - DEBUG_BUFFER_MAX);
  }
  setStoredBuffer(buffer);
}

export function isDebugEnabled() {
  return localStorage.getItem(DEBUG_ENABLED_KEY) === "1";
}

export function setDebugEnabled(enabled) {
  localStorage.setItem(DEBUG_ENABLED_KEY, enabled ? "1" : "0");
}

export function getDebugBuffer() {
  return getStoredBuffer();
}

export function clearDebugBuffer() {
  localStorage.setItem(DEBUG_BUFFER_KEY, "[]");
}

export function createDebugChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(DEBUG_CHANNEL_NAME);
  } catch {
    return null;
  }
}

export function publishDebugEvent(input) {
  if (!isDebugEnabled()) return;
  const event = normalizeEvent(input);
  addToBuffer(event);

  const channel = createDebugChannel();
  if (!channel) return;
  try {
    channel.postMessage(event);
  } catch {
    // ignore
  } finally {
    channel.close();
  }
}
