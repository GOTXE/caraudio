import { DEFAULTS, STORAGE_KEYS } from "./constants.js";
const STORAGE_SCHEMA_VERSION = 2;

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

export function getThemeMode() {
  const value = localStorage.getItem(STORAGE_KEYS.themeMode);
  return value === "day" || value === "night" || value === "auto" ? value : DEFAULTS.themeMode;
}

export function setThemeMode(mode) {
  const next = mode === "day" || mode === "night" ? mode : "auto";
  localStorage.setItem(STORAGE_KEYS.themeMode, next);
  return next;
}

function normalizeAutoThemeSettings(input, hasStoredValue = false) {
  const source = input && typeof input === "object" ? input : {};
  const timeZone = typeof source.timeZone === "string" && source.timeZone.trim() ? source.timeZone.trim() : DEFAULTS.autoTheme.timeZone;
  const dayStart = typeof source.dayStart === "string" && source.dayStart.trim() ? source.dayStart.trim() : DEFAULTS.autoTheme.dayStart;
  const nightStart = typeof source.nightStart === "string" && source.nightStart.trim() ? source.nightStart.trim() : DEFAULTS.autoTheme.nightStart;

  let configured = false;
  if (typeof source.configured === "boolean") {
    configured = source.configured;
  } else if (hasStoredValue) {
    // Compatibilidad: cualquier configuración previa se considera "configurada".
    configured = true;
  }

  return {
    timeZone,
    dayStart,
    nightStart,
    configured,
  };
}

export function getAutoThemeSettings() {
  const raw = localStorage.getItem(STORAGE_KEYS.autoTheme);
  if (!raw) return { ...DEFAULTS.autoTheme };
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeAutoThemeSettings(parsed, true);
    // Migra en caliente configuraciones heredadas (cityKey/lat/lon u otras claves antiguas).
    localStorage.setItem(STORAGE_KEYS.autoTheme, JSON.stringify(normalized));
    return normalized;
  } catch {
    return { ...DEFAULTS.autoTheme };
  }
}

export function setAutoThemeSettings(input) {
  const current = getAutoThemeSettings();
  const next = normalizeAutoThemeSettings({ ...current, ...(input || {}) }, true);
  localStorage.setItem(STORAGE_KEYS.autoTheme, JSON.stringify(next));
  return next;
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

export function getDeviceMode() {
  const value = localStorage.getItem(STORAGE_KEYS.deviceMode);
  return value === "car" || value === "desktop" || value === "auto" ? value : DEFAULTS.deviceMode;
}

export function setDeviceMode(mode) {
  const next = mode === "car" || mode === "desktop" ? mode : "auto";
  localStorage.setItem(STORAGE_KEYS.deviceMode, next);
  return next;
}

export function getDeviceModePromptSeen() {
  return localStorage.getItem(STORAGE_KEYS.deviceModePromptSeen) === "1";
}

export function setDeviceModePromptSeen(seen) {
  localStorage.setItem(STORAGE_KEYS.deviceModePromptSeen, seen ? "1" : "0");
}

export function getLanguage() {
  const value = localStorage.getItem(STORAGE_KEYS.language);
  return value === "es" || value === "en" ? value : "";
}

export function setLanguage(language) {
  const next = language === "en" ? "en" : "es";
  localStorage.setItem(STORAGE_KEYS.language, next);
  return next;
}

export function getBrokerSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.brokerSession);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.serverUrl || !parsed.username || !parsed.authSalt || !parsed.authToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setBrokerSession(session) {
  if (!session || !session.serverUrl || !session.username || !session.authSalt || !session.authToken) {
    localStorage.removeItem(STORAGE_KEYS.brokerSession);
    return null;
  }
  const safe = {
    sessionId: session.sessionId || "",
    serverUrl: normalizeServer(session.serverUrl),
    username: String(session.username || "").trim(),
    authSalt: String(session.authSalt || ""),
    authToken: String(session.authToken || ""),
    accessToken: String(session.accessToken || ""),
    refreshToken: String(session.refreshToken || ""),
    accessExpiresAt: Number(session.accessExpiresAt || 0),
    refreshExpiresAt: Number(session.refreshExpiresAt || 0),
    linkedAt: Number(session.linkedAt || Date.now()),
  };
  localStorage.setItem(STORAGE_KEYS.brokerSession, JSON.stringify(safe));
  return safe;
}

export function clearBrokerSession() {
  localStorage.removeItem(STORAGE_KEYS.brokerSession);
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

export function getDataSaverPreference() {
  const value = localStorage.getItem(STORAGE_KEYS.dataSaver);
  if (value === "1") return true;
  if (value === "0") return false;
  return null;
}

export function setDataSaverPreference(enabled) {
  if (enabled === null || enabled === undefined) {
    localStorage.removeItem(STORAGE_KEYS.dataSaver);
    return null;
  }
  const next = enabled === true;
  localStorage.setItem(STORAGE_KEYS.dataSaver, next ? "1" : "0");
  return next;
}

export function getListPaneSide() {
  const value = localStorage.getItem(STORAGE_KEYS.listPaneSide);
  return value === "left" || value === "right" ? value : DEFAULTS.listPaneSide;
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

export function getProfiles() {
  const raw = localStorage.getItem(STORAGE_KEYS.profiles);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((profile) => profile && profile.id && profile.server && profile.user);
  } catch {
    return [];
  }
}

export function saveProfile(profile) {
  if (!profile || !profile.id) return getProfiles();
  const list = getProfiles();
  const idx = list.findIndex((item) => item.id === profile.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...profile };
  else list.push(profile);
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(list));
  return list;
}

export function removeProfile(profileId) {
  const list = getProfiles().filter((item) => item.id !== profileId);
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(list));
  if (getActiveProfileId() === profileId) {
    localStorage.removeItem(STORAGE_KEYS.activeProfileId);
  }
  return list;
}

export function getActiveProfileId() {
  return localStorage.getItem(STORAGE_KEYS.activeProfileId) || "";
}

export function setActiveProfileId(profileId) {
  if (!profileId) {
    localStorage.removeItem(STORAGE_KEYS.activeProfileId);
    return "";
  }
  localStorage.setItem(STORAGE_KEYS.activeProfileId, String(profileId));
  return String(profileId);
}

function makeProfileId(server, user) {
  return `${normalizeServer(server)}::${String(user || "").trim().toLowerCase()}`;
}

export function migrateLegacyPreferences() {
  const raw = localStorage.getItem(STORAGE_KEYS.storageSchema);
  const currentSchema = Number.parseInt(raw || "0", 10) || 0;
  if (currentSchema >= STORAGE_SCHEMA_VERSION) return;

  // 1) Conserva preferencia de tema antigua (light/dark) en el nuevo modo day/night/auto.
  const themeMode = localStorage.getItem(STORAGE_KEYS.themeMode);
  const legacyTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (!themeMode && (legacyTheme === "light" || legacyTheme === "dark")) {
    localStorage.setItem(STORAGE_KEYS.themeMode, legacyTheme === "dark" ? "night" : "day");
  }

  // 2) Si había credenciales legacy pero no perfiles, crea uno para mantener autologin.
  const profiles = getProfiles();
  if (!profiles.length) {
    const server = getStoredServer();
    const user = localStorage.getItem(STORAGE_KEYS.user) || "";
    const pass = localStorage.getItem(STORAGE_KEYS.pass) || "";
    if (server && user) {
      const profile = {
        id: makeProfileId(server, user),
        server,
        user,
        pass,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify([profile]));
      if (!getActiveProfileId()) {
        localStorage.setItem(STORAGE_KEYS.activeProfileId, profile.id);
      }
    }
  }

  // 3) Normaliza configuración Auto heredada al esquema actual.
  const autoRaw = localStorage.getItem(STORAGE_KEYS.autoTheme);
  if (autoRaw) {
    try {
      const parsed = JSON.parse(autoRaw);
      const normalized = normalizeAutoThemeSettings(parsed, true);
      localStorage.setItem(STORAGE_KEYS.autoTheme, JSON.stringify(normalized));
    } catch {
      // Mantiene el valor por defecto si no se puede migrar.
      localStorage.setItem(STORAGE_KEYS.autoTheme, JSON.stringify({ ...DEFAULTS.autoTheme }));
    }
  }

  localStorage.setItem(STORAGE_KEYS.storageSchema, String(STORAGE_SCHEMA_VERSION));
}
