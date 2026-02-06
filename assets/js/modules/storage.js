import { DEFAULTS, STORAGE_KEYS } from "./constants.js";

export function normalizeServer(input) {
  const raw = String(input || "").trim();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function getStoredServer() {
  const value = localStorage.getItem(STORAGE_KEYS.server);
  return value ? normalizeServer(value) : "";
}

export function setStoredServer(server) {
  const value = normalizeServer(server);
  if (!value) {
    localStorage.removeItem(STORAGE_KEYS.server);
    return "";
  }
  localStorage.setItem(STORAGE_KEYS.server, value);
  return value;
}

export function getTheme() {
  const value = localStorage.getItem(STORAGE_KEYS.theme);
  return value === "dark" || value === "light" ? value : null;
}

export function setTheme(mode) {
  localStorage.setItem(STORAGE_KEYS.theme, mode);
}

export function getRememberCreds() {
  const value = localStorage.getItem(STORAGE_KEYS.rememberCreds);
  if (value === "1") return true;
  if (value === "0") return false;
  const legacyPass = localStorage.getItem(STORAGE_KEYS.pass);
  return !!legacyPass || DEFAULTS.rememberCreds;
}

export function setRememberCreds(enabled) {
  localStorage.setItem(STORAGE_KEYS.rememberCreds, enabled ? "1" : "0");
}

export function getStoredCredentials() {
  return {
    user: localStorage.getItem(STORAGE_KEYS.user) || "",
    pass: localStorage.getItem(STORAGE_KEYS.pass) || "",
  };
}

export function setStoredCredentials({ user, pass }, remember) {
  if (user) localStorage.setItem(STORAGE_KEYS.user, user);
  else localStorage.removeItem(STORAGE_KEYS.user);

  if (remember && pass) localStorage.setItem(STORAGE_KEYS.pass, pass);
  else localStorage.removeItem(STORAGE_KEYS.pass);
}

export function getListPaneSide() {
  const value = localStorage.getItem(STORAGE_KEYS.listPaneSide);
  return value === "right" ? "right" : DEFAULTS.listPaneSide;
}

export function setListPaneSide(side) {
  const next = side === "right" ? "right" : "left";
  localStorage.setItem(STORAGE_KEYS.listPaneSide, next);
  return next;
}

export function getWhatsNewSeenVersion() {
  return localStorage.getItem(STORAGE_KEYS.whatsNewSeen) || "";
}

export function setWhatsNewSeenVersion(version) {
  if (!version) {
    localStorage.removeItem(STORAGE_KEYS.whatsNewSeen);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.whatsNewSeen, version);
}
