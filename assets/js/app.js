import {
  clearBrokerSession,
  getBrokerSession,
  getListPaneSide,
  getLanguage,
  getRememberCreds,
  getDeviceMode,
  getDeviceModePromptSeen,
  getStoredCredentials,
  getStoredServer,
  getTheme,
  setListPaneSide,
  setLanguage,
  setBrokerSession,
  setDeviceMode,
  setDeviceModePromptSeen,
  setRememberCreds,
  setStoredCredentials,
  setStoredServer,
  setTheme,
  getWhatsNewSeenVersion,
  setWhatsNewSeenVersion,
  normalizeServer,
  getThemeMode,
  setThemeMode,
  getAutoThemeSettings,
  setAutoThemeSettings,
  getProfiles,
  saveProfile,
  getActiveProfileId,
  setActiveProfileId,
  migrateLegacyPreferences,
} from "./modules/storage.js";
import { createI18n, detectPreferredLanguage } from "./modules/i18n.js";
import { pollDevice, refreshSession, revokeSession, startDevice } from "./modules/broker-client.js";
import { checkForUpdate, escapeHtml } from "./modules/ui.js";
import { coverUrl, getStarred2, makeAuth, restJson, scrobble, star, streamUrl, unstar } from "./modules/navidrome.js";
import { formatTime, mapSongsToQueue, toTrack } from "./modules/player.js";
import { getWhatsNewForVersion, getWhatsNewSections } from "./modules/whats-new.js";

const DEFAULT_COVER = "./assets/img/music-player.svg";
const COVER_SIZE_LIST = 96;
const COVER_SIZE_NOW = 320;
const MOST_PLAYED_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const COVER_FAIL_RETRY_MS = 30 * 1000;
const COVER_CACHE_MAX_ITEMS = 1200;
const BROKER_REFRESH_LEEWAY_SECONDS = 60;
const BROKER_REFRESH_CHECK_MS = 60 * 1000;

const statusEl = document.getElementById("status");
const btnEditServer = document.getElementById("btnEditServer");
const btnWhatsNew = document.getElementById("btnWhatsNew");
const verCurrent = document.getElementById("verCurrent");
const verLatest = document.getElementById("verLatest");
const loginFooterVer = document.getElementById("loginFooterVer");
const loginFooterUpd = document.getElementById("loginFooterUpd");
const APP_VERSION = document.querySelector('meta[name="app-version"]')?.content || "dev";
const UPDATE_REPO = document.querySelector('meta[name="update-repo"]')?.content || "";

const serverModal = document.getElementById("serverModal");
const serverUrlInput = document.getElementById("serverUrlInput");
const serverCheck = document.getElementById("serverCheck");
const serverCheckText = document.getElementById("serverCheckText");
const btnServerCancel = document.getElementById("btnServerCancel");
const btnServerSave = document.getElementById("btnServerSave");
const userEl = document.getElementById("username");
const passEl = document.getElementById("password");
const rememberCredsEl = document.getElementById("rememberCreds");
const btnConnect = document.getElementById("btnConnect");
const btnLoginProfiles = document.getElementById("btnLoginProfiles");
const btnLinkDevice = document.getElementById("btnLinkDevice");
const btnDeviceModeAuto = document.getElementById("btnDeviceModeAuto");
const btnDeviceModeCar = document.getElementById("btnDeviceModeCar");
const btnDeviceModeDesktop = document.getElementById("btnDeviceModeDesktop");

const deviceModeModal = document.getElementById("deviceModeModal");
const deviceModeModalText = document.getElementById("deviceModeModalText");
const btnDeviceModeModalClose = document.getElementById("btnDeviceModeModalClose");
const btnDeviceModeUseSuggested = document.getElementById("btnDeviceModeUseSuggested");
const btnDeviceModeUseAlternative = document.getElementById("btnDeviceModeUseAlternative");
const btnDeviceModeKeepAuto = document.getElementById("btnDeviceModeKeepAuto");
const linkDeviceModal = document.getElementById("linkDeviceModal");
const linkDeviceText = document.getElementById("linkDeviceText");
const linkDeviceUrl = document.getElementById("linkDeviceUrl");
const linkDeviceCode = document.getElementById("linkDeviceCode");
const linkDeviceTimer = document.getElementById("linkDeviceTimer");
const linkDeviceStatus = document.getElementById("linkDeviceStatus");
const btnLinkClose = document.getElementById("btnLinkClose");
const btnLinkRetry = document.getElementById("btnLinkRetry");

const nowCover = document.getElementById("nowCover");
const nowBg = document.getElementById("nowBg");
const nowTitle = document.getElementById("nowTitle");
const nowSub = document.getElementById("nowSub");
const btnFavoriteSong = document.getElementById("btnFavoriteSong");
const player = document.getElementById("player");
const btnShuffle = document.getElementById("btnShuffle");
const btnPrev = document.getElementById("btnPrev");
const btnPlayPause = document.getElementById("btnPlayPause");
const btnNext = document.getElementById("btnNext");
const btnPlayAll = document.getElementById("btnPlayAll");

const screenLogin = document.getElementById("screenLogin");
const screenPlayer = document.getElementById("screenPlayer");

const btnClearArtists = document.getElementById("btnClearArtists");
const btnViewArtists = document.getElementById("btnViewArtists");
const btnViewGenres = document.getElementById("btnViewGenres");
const btnViewAlbums = document.getElementById("btnViewAlbums");
const btnViewPlaylists = document.getElementById("btnViewPlaylists");
const artistFilter = document.getElementById("artistFilter");
const artistsList = document.getElementById("artistsList");
const btnPlayMostPlayed = document.getElementById("btnPlayMostPlayed");
const btnPlayFavorites = document.getElementById("btnPlayFavorites");
const btnAlbums = document.getElementById("btnAlbums");
const btnSongs = document.getElementById("btnSongs");
const btnPaneSide = document.getElementById("btnPaneSide");
const playerGrid = document.getElementById("playerGrid");
const songMenu = document.getElementById("songMenu");

const bufBar = document.getElementById("bufBar");
const nowBar = document.getElementById("nowBar");
const seekEl = document.getElementById("seek");
const pauseHint = document.getElementById("pauseHint");
const tNow = document.getElementById("tNow");
const tDur = document.getElementById("tDur");

const albumsModal = document.getElementById("albumsModal");
const albumsTitle = document.getElementById("albumsTitle");
const albumsList = document.getElementById("albumsList");
const btnPlayAllAlbums = document.getElementById("btnPlayAllAlbums");
const btnCloseAlbums = document.getElementById("btnCloseAlbums");

const songsModal = document.getElementById("songsModal");
const songsTitle = document.getElementById("songsTitle");
const songsList = document.getElementById("songsList");
const btnCloseSongs = document.getElementById("btnCloseSongs");

const whatsNewModal = document.getElementById("whatsNewModal");
const whatsNewTitle = document.getElementById("whatsNewTitle");
const whatsNewList = document.getElementById("whatsNewList");
const btnCloseWhatsNew = document.getElementById("btnCloseWhatsNew");

const btnOpenMenu = document.getElementById("btnOpenMenu");
const btnHideKeyboard = document.getElementById("btnHideKeyboard");
const btnServerHideKeyboard = document.getElementById("btnServerHideKeyboard");
const headerUser = document.getElementById("headerUser");
const menuModal = document.getElementById("menuModal");
const btnCloseMenu = document.getElementById("btnCloseMenu");
const btnThemeDay = document.getElementById("btnThemeDay");
const btnThemeNight = document.getElementById("btnThemeNight");
const btnThemeAuto = document.getElementById("btnThemeAuto");
const btnThemeAutoConfig = document.getElementById("btnThemeAutoConfig");
const btnLangEs = document.getElementById("btnLangEs");
const btnLangEn = document.getElementById("btnLangEn");
const themeAutoHint = document.getElementById("themeAutoHint");

const profilesModal = document.getElementById("profilesModal");
const btnOpenProfiles = document.getElementById("btnOpenProfiles");
const btnCloseProfiles = document.getElementById("btnCloseProfiles");
const profilesList = document.getElementById("profilesList");
const btnAddProfile = document.getElementById("btnAddProfile");

const autoThemeModal = document.getElementById("autoThemeModal");
const autoThemeTimezone = document.getElementById("autoThemeTimezone");
const autoThemeDayStart = document.getElementById("autoThemeDayStart");
const autoThemeNightStart = document.getElementById("autoThemeNightStart");
const btnAutoThemeCancel = document.getElementById("btnAutoThemeCancel");
const btnAutoThemeSave = document.getElementById("btnAutoThemeSave");

let filterTimer = null;
let autoThemeTimer = null;
let serverProbeTimer = null;
let lastProbe = { url: "", state: "idle", kind: "idle" };
const coverLoadCache = new Map();

let state = {
  server: getStoredServer(),
  auth: null,
  user: "",
  artists: [],
  artistsFiltered: [],
  selectedArtist: null,
  selectedArtistAlbums: [],
  artistAlbumsById: {},
  albumCoverById: {},
  artistSongsById: {},
  selectedGenre: null,
  selectedGenreAlbums: [],
  albums: [],
  albumsFiltered: [],
  playlists: [],
  playlistsFiltered: [],
  genres: [],
  genresFiltered: [],
  favoriteSongs: [],
  favoriteSongsFiltered: [],
  mostPlayedSongs: [],
  mostPlayedSongsFiltered: [],
  viewMode: "artists",
  queue: [],
  queueIndex: -1,
  lastCoverId: null,
  shuffleEnabled: false,
  randomMode: false,
  randomLoading: false,
  randomPrefetchAt: 0,
  starredIds: new Set(),
  profiles: [],
  activeProfileId: getActiveProfileId(),
  deviceMode: getDeviceMode(),
  resolvedDeviceMode: "desktop",
  language: "es",
  i18n: createI18n("es"),
  scrobbleTrackId: "",
  scrobbleNowSent: false,
  scrobbleSubmissionSent: false,
  mostPlayedLoading: false,
  nowCoverRequestId: 0,
  quickActionLoading: "",
  coverRetryTimer: null,
  coverRetryTrackId: "",
  linkFlow: {
    deviceCode: "",
    userCode: "",
    expiresAt: 0,
    pollDelayMs: 2000,
    pollTimer: null,
    countdownTimer: null,
  },
  brokerRefreshTimer: null,
};

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!window.isSecureContext && !/^localhost$|^127\./.test(window.location.hostname)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // ignore service worker registration errors
    });
  });
}

function t(key, params) {
  return state.i18n?.t(key, params) || key;
}

function setLanguageUi(nextLanguage) {
  const normalized = state.i18n.setLanguage(nextLanguage);
  state.language = normalized;
  setLanguage(normalized);
  state.i18n.apply(document);
  syncLanguageButtons();
  syncThemeButtons();
  setShuffleUI();
  syncSongsButton();
  applyListPaneSide(getListPaneSide());
  updateServerButton(getStoredServer());
  if (pauseHint && !pauseHint.hidden) {
    pauseHint.textContent = state.quickActionLoading ? t("player.loading_cover") : t("player.pause");
  }
  if (!state.queue.length || state.queueIndex < 0) {
    nowTitle.textContent = t("player.nothing_playing");
    if (nowSub.textContent === "-") nowSub.textContent = "—";
  }
  renderProfiles();
}

function syncLanguageButtons() {
  btnLangEs?.classList.toggle("active", state.language === "es");
  btnLangEn?.classList.toggle("active", state.language === "en");
}

function setBar(el, ratio) {
  const r = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
  el.style.transform = `scaleX(${r})`;
}

function profileId(server, user) {
  return `${normalizeServer(server)}::${String(user || "").trim().toLowerCase()}`;
}

function getMostPlayedCacheStorageKey() {
  if (!state.server || !state.user) return "";
  const safe = btoa(unescape(encodeURIComponent(`${state.server}|${state.user}`)));
  return `carplayer.navidrome.mostPlayedCache.${safe}`;
}

function applyTheme(mode) {
  const html = document.documentElement;
  html.classList.remove("theme-dark", "theme-light");
  if (mode === "dark") {
    html.classList.add("theme-dark");
  } else {
    html.classList.add("theme-light");
  }
  setTheme(mode);
}

function syncThemeButtons() {
  const mode = getThemeMode();
  btnThemeDay.classList.toggle("active", mode === "day");
  btnThemeNight.classList.toggle("active", mode === "night");
  btnThemeAuto.classList.toggle("active", mode === "auto");
  const autoCfg = getAutoThemeSettings();
  if (mode === "auto") {
    themeAutoHint.hidden = false;
    themeAutoHint.textContent = `${t("menu.theme_auto")}: ${autoCfg.timeZone || "UTC"}`;
  } else {
    themeAutoHint.hidden = true;
    themeAutoHint.textContent = "";
  }
}

function getTimeZonesList() {
  const zones = [
    "UTC",
    "Atlantic/Canary",
    "Europe/Madrid",
    "Europe/London",
    "Europe/Lisbon",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Athens",
    "America/Anchorage",
    "America/Phoenix",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Mexico_City",
    "America/Bogota",
    "America/Lima",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
    "Africa/Casablanca",
    "Asia/Jerusalem",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Perth",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
  try {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (localTz && !zones.includes(localTz)) zones.unshift(localTz);
  } catch {
    // ignore
  }
  return zones;
}

function setHeaderUserLabel(username) {
  if (!headerUser) return;
  const value = String(username || "").trim();
  if (!value) {
    headerUser.hidden = true;
    headerUser.textContent = "—";
    return;
  }
  headerUser.hidden = false;
  headerUser.textContent = value;
}

function detectDeviceModeHeuristic() {
  const width = Math.max(window.innerWidth || 0, window.visualViewport?.width || 0);
  const height = Math.max(window.innerHeight || 0, window.visualViewport?.height || 0);
  const ratio = width && height ? width / height : 0;
  const ua = String(navigator.userAgent || "").toLowerCase();
  const isAutomotiveUa = ua.includes("android automotive") || ua.includes(" aaos") || ua.includes(" carlauncher");
  if (isAutomotiveUa) return "car";
  if (height > 0 && height <= 560 && ratio >= 2) return "car";
  return "desktop";
}

function resolveDeviceMode(mode) {
  return mode === "auto" ? detectDeviceModeHeuristic() : mode;
}

function syncDeviceModeButtons() {
  if (!btnDeviceModeAuto || !btnDeviceModeCar || !btnDeviceModeDesktop) return;
  btnDeviceModeAuto.classList.toggle("active", state.deviceMode === "auto");
  btnDeviceModeCar.classList.toggle("active", state.deviceMode === "car");
  btnDeviceModeDesktop.classList.toggle("active", state.deviceMode === "desktop");
}

function applyDeviceMode(mode = state.deviceMode) {
  state.deviceMode = mode;
  state.resolvedDeviceMode = resolveDeviceMode(mode);
  document.body.classList.toggle("device-mode-car", state.resolvedDeviceMode === "car");
  document.body.classList.toggle("device-mode-desktop", state.resolvedDeviceMode === "desktop");
  syncDeviceModeButtons();
  if (state.resolvedDeviceMode !== "car") {
    if (btnHideKeyboard) btnHideKeyboard.hidden = true;
    if (btnServerHideKeyboard) btnServerHideKeyboard.hidden = true;
  }
}

function setAndApplyDeviceMode(mode) {
  const next = setDeviceMode(mode);
  applyDeviceMode(next);
  setDeviceModePromptSeen(true);
}

function closeDeviceModeModal() {
  if (!deviceModeModal) return;
  deviceModeModal.hidden = true;
}

function openDeviceModeSuggestion() {
  if (!deviceModeModal || !deviceModeModalText || !btnDeviceModeUseSuggested || !btnDeviceModeUseAlternative) return;
  const suggested = detectDeviceModeHeuristic();
  const alternative = suggested === "car" ? "desktop" : "car";
  const suggestedLabel = suggested === "car" ? t("device_mode.car") : t("device_mode.desktop");
  const alternativeLabel = alternative === "car" ? t("device_mode.car") : t("device_mode.desktop");
  deviceModeModalText.textContent = t("device_mode.suggest_text", { suggested: suggestedLabel });
  btnDeviceModeUseSuggested.textContent = t("device_mode.use", { mode: suggestedLabel });
  btnDeviceModeUseSuggested.dataset.mode = suggested;
  btnDeviceModeUseAlternative.textContent = t("device_mode.use", { mode: alternativeLabel });
  btnDeviceModeUseAlternative.dataset.mode = alternative;
  deviceModeModal.hidden = false;
}

function maybeSuggestDeviceMode() {
  if (!screenLogin || screenLogin.hidden) return;
  if (state.deviceMode !== "auto") return;
  if (getDeviceModePromptSeen()) return;
  openDeviceModeSuggestion();
}

function clearLinkFlowTimers() {
  if (state.linkFlow.pollTimer) {
    clearTimeout(state.linkFlow.pollTimer);
    state.linkFlow.pollTimer = null;
  }
  if (state.linkFlow.countdownTimer) {
    clearInterval(state.linkFlow.countdownTimer);
    state.linkFlow.countdownTimer = null;
  }
}

function closeLinkDeviceModal() {
  clearLinkFlowTimers();
  if (linkDeviceModal) linkDeviceModal.hidden = true;
}

function clearBrokerRefreshTimer() {
  if (!state.brokerRefreshTimer) return;
  clearTimeout(state.brokerRefreshTimer);
  state.brokerRefreshTimer = null;
}

async function revokeBrokerSessionSafe() {
  const session = getBrokerSession();
  if (!session?.refreshToken) {
    clearBrokerSession();
    clearBrokerRefreshTimer();
    return;
  }
  try {
    await revokeSession({ refresh_token: session.refreshToken });
  } catch {
    // ignore revoke errors on cleanup
  } finally {
    clearBrokerSession();
    clearBrokerRefreshTimer();
  }
}

async function refreshBrokerSessionIfNeeded(sessionInput, { force = false } = {}) {
  const session = sessionInput || getBrokerSession();
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  const refreshExpiresAt = Number(session.refreshExpiresAt || 0) || 0;
  const accessExpiresAt = Number(session.accessExpiresAt || 0) || 0;

  if (refreshExpiresAt > 0 && refreshExpiresAt <= now) {
    clearBrokerSession();
    clearBrokerRefreshTimer();
    return null;
  }

  const shouldRefresh = force || accessExpiresAt <= 0 || accessExpiresAt <= now + BROKER_REFRESH_LEEWAY_SECONDS;
  if (!shouldRefresh || !session.refreshToken) return session;

  try {
    const refreshed = await refreshSession({ refresh_token: session.refreshToken });
    return setBrokerSession({
      ...session,
      sessionId: refreshed.session_id || session.sessionId,
      accessToken: refreshed.access_token || session.accessToken,
      refreshToken: refreshed.refresh_token || session.refreshToken,
      accessExpiresAt: Number(refreshed.access_expires_at || session.accessExpiresAt || 0),
      refreshExpiresAt: Number(refreshed.refresh_expires_at || session.refreshExpiresAt || 0),
    });
  } catch (e) {
    if (String(e).includes("invalid_session")) {
      clearBrokerSession();
      clearBrokerRefreshTimer();
      return null;
    }
    return session;
  }
}

function scheduleBrokerSessionRefresh() {
  clearBrokerRefreshTimer();
  if (!getBrokerSession()) return;
  state.brokerRefreshTimer = setTimeout(async () => {
    const refreshed = await refreshBrokerSessionIfNeeded(null);
    if (!refreshed) {
      clearBrokerRefreshTimer();
      return;
    }
    scheduleBrokerSessionRefresh();
  }, BROKER_REFRESH_CHECK_MS);
}

function deriveLinkUrl() {
  const rawPath = String(window.location.pathname || "/");
  const basePath = rawPath.endsWith("/") ? rawPath : rawPath.replace(/\/[^/]*$/, "/");
  return new URL("link", `${window.location.origin}${basePath}`).toString();
}

function renderLinkDeviceCountdown() {
  if (!linkDeviceTimer) return;
  const remain = Math.max(0, Math.ceil((state.linkFlow.expiresAt - Date.now()) / 1000));
  linkDeviceTimer.textContent = formatTime(remain);
}

function startLinkDeviceCountdown() {
  renderLinkDeviceCountdown();
  clearLinkFlowTimers();
  state.linkFlow.countdownTimer = setInterval(() => {
    renderLinkDeviceCountdown();
    if (Date.now() >= state.linkFlow.expiresAt) {
      clearLinkFlowTimers();
      if (linkDeviceStatus) linkDeviceStatus.textContent = t("link.expired");
    }
  }, 250);
}

async function connectWithBrokerSession(session, { silent = false } = {}) {
  const refreshed = await refreshBrokerSessionIfNeeded(session);
  const server = normalizeServer(refreshed?.serverUrl || session?.serverUrl || "");
  const username = String(refreshed?.username || session?.username || "").trim();
  const authSalt = String(refreshed?.authSalt || session?.authSalt || "");
  const authToken = String(refreshed?.authToken || session?.authToken || "");
  if (!server || !username || !authSalt || !authToken) return false;
  try {
    if (!silent) setStatus(t("status.connecting"));
    const auth = { u: username, s: authSalt, t: authToken };
    await restJson(server, auth, "ping", {});
    state.server = server;
    state.auth = auth;
    state.user = username;
    setHeaderUserLabel(username);
    setStoredServer(server);
    setStoredCredentials({ user: username, pass: "" }, false);
    saveCurrentProfile(server, username, "");
    resetPlayerState();
    await hydrateStarredIds();
    showScreen("player");
    await setViewMode("artists");
    renderProfiles();
    scheduleBrokerSessionRefresh();
    if (!silent) setStatus(t("status.connected"), "ok");
    return true;
  } catch (e) {
    clearBrokerSession();
    clearBrokerRefreshTimer();
    if (!silent) setStatus(t("common.error", { error: String(e) }), "bad");
    return false;
  }
}

async function pollLinkDeviceFlow() {
  if (!state.linkFlow.deviceCode) return;
  try {
    const data = await pollDevice({ device_code: state.linkFlow.deviceCode });
    if (data.status === "pending") {
      state.linkFlow.pollDelayMs = Math.min(8000, Math.max(2000, Number(data.interval_seconds || 2) * 1000));
      if (linkDeviceStatus) linkDeviceStatus.textContent = t("link.pending");
      state.linkFlow.pollTimer = setTimeout(() => pollLinkDeviceFlow(), state.linkFlow.pollDelayMs);
      return;
    }
    if (data.status === "approved") {
      const brokerSession = setBrokerSession({
        sessionId: data.session_id,
        serverUrl: data.server_url,
        username: data.username,
        authSalt: data.auth_salt,
        authToken: data.auth_token,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        accessExpiresAt: data.access_expires_at,
        refreshExpiresAt: data.refresh_expires_at,
        linkedAt: Date.now(),
      });
      if (linkDeviceStatus) linkDeviceStatus.textContent = t("link.connecting");
      closeLinkDeviceModal();
      const ok = await connectWithBrokerSession(brokerSession, { silent: false });
      if (!ok) setStatus(t("link.failed_start"), "bad");
      return;
    }
    if (data.status === "expired") {
      if (linkDeviceStatus) linkDeviceStatus.textContent = t("link.expired");
      clearLinkFlowTimers();
      return;
    }
    if (data.status === "denied") {
      if (linkDeviceStatus) linkDeviceStatus.textContent = t("link.denied");
      clearLinkFlowTimers();
      return;
    }
    state.linkFlow.pollTimer = setTimeout(() => pollLinkDeviceFlow(), 3000);
  } catch (e) {
    if (linkDeviceStatus) linkDeviceStatus.textContent = t("common.error", { error: String(e) });
    state.linkFlow.pollTimer = setTimeout(() => pollLinkDeviceFlow(), 4000);
  }
}

async function startLinkDeviceFlow() {
  const server = normalizeServer(getStoredServer());
  if (!server) {
    setStatus(t("status.need_server"), "bad");
    openServerModal();
    return;
  }
  if (!linkDeviceModal || !linkDeviceUrl || !linkDeviceCode || !linkDeviceStatus || !linkDeviceText || !linkDeviceTimer) return;
  linkDeviceModal.hidden = false;
  const linkUrl = deriveLinkUrl();
  linkDeviceText.textContent = t("link.url_open_value", { url: linkUrl });
  linkDeviceUrl.textContent = t("link.pin_hint");
  linkDeviceCode.textContent = "----";
  linkDeviceStatus.textContent = t("link.pending");
  linkDeviceTimer.textContent = "0:00";

  clearLinkFlowTimers();
  try {
    const data = await startDevice({ server_url: server });
    state.linkFlow.deviceCode = String(data.device_code || "");
    state.linkFlow.userCode = String(data.user_code || "----");
    state.linkFlow.expiresAt = Date.now() + Math.max(1, Number(data.expires_in || 300)) * 1000;
    state.linkFlow.pollDelayMs = Math.max(2000, Number(data.interval_seconds || 2) * 1000);
    linkDeviceCode.textContent = state.linkFlow.userCode;
    startLinkDeviceCountdown();
    state.linkFlow.pollTimer = setTimeout(() => pollLinkDeviceFlow(), state.linkFlow.pollDelayMs);
  } catch (e) {
    linkDeviceStatus.textContent = t("common.error", { error: String(e) });
  }
}

function showScreen(which) {
  const isLogin = which === "login";
  document.body.classList.toggle("is-login", isLogin);
  document.body.classList.toggle("is-player", !isLogin);
  screenLogin.hidden = !isLogin;
  screenPlayer.hidden = isLogin;
  if (btnOpenMenu) btnOpenMenu.hidden = isLogin;
  if (headerUser) headerUser.hidden = isLogin || !state.user;
  if (isLogin) {
    if (menuModal) menuModal.hidden = true;
    if (profilesModal) profilesModal.hidden = true;
    if (autoThemeModal) autoThemeModal.hidden = true;
  } else if (deviceModeModal) {
    deviceModeModal.hidden = true;
  }
  if (isLogin) {
    setHeaderUserLabel("");
  } else {
    setHeaderUserLabel(state.user);
  }
}

function getTimeZoneOptionFallback(zones, configured) {
  if (configured && zones.includes(configured)) return configured;
  if (zones.includes("UTC")) return "UTC";
  return zones[0] || "UTC";
}

function parseTimeToMinutes(value, fallback) {
  const raw = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(raw)) return fallback;
  const [h, m] = raw.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return fallback;
  return h * 60 + m;
}

function getMinutesInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(map.hour || 0) * 60 + Number(map.minute || 0);
}

async function applyThemeMode({ showAutoInfo = false } = {}) {
  const mode = getThemeMode();
  if (mode === "day") {
    applyTheme("light");
    syncThemeButtons();
    return;
  }
  if (mode === "night") {
    applyTheme("dark");
    syncThemeButtons();
    return;
  }

  const cfg = getAutoThemeSettings();
  const tz = cfg.timeZone || "UTC";

  const nowMinutes = getMinutesInTimeZone(new Date(), tz);
  const dayStart = parseTimeToMinutes(cfg.dayStart, 7 * 60);
  const nightStart = parseTimeToMinutes(cfg.nightStart, 19 * 60);
  const isDay = dayStart <= nightStart ? nowMinutes >= dayStart && nowMinutes < nightStart : nowMinutes >= dayStart || nowMinutes < nightStart;
  applyTheme(isDay ? "light" : "dark");
  if (showAutoInfo) {
    setStatus(t("status.auto_theme"), "ok");
  }
  syncThemeButtons();
}

function scheduleAutoThemeRecheck() {
  if (autoThemeTimer) clearTimeout(autoThemeTimer);
  if (getThemeMode() !== "auto") return;
  autoThemeTimer = setTimeout(() => {
    applyThemeMode().catch(() => {
      // ignore
    });
    scheduleAutoThemeRecheck();
  }, 60 * 1000);
}

function updateServerButton(server) {
  const normalized = normalizeServer(server || "");
  const ok = !!normalized;
  btnEditServer.classList.toggle("ok", ok);
  btnEditServer.textContent = ok ? t("status.server_checked") : t("status.server_not_configured");
}

function setServerCheck(stateValue, text) {
  if (!serverCheck || !serverCheckText) return;
  serverCheck.dataset.state = stateValue;
  serverCheckText.textContent = text;
  serverCheck.title = text || "";
}

async function probeServerUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    lastProbe = { url: "", state: "idle", kind: "idle" };
    setServerCheck("idle", t("status.server_idle"));
    return lastProbe;
  }

  let normalized;
  try {
    if (!/^https?:\/\//i.test(raw)) throw new Error("missing scheme");
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad proto");
    normalized = normalizeServer(`${u.origin}${u.pathname}`);
  } catch {
    lastProbe = { url: raw, state: "bad", kind: "invalid" };
    setServerCheck("bad", raw.includes("://") ? t("status.server_url_invalid") : t("status.server_missing_scheme"));
    return lastProbe;
  }

  setServerCheck("checking", t("status.server_checking"));
  try {
    const pingUrl = `${normalized}/rest/ping.view?f=json&c=carplayer&v=1.16.1`;
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(pingUrl, { method: "GET", signal: ctrl.signal });
    clearTimeout(timeoutId);

    if (res.status === 404) {
      lastProbe = { url: normalized, state: "bad", kind: "not_found" };
      setServerCheck("bad", t("status.server_404"));
      return lastProbe;
    }
    if (res.ok || res.status === 401 || res.status === 403) {
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        // ignore
      }
      const hasSubsonic = payload && typeof payload === "object" && payload["subsonic-response"];
      if (!hasSubsonic) {
        lastProbe = { url: normalized, state: "bad", kind: "not_navidrome" };
        setServerCheck("bad", t("status.server_not_navidrome"));
        return lastProbe;
      }
      lastProbe = { url: normalized, state: "ok", kind: "ok" };
      setServerCheck("ok", t("common.ok"));
      return lastProbe;
    }

    lastProbe = { url: normalized, state: "warn", kind: "http" };
    setServerCheck("warn", t("status.server_http_warn", { code: res.status }));
    return lastProbe;
  } catch {
    lastProbe = { url: normalized, state: "warn", kind: "network" };
    setServerCheck("warn", t("status.server_network_warn"));
    return lastProbe;
  }
}

function setAppHeight() {
  const h = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(h)}px`);
}

function applyListPaneSide(side) {
  if (!playerGrid || !btnPaneSide) return;
  playerGrid.dataset.listPane = side;
  btnPaneSide.textContent = side === "right" ? t("menu.pane_right") : t("menu.pane_left");
}

function renderProfiles() {
  profilesList.innerHTML = "";
  state.profiles = getProfiles();
  if (btnLoginProfiles) btnLoginProfiles.hidden = state.profiles.length === 0;
  for (const profile of state.profiles) {
    const row = document.createElement("div");
    row.className = "profileRow";
    const active = profile.id === state.activeProfileId;
    row.innerHTML = `
      <div>
        <div class="profileName">${escapeHtml(profile.user)}${active ? t("misc.active_profile_suffix") : ""}</div>
        <div class="profileMeta">${escapeHtml(profile.server)}</div>
      </div>
      <button class="ghostBtn">${t("modal.profile_use")}</button>
    `;
    const useBtn = row.querySelector("button");
    if (useBtn) useBtn.type = "button";
    useBtn?.addEventListener("click", async () => {
      if (useBtn.disabled) return;
      useBtn.disabled = true;
      useBtn.classList.add("loading");
      profilesModal.hidden = true;
      menuModal.hidden = true;

      const normalizedServer = normalizeServer(profile.server || "");
      const username = String(profile.user || "").trim();
      const password = String(profile.pass || "");

      try {
        if (!password) {
          const brokerSession = getBrokerSession();
          const brokerServer = normalizeServer(brokerSession?.serverUrl || "");
          const brokerUser = String(brokerSession?.username || "").trim().toLowerCase();
          if (brokerSession && brokerServer === normalizedServer && brokerUser === username.toLowerCase()) {
            const okBroker = await connectWithBrokerSession(brokerSession, { silent: false });
            if (okBroker) return;
          }
          const server = setStoredServer(normalizedServer);
          updateServerButton(server);
          userEl.value = username;
          passEl.value = "";
          showScreen("login");
          setStatus(t("status.profile_no_password"), "bad");
          setTimeout(() => passEl.focus(), 0);
          return;
        }

        const ok = await connectWithCredentials({
          server: normalizedServer,
          username,
          password,
          silent: false,
        });

        if (ok) return;
        const server = setStoredServer(normalizedServer);
        updateServerButton(server);
        userEl.value = username;
        passEl.value = "";
        showScreen("login");
        setTimeout(() => passEl.focus(), 0);
      } finally {
        useBtn.disabled = false;
        useBtn.classList.remove("loading");
      }
    });
    profilesList.appendChild(row);
  }
}

function openProfilesModal() {
  renderProfiles();
  if (!state.profiles.length) {
    setStatus(t("status.new_profile_credentials"));
    return;
  }
  profilesModal.hidden = false;
}

function saveCurrentProfile(server, username, password) {
  const id = profileId(server, username);
  saveProfile({
    id,
    server,
    user: username,
    pass: password,
    updatedAt: Date.now(),
  });
  setActiveProfileId(id);
  state.activeProfileId = id;
  state.profiles = getProfiles();
}

function renderArtists(list) {
  artistsList.innerHTML = "";
  for (const a of list || []) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img class="cover" alt="" src="${DEFAULT_COVER}"/>
      <div class="meta">
        <div class="name">${escapeHtml(a.name || "-")}</div>
      </div>
      <button class="cta">${t("common.view")}</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), a.coverArt, COVER_SIZE_LIST);
    const open = async () => {
      try {
        setStatus(t("player.load_albums_artist", { name: a.name }));
        await selectArtist(a.id, a.name, { openModal: true });
        setStatus(t("common.ok"), "ok");
      } catch (e) {
        setStatus(t("common.error", { error: String(e) }), "bad");
      }
    };
    div.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      open();
    });
    div.addEventListener("click", () => open());
    artistsList.appendChild(div);
  }
}

function renderGenres(list) {
  artistsList.innerHTML = "";
  for (const g of list || []) {
    const div = document.createElement("div");
    div.className = "item";
    const name = g.value || g.name || "-";
    const count = g.albumCount || g.songCount || 0;
    div.innerHTML = `
      <img class="cover" alt="" src="${DEFAULT_COVER}"/>
      <div class="meta">
        <div class="name">${escapeHtml(name)}</div>
        <div class="desc">${count ? `${count} ${g.albumCount ? t("player.albums").toLowerCase() : t("player.songs").toLowerCase()}` : ""}</div>
      </div>
      <button class="cta">${t("common.view")}</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), g.coverArt, COVER_SIZE_LIST);
    const open = async () => {
      try {
        setStatus(t("player.load_genre", { name }));
        await selectGenre(name);
        setStatus(t("common.ok"), "ok");
      } catch (e) {
        setStatus(t("common.error", { error: String(e) }), "bad");
      }
    };
    div.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      open();
    });
    div.addEventListener("click", () => open());
    artistsList.appendChild(div);
  }
}

function renderAlbums(list) {
  artistsList.innerHTML = "";
  for (const al of list || []) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img class="cover" alt="" src="${DEFAULT_COVER}"/>
      <div class="meta">
        <div class="name">${escapeHtml(al.name || "-")}</div>
        <div class="desc">${escapeHtml(al.artist || "")}</div>
      </div>
      <button class="cta">${t("common.play")}</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), al.coverArt, COVER_SIZE_LIST);
    const play = async () => {
      try {
        await playAlbum(al.id);
        setStatus(t("common.ok"), "ok");
      } catch (e) {
        setStatus(t("common.error", { error: String(e) }), "bad");
      }
    };
    div.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      play();
    });
    div.addEventListener("click", () => play());
    artistsList.appendChild(div);
  }
}

function renderPlaylists(list) {
  artistsList.innerHTML = "";
  for (const p of list || []) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img class="cover" alt="" src="${DEFAULT_COVER}"/>
      <div class="meta">
        <div class="name">${escapeHtml(p.name || "-")}</div>
        <div class="desc">${p.songCount ? `${p.songCount} ${t("player.songs").toLowerCase()}` : ""}</div>
      </div>
      <button class="cta">${t("common.play")}</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), p.coverArt, COVER_SIZE_LIST);
    const play = async () => {
      try {
        const sub = await restJson(state.server, state.auth, "getPlaylist", { id: p.id });
        const entries = sub.playlist?.entry || [];
        state.queue = mapSongsToQueue(entries);
        markQueueStarred();
        state.queueIndex = 0;
        syncSongsButton();
        state.randomMode = false;
        renderSongMenu();
        if (state.shuffleEnabled) shuffleQueue(true);
        if (state.queue.length) playIndex(0);
        setStatus(t("common.ok"), "ok");
      } catch (e) {
        setStatus(t("common.error", { error: String(e) }), "bad");
      }
    };
    div.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      play();
    });
    div.addEventListener("click", () => play());
    artistsList.appendChild(div);
  }
}

function renderSongsCatalog(list, emptyText) {
  artistsList.innerHTML = "";
  const items = list || [];
  if (!items.length) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div class="meta"><div class="name">${escapeHtml(emptyText || t("player.empty_results"))}</div></div>`;
    artistsList.appendChild(div);
    return;
  }
  items.forEach((track, index) => {
    const div = document.createElement("div");
    div.className = "item";
    const stars = track.playCount ? ` · ${track.playCount} ${t("player.plays_suffix")}` : "";
    div.innerHTML = `
      <img class="cover" alt="" src="${DEFAULT_COVER}"/>
      <div class="meta">
        <div class="name">${escapeHtml(track.title || "-")}</div>
        <div class="desc">${escapeHtml(track.artist || "")}${stars}</div>
      </div>
      <button class="cta">${t("common.play")}</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), track.coverArt, COVER_SIZE_LIST);
    const play = () => {
      state.queue = items.slice();
      state.queueIndex = index;
      syncSongsButton();
      state.randomMode = false;
      renderSongMenu();
      if (state.shuffleEnabled) shuffleQueue(true);
      playIndex(state.queueIndex);
    };
    div.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      play();
    });
    div.addEventListener("click", () => play());
    artistsList.appendChild(div);
  });
}

function updateProgress() {
  const dur = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 0;
  const cur = Number.isFinite(player.currentTime) ? player.currentTime : 0;

  tNow.textContent = formatTime(cur);
  tDur.textContent = formatTime(dur);

  if (!dur) {
    setBar(nowBar, 0);
    setBar(bufBar, 0);
    seekEl.value = "0";
    return;
  }

  setBar(nowBar, cur / dur);

  let buf = 0;
  try {
    const b = player.buffered;
    if (b && b.length) buf = b.end(b.length - 1);
  } catch {
    buf = 0;
  }
  setBar(bufBar, buf / dur);

  if (!seekEl.matches(":active")) {
    seekEl.value = String(Math.round((cur / dur) * 1000));
  }

  if ("mediaSession" in navigator && typeof navigator.mediaSession.setPositionState === "function" && dur) {
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        position: cur,
        playbackRate: player.playbackRate || 1,
      });
    } catch {
      // ignore
    }
  }

  maybeSubmitScrobble().catch(() => {
    // ignore
  });
}

function updatePlayPauseUI() {
  const playing = !player.paused && !player.ended;
  btnPlayPause.classList.toggle("playing", playing);
  if (pauseHint) {
    const hasTrack = !!(state.queue && state.queue.length && state.queueIndex >= 0 && state.queue[state.queueIndex]);
    if (state.quickActionLoading) {
      pauseHint.textContent = t("player.loading_cover");
      pauseHint.hidden = false;
    } else {
      pauseHint.textContent = t("player.pause");
      pauseHint.hidden = !(hasTrack && player.paused && !player.ended);
    }
  }
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }
}

function updateFavoriteButton(track) {
  if (!track || !track.id) {
    btnFavoriteSong.classList.remove("active");
    btnFavoriteSong.textContent = "♡";
    return;
  }
  const isStarred = state.starredIds.has(track.id) || !!track.starred;
  btnFavoriteSong.classList.toggle("active", isStarred);
  btnFavoriteSong.textContent = isStarred ? "♥" : "♡";
}

function updateNowActionButtons(track) {
  const hasTrack = !!(track && track.id);
  btnAlbums.classList.toggle("isMuted", !hasTrack);
  btnSongs.classList.toggle("isMuted", !hasTrack);
}

function clearNowCover() {
  nowCover.src = DEFAULT_COVER;
  nowBg.style.opacity = "0";
  nowBg.style.removeProperty("--cover-url");
}

function makeCoverCacheKey(coverId, size) {
  return `${state.server || ""}|${state.user || ""}|${coverId || ""}|${size || 0}`;
}

function getCoverCacheState(key) {
  const cached = coverLoadCache.get(key);
  if (!cached) return null;
  if (!cached.ok && Date.now() - cached.at > COVER_FAIL_RETRY_MS) {
    coverLoadCache.delete(key);
    return null;
  }
  return cached.ok;
}

function setCoverCacheState(key, ok) {
  if (!key) return;
  coverLoadCache.set(key, { ok: !!ok, at: Date.now() });
  if (coverLoadCache.size <= COVER_CACHE_MAX_ITEMS) return;
  const oldestKey = coverLoadCache.keys().next().value;
  if (oldestKey) coverLoadCache.delete(oldestKey);
}

function stopCoverRetry() {
  if (!state.coverRetryTimer) return;
  clearInterval(state.coverRetryTimer);
  state.coverRetryTimer = null;
  state.coverRetryTrackId = "";
}

function startCoverRetry(track) {
  if (!track?.id) return;
  stopCoverRetry();
  state.coverRetryTrackId = track.id;
  state.coverRetryTimer = setInterval(async () => {
    if (!state.coverRetryTrackId || state.coverRetryTrackId !== track.id) {
      stopCoverRetry();
      return;
    }
    if (player.paused || player.ended) return;
    const loaded = await applyTrackCover(track, { keepRequestId: true });
    if (loaded) stopCoverRetry();
  }, 3500);
}

function getTrackCoverIds(track) {
  const out = [];
  if (track?.albumCoverArt) out.push(track.albumCoverArt);
  return [...new Set(out)];
}

async function ensureAlbumCoverForTrack(track) {
  if (!track || !track.albumId) {
    track.albumCoverArt = null;
    return null;
  }
  const albumId = String(track.albumId);
  if (Object.prototype.hasOwnProperty.call(state.albumCoverById, albumId)) {
    track.albumCoverArt = state.albumCoverById[albumId];
    return track.albumCoverArt;
  }
  try {
    const sub = await restJson(state.server, state.auth, "getAlbum", { id: albumId });
    const coverId = sub.album?.coverArt ? String(sub.album.coverArt) : null;
    state.albumCoverById[albumId] = coverId;
    track.albumCoverArt = coverId;
    return coverId;
  } catch {
    state.albumCoverById[albumId] = null;
    track.albumCoverArt = null;
    return null;
  }
}

function getPixel(data, size, x, y) {
  const idx = (Math.max(0, Math.min(size - 1, y)) * size + Math.max(0, Math.min(size - 1, x))) * 4;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
}

function isLikelyNavidromeFallbackImage(imageEl) {
  try {
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(imageEl, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    const tl = getPixel(data, size, 3, 3);
    const center = getPixel(data, size, 24, 24);
    const left = getPixel(data, size, 10, 24);
    const top = getPixel(data, size, 24, 8);

    const tlGray = Math.abs(tl.r - tl.g) < 18 && Math.abs(tl.g - tl.b) < 18 && tl.r >= 25 && tl.r <= 95;
    const centerDark = center.r < 45 && center.g < 45 && center.b < 45;
    const leftBlue = left.b > 120 && left.b - left.r > 30 && left.b - left.g > 18;
    const topBlue = top.b > 120 && top.b - top.r > 30 && top.b - top.g > 18;

    return tlGray && centerDark && leftBlue && topBlue;
  } catch {
    return false;
  }
}

function preloadNowCover(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const isFallback = isLikelyNavidromeFallbackImage(img);
      resolve({ ok: !isFallback, fallback: isFallback });
    };
    img.onerror = () => resolve({ ok: false, fallback: false });
    img.src = url;
  });
}

function applyDeferredCover(imgEl, coverId, size) {
  if (!imgEl) return;
  imgEl.src = DEFAULT_COVER;
  if (!coverId) return;
  const src = coverUrl(state.server, state.auth, coverId, size);
  const cacheKey = makeCoverCacheKey(coverId, size);
  const cached = getCoverCacheState(cacheKey);
  if (cached === true) {
    imgEl.src = src;
    return;
  }
  if (cached === false) return;
  const probe = new Image();
  probe.onload = () => {
    setCoverCacheState(cacheKey, true);
    imgEl.src = src;
  };
  probe.onerror = () => {
    setCoverCacheState(cacheKey, false);
    imgEl.src = DEFAULT_COVER;
  };
  probe.src = src;
}

async function applyTrackCover(track, options) {
  const opts = options || {};
  const requestId = opts.keepRequestId ? state.nowCoverRequestId : ++state.nowCoverRequestId;
  await ensureAlbumCoverForTrack(track);
  if (requestId !== state.nowCoverRequestId) return null;
  const ids = getTrackCoverIds(track);
  if (!ids.length) {
    clearNowCover();
    return null;
  }

  for (const id of ids) {
    const src = coverUrl(state.server, state.auth, id, COVER_SIZE_NOW);
    const cacheKey = makeCoverCacheKey(id, COVER_SIZE_NOW);
    const cached = getCoverCacheState(cacheKey);
    let ok;
    if (cached === true) {
      ok = true;
    } else if (cached === false) {
      ok = false;
    } else {
      const probe = await preloadNowCover(src);
      ok = probe.ok;
      setCoverCacheState(cacheKey, ok);
    }
    if (!ok) continue;
    if (requestId !== state.nowCoverRequestId) return null;
    nowCover.src = src;
    nowBg.style.setProperty("--cover-url", `url("${src}")`);
    nowBg.style.opacity = "1";
    return src;
  }

  if (requestId === state.nowCoverRequestId && !opts.keepRequestId) clearNowCover();
  return null;
}

function setNow(track) {
  stopCoverRetry();
  if (!track) {
    nowTitle.textContent = t("player.nothing_playing");
    nowSub.textContent = "—";
    clearNowCover();
    updateFavoriteButton(null);
    updateNowActionButtons(null);
    return;
  }
  nowTitle.textContent = track.title || "-";
  nowSub.textContent = `${track.artist || ""}${track.album ? " · " + track.album : ""}`;
  const coverId = track.coverArt || null;
  state.lastCoverId = coverId;
  applyTrackCover(track)
    .then((loaded) => {
      if (!loaded) startCoverRetry(track);
    })
    .catch(() => {
      clearNowCover();
      startCoverRetry(track);
    });
  updateFavoriteButton(track);
  updateNowActionButtons(track);

  if ("mediaSession" in navigator) {
    const art = track.albumCoverArt ? coverUrl(state.server, state.auth, track.albumCoverArt, COVER_SIZE_NOW) : null;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || "",
        artist: track.artist || "",
        album: track.album || "",
        artwork: art
          ? [
              { src: art, sizes: "320x320", type: "image/jpeg" },
              { src: art, sizes: "96x96", type: "image/jpeg" },
            ]
          : [],
      });
    } catch {
      // ignore
    }
  }
}

function syncSongsButton() {
  btnSongs.disabled = state.queue.length === 0;
  btnSongs.textContent = state.queue.length ? t("player.song_count", { count: state.queue.length }) : t("player.songs_fallback");
}

function queueAndPlayTracks(tracks, options) {
  const opts = options || {};
  const list = markSongsStarred((tracks || []).map((track) => toTrack(track)));
  state.queue = list;
  if (opts.shuffleStart && state.queue.length > 1) {
    shuffleArray(state.queue);
  }
  state.queueIndex = 0;
  state.randomMode = false;
  syncSongsButton();
  renderSongMenu();
  if (state.shuffleEnabled && !opts.shuffleStart) shuffleQueue(true);
  if (state.queue.length) {
    playIndex(0);
    return true;
  }
  return false;
}

function setQuickActionLoading(action) {
  state.quickActionLoading = action || "";
  const most = state.quickActionLoading === "most";
  const fav = state.quickActionLoading === "fav";
  btnPlayMostPlayed.classList.toggle("loading", most);
  btnPlayFavorites.classList.toggle("loading", fav);
  btnPlayMostPlayed.disabled = most || fav;
  btnPlayFavorites.disabled = most || fav;
  updatePlayPauseUI();
}

function markQueueStarred() {
  state.queue = (state.queue || []).map((track) => ({
    ...track,
    starred: state.starredIds.has(track.id) || !!track.starred,
  }));
}

async function sendNowPlayingScrobble(track) {
  if (!track || !track.id || state.scrobbleNowSent) return;
  state.scrobbleNowSent = true;
  try {
    await scrobble(state.server, state.auth, track.id, { submission: false, time: Math.floor(Date.now() / 1000) });
  } catch {
    // ignore
  }
}

async function maybeSubmitScrobble() {
  const idx = state.queueIndex;
  if (idx < 0 || idx >= state.queue.length) return;
  const track = state.queue[idx];
  if (!track || !track.id) return;
  if (state.scrobbleTrackId !== track.id) return;
  if (state.scrobbleSubmissionSent) return;

  const dur = Number.isFinite(player.duration) ? player.duration : Number(track.duration || 0);
  const cur = Number.isFinite(player.currentTime) ? player.currentTime : 0;
  if (!dur || !cur) return;

  const threshold = Math.min(dur * 0.5, 240);
  if (cur < threshold) return;

  state.scrobbleSubmissionSent = true;
  try {
    await scrobble(state.server, state.auth, track.id, { submission: true, time: Math.floor(Date.now() / 1000) });
    track.playCount = Number(track.playCount || 0) + 1;
  } catch {
    state.scrobbleSubmissionSent = false;
  }
}

function renderSongMenu() {
  songMenu.innerHTML = "";
  if (!state.queue || state.queue.length === 0) return;
  let activeEl = null;
  state.queue.forEach((t, idx) => {
    const btn = document.createElement("button");
    btn.className = "songBtn" + (idx === state.queueIndex ? " active" : "");
    btn.innerHTML = `<div class="songLine">${idx + 1} - ${escapeHtml(t.title || "-")}</div>`;
    btn.addEventListener("click", () => playIndex(idx));
    if (idx === state.queueIndex) activeEl = btn;
    songMenu.appendChild(btn);
  });
  if (activeEl) {
    activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

async function playIndex(idx) {
  if (idx < 0 || idx >= state.queue.length) return;
  state.queueIndex = idx;
  const track = state.queue[idx];
  setNow(track);
  renderSongMenu();
  maybePrefetchRandom();
  const url = streamUrl(state.server, state.auth, track.id);
  state.scrobbleTrackId = track.id;
  state.scrobbleNowSent = false;
  state.scrobbleSubmissionSent = false;
  player.src = url;
  try {
    await player.play();
    await sendNowPlayingScrobble(track);
  } catch {
    // ignore autoplay restrictions
  }
}

function playNext(delta) {
  if (state.queue.length === 0) return;
  let next = state.queueIndex + delta;
  if (next < 0) next = 0;
  if (next >= state.queue.length) next = state.queue.length - 1;
  playIndex(next);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function shuffleQueue(keepCurrent = true) {
  if (!state.queue || state.queue.length < 2) return;
  if (!keepCurrent || state.queueIndex < 0) {
    shuffleArray(state.queue);
    state.queueIndex = 0;
    return;
  }
  const current = state.queue[state.queueIndex];
  const rest = state.queue.filter((_, i) => i !== state.queueIndex);
  shuffleArray(rest);
  state.queue = [current, ...rest];
  state.queueIndex = 0;
}

function setShuffleUI() {
  if (state.shuffleEnabled) {
    btnShuffle.classList.add("primary");
    btnShuffle.textContent = t("player.shuffle_on");
  } else {
    btnShuffle.classList.remove("primary");
    btnShuffle.textContent = t("player.shuffle");
  }
}

async function loadRandomBlock(count = 20) {
  const sub = await restJson(state.server, state.auth, "getRandomSongs", { size: count });
  const songs = sub.randomSongs?.song || [];
  const mapped = mapSongsToQueue(songs);
  markSongsStarred(mapped);
  if (state.queue.length === 0) {
    state.queue = mapped;
    state.queueIndex = 0;
    syncSongsButton();
    state.randomPrefetchAt = state.queue.length;
    if (state.queue.length) playIndex(0);
  } else {
    state.queue = state.queue.concat(mapped);
    syncSongsButton();
    state.randomPrefetchAt = state.queue.length;
  }
}

function maybePrefetchRandom() {
  if (!state.shuffleEnabled || !state.randomMode) return;
  if (state.randomLoading) return;
  if (state.queue.length === 0) return;
  const remaining = state.queue.length - 1 - state.queueIndex;
  if (remaining > 5) return;
  if (state.randomPrefetchAt && state.queue.length < state.randomPrefetchAt) return;
  state.randomLoading = true;
  loadRandomBlock(20)
    .catch(() => {
      // ignore
    })
    .finally(() => {
      state.randomLoading = false;
    });
}

function markSongsStarred(list) {
  return (list || []).map((track) => ({ ...track, starred: state.starredIds.has(track.id) || !!track.starred }));
}

async function loadArtists() {
  const sub = await restJson(state.server, state.auth, "getArtists", {});
  const indexes = sub.artists?.index || [];
  const artists = [];
  for (const idx of indexes) {
    for (const a of idx.artist || []) artists.push(a);
  }
  state.artists = artists;
  state.artistsFiltered = artists;
  renderArtists(artists);
}

async function loadGenres() {
  const sub = await restJson(state.server, state.auth, "getGenres", {});
  const genres = sub.genres?.genre || [];
  state.genres = genres;
  state.genresFiltered = genres;
  renderGenres(genres);
}

async function loadAlbums() {
  const sub = await restJson(state.server, state.auth, "getAlbumList2", {
    type: "alphabeticalByName",
    size: 200,
    offset: 0,
  });
  const albums = sub.albumList2?.album || [];
  state.albums = albums;
  state.albumsFiltered = albums;
  renderAlbums(albums);
}

async function loadPlaylists() {
  const sub = await restJson(state.server, state.auth, "getPlaylists", {});
  const playlists = sub.playlists?.playlist || [];
  state.playlists = playlists;
  state.playlistsFiltered = playlists;
  renderPlaylists(playlists);
}

async function loadFavorites(options) {
  const opts = options || {};
  const sub = await getStarred2(state.server, state.auth);
  const songs = sub.starred2?.song || [];
  const mapped = markSongsStarred(mapSongsToQueue(songs));
  state.favoriteSongs = mapped;
  state.favoriteSongsFiltered = mapped;
  if (opts.render !== false) {
    renderSongsCatalog(mapped, t("player.no_favorites"));
  }
}

async function playFavoritesNow() {
  setQuickActionLoading("fav");
  await loadFavorites({ render: false });
  state.shuffleEnabled = true;
  setShuffleUI();
  if (!queueAndPlayTracks(state.favoriteSongs, { shuffleStart: true })) {
    setQuickActionLoading("");
    setStatus(t("player.no_favorites_play"), "bad");
    return;
  }
  setStatus(t("player.favorites_count", { count: state.favoriteSongs.length }), "ok");
}

async function buildMostPlayedFromServer() {
  if (state.mostPlayedLoading) return;
  state.mostPlayedLoading = true;
  try {
    const allAlbums = [];
    const pageSize = 200;
    let offset = 0;

    while (true) {
      const sub = await restJson(state.server, state.auth, "getAlbumList2", {
        type: "alphabeticalByName",
        size: pageSize,
        offset,
      });
      const page = sub.albumList2?.album || [];
      if (!page.length) break;
      allAlbums.push(...page);
      if (page.length < pageSize) break;
      offset += pageSize;
      setStatus(t("player.indexing_albums", { count: allAlbums.length }));
    }

    const tracks = [];
    let done = 0;
    let cursor = 0;
    const concurrency = 4;

    async function worker() {
      while (cursor < allAlbums.length) {
        const i = cursor++;
        const album = allAlbums[i];
        const sub = await restJson(state.server, state.auth, "getAlbum", { id: album.id });
        for (const song of sub.album?.song || []) {
          tracks.push(toTrack(song));
        }
        done += 1;
        if (done % 10 === 0 || done === allAlbums.length) {
          setStatus(t("player.calc_most_played", { done, total: allAlbums.length }));
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const ranked = markSongsStarred(tracks)
      .map((track) => ({ ...track, playCount: Number(track.playCount || 0) }))
      .sort((a, b) => Number(b.playCount || 0) - Number(a.playCount || 0));

    state.mostPlayedSongs = ranked;
    state.mostPlayedSongsFiltered = ranked;

    const cacheKey = getMostPlayedCacheStorageKey();
    if (cacheKey) {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        songs: ranked,
      }));
    }
  } finally {
    state.mostPlayedLoading = false;
  }
}

async function loadMostPlayed(options) {
  const opts = options || {};
  const cacheKey = getMostPlayedCacheStorageKey();
  if (cacheKey) {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.timestamp && Date.now() - parsed.timestamp < MOST_PLAYED_CACHE_TTL_MS && Array.isArray(parsed.songs)) {
          const songs = markSongsStarred(parsed.songs.map((song) => toTrack(song)));
          state.mostPlayedSongs = songs;
          state.mostPlayedSongsFiltered = songs;
          if (opts.render !== false) {
            renderSongsCatalog(songs, t("player.no_plays"));
          }
          return;
        }
      } catch {
        // ignore
      }
    }
  }

  await buildMostPlayedFromServer();
  if (opts.render !== false) {
    renderSongsCatalog(state.mostPlayedSongs, t("player.no_plays"));
  }
}

async function playMostPlayedNow() {
  setQuickActionLoading("most");
  await loadMostPlayed({ render: false });
  state.shuffleEnabled = true;
  setShuffleUI();
  if (!queueAndPlayTracks(state.mostPlayedSongs, { shuffleStart: true })) {
    setQuickActionLoading("");
    setStatus(t("player.no_most_played_play"), "bad");
    return;
  }
  setStatus(t("player.most_played_count", { count: state.mostPlayedSongs.length }), "ok");
}

async function getArtistAlbums(artistId) {
  const cached = state.artistAlbumsById[artistId];
  if (Array.isArray(cached)) return cached;
  const sub = await restJson(state.server, state.auth, "getArtist", { id: artistId });
  const albums = sub.artist?.album || [];
  state.artistAlbumsById[artistId] = albums;
  return albums;
}

async function playAlbum(albumId) {
  const sub = await restJson(state.server, state.auth, "getAlbum", { id: albumId });
  const songs = sub.album?.song || [];
  state.queue = markSongsStarred(mapSongsToQueue(songs));
  state.queueIndex = 0;
  syncSongsButton();
  state.randomMode = false;
  renderSongMenu();
  if (state.shuffleEnabled) shuffleQueue(true);
  if (state.queue.length) playIndex(0);
}

async function playAllRandom() {
  setStatus(t("player.random_loading"));
  state.shuffleEnabled = true;
  setShuffleUI();
  state.randomMode = true;
  state.queue = [];
  state.queueIndex = -1;
  try {
    await loadRandomBlock(20);
    setStatus(t("common.ok"), "ok");
  } catch (e) {
    setStatus(t("common.error", { error: String(e) }), "bad");
  }
}

async function selectArtist(artistId, name, opts) {
  state.selectedArtist = { id: artistId, name };
  state.selectedGenre = null;
  btnAlbums.disabled = true;
  state.selectedArtistAlbums = [];

  const albums = await getArtistAlbums(artistId);
  state.selectedArtistAlbums = albums;
  btnAlbums.disabled = albums.length === 0;
  btnAlbums.textContent = albums.length ? t("player.albums_count", { count: albums.length }) : t("player.albumes_fallback");
  if (opts?.openModal) openAlbumsModal();
}

async function selectGenre(genreName) {
  state.selectedGenre = { name: genreName };
  state.selectedArtist = null;
  btnAlbums.disabled = true;
  state.selectedGenreAlbums = [];

  const sub = await restJson(state.server, state.auth, "getAlbumList2", { type: "byGenre", genre: genreName, size: 200, offset: 0 });
  const albums = sub.albumList2?.album || [];
  state.selectedGenreAlbums = albums;
  btnAlbums.disabled = albums.length === 0;
  btnAlbums.textContent = albums.length ? t("player.albums_count", { count: albums.length }) : t("player.albumes_fallback");
  openAlbumsModal();
}

function openAlbumsModal() {
  const a = state.selectedArtist;
  const g = state.selectedGenre;
  const albums = a ? state.selectedArtistAlbums : state.selectedGenreAlbums;
  if (a) albumsTitle.textContent = t("player.albums_of", { name: a.name });
  else if (g) albumsTitle.textContent = t("player.albums_of", { name: g.name });
  else albumsTitle.textContent = t("modal.albums_title");

  albumsList.innerHTML = "";
  btnPlayAllAlbums.disabled = albums.length === 0;

  for (const al of albums) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img class="cover" alt="" src="${DEFAULT_COVER}"/>
      <div class="meta">
        <div class="name">${escapeHtml(al.name || "-")}</div>
        <div class="desc">${escapeHtml(a?.name || "")}</div>
      </div>
      <button class="cta">${t("common.play")}</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), al.coverArt, COVER_SIZE_LIST);
    div.querySelector("button").addEventListener("click", async (e) => {
      e.stopPropagation();
      await playAlbum(al.id);
      closeAlbumsModal();
    });
    div.addEventListener("click", async () => {
      await playAlbum(al.id);
      closeAlbumsModal();
    });
    albumsList.appendChild(div);
  }
  albumsModal.hidden = false;
}

function closeAlbumsModal() {
  albumsModal.hidden = true;
}

async function playAllAlbums() {
  const albums = state.selectedArtist ? state.selectedArtistAlbums : state.selectedGenreAlbums;
  if (!albums.length) return;
  const cacheKey = state.selectedArtist
    ? `artist:${state.selectedArtist.id}`
    : state.selectedGenre
      ? `genre:${state.selectedGenre.name}`
      : null;
  const cached = cacheKey ? state.artistSongsById[cacheKey] : null;
  if (Array.isArray(cached) && cached.length) {
    state.queue = markSongsStarred(cached);
    state.queueIndex = 0;
    syncSongsButton();
    state.randomMode = false;
    renderSongMenu();
    if (state.shuffleEnabled) shuffleQueue(true);
    if (state.queue.length) playIndex(0);
    closeAlbumsModal();
    return;
  }

  setStatus(t("player.load_albums_total", { count: albums.length }));
  btnPlayAllAlbums.disabled = true;
  const allSongs = [];
  try {
    const concurrency = 4;
    let index = 0;
    let done = 0;
    const total = albums.length;

    async function worker() {
      while (index < total) {
        const i = index++;
        const al = albums[i];
        const sub = await restJson(state.server, state.auth, "getAlbum", { id: al.id });
        const songs = sub.album?.song || [];
        for (const song of songs) allSongs.push(toTrack(song));
        done += 1;
        setStatus(t("player.calc_most_played", { done, total }));
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    const normalized = markSongsStarred(allSongs);
    if (cacheKey) state.artistSongsById[cacheKey] = normalized.slice();

    state.queue = normalized;
    state.queueIndex = 0;
    syncSongsButton();
    state.randomMode = false;
    renderSongMenu();
    if (state.shuffleEnabled) shuffleQueue(true);
    if (state.queue.length) playIndex(0);
    setStatus(t("common.ok"), "ok");
    closeAlbumsModal();
  } catch (e) {
    setStatus(t("common.error", { error: String(e) }), "bad");
  } finally {
    btnPlayAllAlbums.disabled = false;
  }
}

function openSongsModal() {
  if (!state.queue || state.queue.length === 0) return;
  const current = state.queue[state.queueIndex] || null;
  songsTitle.textContent = current?.album ? t("player.albums_of", { name: current.album }) : t("modal.songs_title");
  songsList.innerHTML = "";
  let activeEl = null;
  state.queue.forEach((track, idx) => {
    const div = document.createElement("div");
    div.className = "item";
    const active = idx === state.queueIndex;
    div.innerHTML = `
      <div class="cover" style="display:grid;place-items:center;font-weight:900">${active ? "▶" : String(idx + 1)}</div>
      <div class="meta">
        <div class="name">${escapeHtml(track.title || "-")}</div>
        <div class="desc">${escapeHtml(track.artist || "")}</div>
      </div>
      <button class="cta">${t("common.play")}</button>
    `;
    div.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      playIndex(idx);
      closeSongsModal();
    });
    div.addEventListener("click", () => {
      playIndex(idx);
      closeSongsModal();
    });
    if (active) activeEl = div;
    songsList.appendChild(div);
  });
  songsModal.hidden = false;
  if (activeEl) activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function closeSongsModal() {
  songsModal.hidden = true;
}

function closeWhatsNewModal(markSeen = true) {
  if (markSeen) setWhatsNewSeenVersion(APP_VERSION);
  whatsNewModal.hidden = true;
}

function openWhatsNewModal() {
  whatsNewTitle.textContent = t("whatsnew.title", { version: APP_VERSION });
  whatsNewList.innerHTML = "";
  const sections = getWhatsNewSections(APP_VERSION);
  for (const section of sections) {
    const title = document.createElement("div");
    title.className = "whatsNewSectionTitle";
    title.textContent = section.version;
    whatsNewList.appendChild(title);

    const items = Array.isArray(section.items) && section.items.length ? section.items : [t("whatsnew.no_details")];
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "whatsNewItem";
      row.textContent = item;
      whatsNewList.appendChild(row);
    }
  }
  whatsNewModal.hidden = false;
}

function fillAutoThemeModal() {
  autoThemeTimezone.innerHTML = "";
  const zones = getTimeZonesList();
  const cfg = getAutoThemeSettings();
  for (const zone of zones) {
    const option = document.createElement("option");
    option.value = zone;
    option.textContent = zone;
    autoThemeTimezone.appendChild(option);
  }
  autoThemeTimezone.value = getTimeZoneOptionFallback(zones, cfg.timeZone);
  autoThemeDayStart.value = cfg.dayStart || "07:00";
  autoThemeNightStart.value = cfg.nightStart || "19:00";
}

function openAutoThemeModal() {
  fillAutoThemeModal();
  autoThemeModal.hidden = false;
}

function closeAutoThemeModal() {
  autoThemeModal.hidden = true;
}

function openServerModal() {
  serverUrlInput.value = getStoredServer();
  serverModal.hidden = false;
  setServerCheck("idle", t("status.server_idle"));
  if (serverUrlInput.value) probeServerUrl(serverUrlInput.value);
  setTimeout(() => {
    setAppHeight();
    serverUrlInput.focus();
  }, 0);
}

function closeServerModal() {
  serverModal.hidden = true;
}

function resetPlayerState() {
  setQuickActionLoading("");
  stopCoverRetry();
  state.queue = [];
  state.queueIndex = -1;
  state.selectedArtist = null;
  state.selectedArtistAlbums = [];
  state.artistAlbumsById = {};
  state.albumCoverById = {};
  state.artistSongsById = {};
  state.selectedGenre = null;
  state.selectedGenreAlbums = [];
  state.albums = [];
  state.albumsFiltered = [];
  state.playlists = [];
  state.playlistsFiltered = [];
  state.favoriteSongs = [];
  state.favoriteSongsFiltered = [];
  state.mostPlayedSongs = [];
  state.mostPlayedSongsFiltered = [];
  state.starredIds = new Set();
  btnAlbums.disabled = true;
  btnAlbums.textContent = t("player.albumes_fallback");
  btnSongs.disabled = true;
  btnSongs.textContent = t("player.songs_fallback");
  state.shuffleEnabled = false;
  state.randomMode = false;
  state.randomLoading = false;
  state.randomPrefetchAt = 0;
  state.scrobbleTrackId = "";
  state.scrobbleNowSent = false;
  state.scrobbleSubmissionSent = false;
  setShuffleUI();
  setNow(null);
  songMenu.innerHTML = "";
  player.pause();
  player.removeAttribute("src");
  updateProgress();
}

async function hydrateStarredIds() {
  try {
    const sub = await getStarred2(state.server, state.auth);
    const songs = sub.starred2?.song || [];
    state.starredIds = new Set((songs || []).map((song) => song.id).filter(Boolean));
  } catch {
    state.starredIds = new Set();
  }
}

async function connectWithCredentials({ server, username, password, silent = false }) {
  const normalizedServer = normalizeServer(server || "");
  const user = String(username || "").trim();
  if (!normalizedServer) {
    if (!silent) setStatus(t("status.need_server"), "bad");
    openServerModal();
    return false;
  }
  if (!user || !password) {
    if (!silent) setStatus(t("status.missing_credentials"), "bad");
    return false;
  }
  if (!silent) setStatus(t("status.connecting"));
  btnConnect.disabled = true;

  const auth = makeAuth(user, password);
  try {
    await restJson(normalizedServer, auth, "ping", {});
    state.server = normalizedServer;
    state.auth = auth;
    state.user = user;
    setHeaderUserLabel(user);
    const remember = !!rememberCredsEl?.checked;
    setRememberCreds(remember);
    await revokeBrokerSessionSafe();
    const storedServer = setStoredServer(normalizedServer);
    updateServerButton(storedServer);
    setStoredCredentials({ user, pass: password }, remember);
    saveCurrentProfile(normalizedServer, user, password);
    resetPlayerState();
    await hydrateStarredIds();
    if (!silent) setStatus(t("status.connected"), "ok");
    showScreen("player");
    setViewMode("artists");
    renderProfiles();
    return true;
  } catch (e) {
    if (!silent) setStatus(t("common.error", { error: String(e) }), "bad");
    return false;
  } finally {
    btnConnect.disabled = false;
  }
}

async function connect() {
  return connectWithCredentials({
    server: getStoredServer(),
    username: userEl.value,
    password: passEl.value,
    silent: false,
  });
}

async function tryAutoConnectFromStoredState(activeProfiles, activeId) {
  const brokerSession = getBrokerSession();
  if (brokerSession) {
    setStatus(t("status.autoconnecting"));
    const ok = await connectWithBrokerSession(brokerSession, { silent: false });
    if (ok) return true;
  }

  if (!getRememberCreds()) return false;
  const active = activeProfiles.find((p) => p.id === activeId) || activeProfiles[0];
  if (!active?.server || !active?.user || !active?.pass) return false;
  setStatus(t("status.autoconnecting"));
  return connectWithCredentials({
    server: active.server,
    username: active.user,
    password: active.pass,
    silent: false,
  });
}

function applyListFilter() {
  const q = (artistFilter.value || "").trim().toLowerCase();
  if (state.viewMode === "genres") {
    state.genresFiltered = !q
      ? state.genres
      : state.genres.filter((g) => (g.value || g.name || "").toLowerCase().includes(q));
    renderGenres(state.genresFiltered);
  } else if (state.viewMode === "albums") {
    state.albumsFiltered = !q ? state.albums : state.albums.filter((a) => (a.name || "").toLowerCase().includes(q));
    renderAlbums(state.albumsFiltered);
  } else if (state.viewMode === "playlists") {
    state.playlistsFiltered = !q ? state.playlists : state.playlists.filter((p) => (p.name || "").toLowerCase().includes(q));
    renderPlaylists(state.playlistsFiltered);
  } else if (state.viewMode === "favorites") {
    state.favoriteSongsFiltered = !q
      ? state.favoriteSongs
      : state.favoriteSongs.filter((s) => `${s.title || ""} ${s.artist || ""} ${s.album || ""}`.toLowerCase().includes(q));
    renderSongsCatalog(state.favoriteSongsFiltered, t("player.no_favorites"));
  } else if (state.viewMode === "mostPlayed") {
    state.mostPlayedSongsFiltered = !q
      ? state.mostPlayedSongs
      : state.mostPlayedSongs.filter((s) => `${s.title || ""} ${s.artist || ""} ${s.album || ""}`.toLowerCase().includes(q));
    renderSongsCatalog(state.mostPlayedSongsFiltered, t("player.no_plays"));
  } else {
    state.artistsFiltered = !q ? state.artists : state.artists.filter((a) => (a.name || "").toLowerCase().includes(q));
    renderArtists(state.artistsFiltered);
  }
}

async function setViewMode(mode) {
  state.viewMode = mode;
  btnViewArtists.classList.toggle("active", mode === "artists");
  btnViewGenres.classList.toggle("active", mode === "genres");
  btnViewAlbums.classList.toggle("active", mode === "albums");
  btnViewPlaylists.classList.toggle("active", mode === "playlists");
  artistFilter.value = "";
  artistFilter.placeholder =
    mode === "genres"
      ? t("player.filter_genre")
      : mode === "albums"
        ? t("player.filter_album")
        : mode === "playlists"
          ? t("player.filter_playlist")
          : t("player.filter_artist");

  if (mode === "genres") {
    await loadGenres();
  } else if (mode === "albums") {
    await loadAlbums();
  } else if (mode === "playlists") {
    await loadPlaylists();
  } else {
    await loadArtists();
  }
}

async function toggleFavoriteCurrentTrack() {
  const track = state.queue[state.queueIndex];
  if (!track || !track.id) return;
  const isStarred = state.starredIds.has(track.id) || !!track.starred;
  try {
    if (isStarred) {
      await unstar(state.server, state.auth, track.id);
      state.starredIds.delete(track.id);
      track.starred = false;
    } else {
      await star(state.server, state.auth, track.id);
      state.starredIds.add(track.id);
      track.starred = true;
    }
    updateFavoriteButton(track);
    renderSongMenu();
    if (state.viewMode === "favorites") {
      await loadFavorites();
    }
  } catch (e) {
    setStatus(t("status.favorite_toggle_error", { error: String(e) }), "bad");
  }
}

function wireEvents() {
  nowCover.addEventListener("error", () => {
    if ((nowCover.getAttribute("src") || "").endsWith(DEFAULT_COVER)) return;
    clearNowCover();
  });

  setAppHeight();
  window.addEventListener("resize", () => {
    setAppHeight();
    if (state.deviceMode === "auto") applyDeviceMode("auto");
  });
  window.visualViewport?.addEventListener("resize", () => {
    setAppHeight();
    if (state.deviceMode === "auto") applyDeviceMode("auto");
  });
  window.visualViewport?.addEventListener("scroll", setAppHeight);

  btnDeviceModeAuto?.addEventListener("click", () => {
    const next = setDeviceMode("auto");
    applyDeviceMode(next);
    maybeSuggestDeviceMode();
  });
  btnDeviceModeCar?.addEventListener("click", () => setAndApplyDeviceMode("car"));
  btnDeviceModeDesktop?.addEventListener("click", () => setAndApplyDeviceMode("desktop"));
  btnDeviceModeModalClose?.addEventListener("click", () => {
    setDeviceModePromptSeen(true);
    closeDeviceModeModal();
  });
  btnDeviceModeUseSuggested?.addEventListener("click", () => {
    const mode = btnDeviceModeUseSuggested.dataset.mode || "desktop";
    setAndApplyDeviceMode(mode);
    closeDeviceModeModal();
  });
  btnDeviceModeUseAlternative?.addEventListener("click", () => {
    const mode = btnDeviceModeUseAlternative.dataset.mode || "car";
    setAndApplyDeviceMode(mode);
    closeDeviceModeModal();
  });
  btnDeviceModeKeepAuto?.addEventListener("click", () => {
    setDeviceModePromptSeen(true);
    applyDeviceMode("auto");
    closeDeviceModeModal();
  });
  btnLangEs?.addEventListener("click", () => setLanguageUi("es"));
  btnLangEn?.addEventListener("click", () => setLanguageUi("en"));
  deviceModeModal?.addEventListener("click", (event) => {
    if (event.target === deviceModeModal) {
      setDeviceModePromptSeen(true);
      closeDeviceModeModal();
    }
  });

  btnEditServer.addEventListener("click", () => openServerModal());
  btnServerCancel.addEventListener("click", () => closeServerModal());
  btnServerSave.addEventListener("click", () => {
    const value = (serverUrlInput.value || "").trim();
    if (!value) {
      const normalized = setStoredServer("");
      updateServerButton(normalized);
      closeServerModal();
      return;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("invalid protocol");
      const normalized = normalizeServer(`${parsed.origin}${parsed.pathname}`);
      if (lastProbe.kind === "not_found" && lastProbe.url === normalizeServer(normalized)) {
        setStatus(t("status.server_not_found"), "bad");
        return;
      }
      const stored = setStoredServer(normalized);
      updateServerButton(stored);
      closeServerModal();
    } catch {
      setStatus(t("status.invalid_url"), "bad");
    }
  });
  serverUrlInput.addEventListener("input", () => {
    if (serverProbeTimer) clearTimeout(serverProbeTimer);
    serverProbeTimer = setTimeout(() => probeServerUrl(serverUrlInput.value), 400);
  });
  serverUrlInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    btnServerSave.click();
  });
  serverModal.addEventListener("click", (event) => {
    if (event.target === serverModal) closeServerModal();
  });

  btnPaneSide?.addEventListener("click", () => {
    const current = playerGrid?.dataset.listPane === "right" ? "right" : "left";
    const next = setListPaneSide(current === "left" ? "right" : "left");
    applyListPaneSide(next);
  });

  btnLinkDevice?.addEventListener("click", () => {
    startLinkDeviceFlow().catch((e) => setStatus(t("common.error", { error: String(e) }), "bad"));
  });
  btnLinkClose?.addEventListener("click", () => closeLinkDeviceModal());
  btnLinkRetry?.addEventListener("click", () => {
    startLinkDeviceFlow().catch((e) => {
      if (linkDeviceStatus) linkDeviceStatus.textContent = t("common.error", { error: String(e) });
    });
  });
  linkDeviceModal?.addEventListener("click", (event) => {
    if (event.target === linkDeviceModal) closeLinkDeviceModal();
  });

  btnConnect.addEventListener("click", () => connect());
  userEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    passEl.focus();
  });
  passEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    connect();
  });

  [userEl, passEl].forEach((el) => {
    el.addEventListener("focus", () => {
      setTimeout(() => {
        setAppHeight();
        try {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
          // ignore
        }
      }, 50);
    });
  });

  const keyboardInputs = [artistFilter, userEl, passEl, serverUrlInput].filter(Boolean);

  keyboardInputs.forEach((el) => {
    el.addEventListener("focus", () => {
      if (state.resolvedDeviceMode !== "car") return;
      if (btnHideKeyboard) btnHideKeyboard.hidden = false;
      if (btnServerHideKeyboard) btnServerHideKeyboard.hidden = false;
    });
  });

  keyboardInputs.forEach((el) => {
    el.addEventListener("blur", () => {
      if (btnHideKeyboard) btnHideKeyboard.hidden = true;
      if (btnServerHideKeyboard) btnServerHideKeyboard.hidden = true;
    });
  });

  btnHideKeyboard?.addEventListener("click", () => {
    if (!btnHideKeyboard) return;
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    btnHideKeyboard.hidden = true;
  });
  btnServerHideKeyboard?.addEventListener("click", () => {
    if (!btnServerHideKeyboard) return;
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    btnServerHideKeyboard.hidden = true;
  });

  btnPrev.addEventListener("click", () => playNext(-1));
  btnNext.addEventListener("click", () => playNext(1));
  btnPlayPause.addEventListener("click", async () => {
    if (player.paused) {
      try {
        await player.play();
      } catch {
        // ignore
      }
    } else {
      player.pause();
    }
    updatePlayPauseUI();
  });
  btnPlayAll.addEventListener("click", async () => {
    await playAllRandom();
  });
  btnShuffle.addEventListener("click", async () => {
    state.shuffleEnabled = !state.shuffleEnabled;
    setShuffleUI();
    if (state.shuffleEnabled) {
      if (state.queue.length > 0) {
        shuffleQueue(true);
        state.randomMode = false;
      } else {
        setStatus(t("player.random_loading"));
        try {
          state.randomMode = true;
          await loadRandomBlock(20);
          setStatus(t("common.ok"), "ok");
        } catch (e) {
          setStatus(t("common.error", { error: String(e) }), "bad");
        }
      }
    } else {
      state.randomMode = false;
    }
  });

  btnFavoriteSong.addEventListener("click", () => {
    toggleFavoriteCurrentTrack();
  });

  player.addEventListener("ended", () => {
    if (state.queueIndex + 1 < state.queue.length) playIndex(state.queueIndex + 1);
    updatePlayPauseUI();
  });
  player.addEventListener("play", () => {
    setQuickActionLoading("");
    updatePlayPauseUI();
  });
  player.addEventListener("pause", updatePlayPauseUI);
  player.addEventListener("timeupdate", updateProgress);
  player.addEventListener("progress", updateProgress);
  player.addEventListener("loadedmetadata", updateProgress);
  player.addEventListener("durationchange", updateProgress);

  seekEl.addEventListener("input", () => {
    const dur = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 0;
    if (!dur) return;
    const v = Number(seekEl.value) / 1000;
    setBar(nowBar, v);
    tNow.textContent = formatTime(dur * v);
  });
  seekEl.addEventListener("change", () => {
    const dur = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 0;
    if (!dur) return;
    const v = Number(seekEl.value) / 1000;
    player.currentTime = dur * v;
    updateProgress();
  });

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", async () => {
        try {
          await player.play();
        } catch {
          // ignore
        }
      });
      navigator.mediaSession.setActionHandler("pause", () => player.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => playNext(-1));
      navigator.mediaSession.setActionHandler("nexttrack", () => playNext(1));
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details && Number.isFinite(details.seekTime)) {
          player.currentTime = details.seekTime;
          updateProgress();
        }
      });
    } catch {
      // ignore
    }
  }

  btnAlbums.addEventListener("click", () => {
    if (!btnAlbums.disabled) openAlbumsModal();
  });
  btnPlayAllAlbums.addEventListener("click", () => playAllAlbums());
  btnCloseAlbums.addEventListener("click", () => closeAlbumsModal());
  albumsModal.addEventListener("click", (e) => {
    if (e.target === albumsModal) closeAlbumsModal();
  });

  btnSongs.addEventListener("click", () => {
    if (!btnSongs.disabled) openSongsModal();
  });
  btnCloseSongs.addEventListener("click", () => closeSongsModal());
  songsModal.addEventListener("click", (e) => {
    if (e.target === songsModal) closeSongsModal();
  });

  btnWhatsNew?.addEventListener("click", () => openWhatsNewModal());
  btnCloseWhatsNew?.addEventListener("click", () => closeWhatsNewModal(true));
  whatsNewModal?.addEventListener("click", (event) => {
    if (event.target === whatsNewModal) closeWhatsNewModal(true);
  });

  btnClearArtists.addEventListener("click", () => {
    artistFilter.value = "";
    applyListFilter();
    artistsList.scrollTo({ top: 0, behavior: "smooth" });
  });
  artistFilter.addEventListener("input", () => {
    if (filterTimer) clearTimeout(filterTimer);
    filterTimer = setTimeout(() => applyListFilter(), 120);
  });

  btnViewArtists.addEventListener("click", () => setViewMode("artists").catch((e) => setStatus(String(e), "bad")));
  btnViewGenres.addEventListener("click", () => setViewMode("genres").catch((e) => setStatus(String(e), "bad")));
  btnViewAlbums.addEventListener("click", () => setViewMode("albums").catch((e) => setStatus(String(e), "bad")));
  btnViewPlaylists.addEventListener("click", () => setViewMode("playlists").catch((e) => setStatus(String(e), "bad")));
  btnPlayMostPlayed.addEventListener("click", async () => {
    try {
      setStatus(t("status.loading_most_played"));
      await playMostPlayedNow();
    } catch (e) {
      setQuickActionLoading("");
      setStatus(t("common.error", { error: String(e) }), "bad");
    }
  });
  btnPlayFavorites.addEventListener("click", async () => {
    try {
      setStatus(t("status.loading_favorites"));
      await playFavoritesNow();
    } catch (e) {
      setQuickActionLoading("");
      setStatus(t("common.error", { error: String(e) }), "bad");
    }
  });

  btnOpenMenu.addEventListener("click", () => {
    syncThemeButtons();
    menuModal.hidden = false;
  });
  btnCloseMenu.addEventListener("click", () => {
    menuModal.hidden = true;
  });
  menuModal.addEventListener("click", (event) => {
    if (event.target === menuModal) menuModal.hidden = true;
  });

  btnThemeDay.addEventListener("click", () => {
    setThemeMode("day");
    applyThemeMode().catch(() => {
      // ignore
    });
    scheduleAutoThemeRecheck();
  });
  btnThemeNight.addEventListener("click", () => {
    setThemeMode("night");
    applyThemeMode().catch(() => {
      // ignore
    });
    scheduleAutoThemeRecheck();
  });
  btnThemeAuto.addEventListener("click", () => {
    const cfg = getAutoThemeSettings();
    if (!cfg.configured) {
      openAutoThemeModal();
      return;
    }
    setThemeMode("auto");
    applyThemeMode({ showAutoInfo: true }).catch(() => {
      // ignore
    });
    scheduleAutoThemeRecheck();
  });
  btnThemeAutoConfig.addEventListener("click", () => {
    openAutoThemeModal();
  });

  btnOpenProfiles.addEventListener("click", () => {
    openProfilesModal();
  });
  btnLoginProfiles?.addEventListener("click", () => {
    openProfilesModal();
  });
  btnCloseProfiles.addEventListener("click", () => {
    profilesModal.hidden = true;
  });
  profilesModal.addEventListener("click", (event) => {
    if (event.target === profilesModal) profilesModal.hidden = true;
  });
  btnAddProfile.addEventListener("click", () => {
    profilesModal.hidden = true;
    menuModal.hidden = true;
    showScreen("login");
    setStatus(t("status.new_profile_credentials"));
  });

  btnAutoThemeCancel.addEventListener("click", () => closeAutoThemeModal());
  btnAutoThemeSave.addEventListener("click", () => {
    const tz = autoThemeTimezone.value || "UTC";
    const settings = {
      timeZone: tz,
      dayStart: autoThemeDayStart.value || "07:00",
      nightStart: autoThemeNightStart.value || "19:00",
      configured: true,
    };
    setAutoThemeSettings(settings);
    setThemeMode("auto");
    applyThemeMode({ showAutoInfo: true }).catch(() => {
      // ignore
    });
    scheduleAutoThemeRecheck();
    closeAutoThemeModal();
  });
  autoThemeModal.addEventListener("click", (event) => {
    if (event.target === autoThemeModal) closeAutoThemeModal();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && getThemeMode() === "auto") {
      applyThemeMode().catch(() => {
        // ignore
      });
    }
  });
}

function init() {
  migrateLegacyPreferences();
  registerServiceWorker();
  const storedLanguage = getLanguage();
  const initialLanguage = storedLanguage || detectPreferredLanguage();
  state.i18n = createI18n(initialLanguage);
  setLanguageUi(initialLanguage);

  updateServerButton(getStoredServer());

  const remember = getRememberCreds();
  setRememberCreds(remember);
  if (rememberCredsEl) rememberCredsEl.checked = remember;
  const { user, pass } = getStoredCredentials();
  if (user) userEl.value = user;
  if (pass) passEl.value = pass;

  applyDeviceMode(getDeviceMode());
  applyListPaneSide(getListPaneSide());
  applyThemeMode().catch(() => {
    const saved = getTheme();
    if (saved) applyTheme(saved);
  });
  scheduleAutoThemeRecheck();
  syncThemeButtons();

  renderProfiles();
  showScreen("login");
  setHeaderUserLabel("");
  setTimeout(() => maybeSuggestDeviceMode(), 180);

  if (loginFooterVer) loginFooterVer.textContent = APP_VERSION;
  checkForUpdate({ currentTag: APP_VERSION, repo: UPDATE_REPO, currentEl: verCurrent, latestEl: verLatest }).finally(() => {
    if (!loginFooterUpd || !loginFooterVer) return;
    loginFooterVer.textContent = verCurrent?.textContent || APP_VERSION;
    const latestRaw = verLatest?.textContent || "";
    if (verLatest?.hidden || !latestRaw) {
      loginFooterUpd.hidden = true;
      loginFooterUpd.textContent = "";
      return;
    }
    loginFooterUpd.textContent = `⬆ ${latestRaw}`;
    loginFooterUpd.hidden = false;
  });
  const seen = getWhatsNewSeenVersion();
  if (seen !== APP_VERSION && getWhatsNewForVersion(APP_VERSION).length) {
    openWhatsNewModal();
  }

  const activeId = getActiveProfileId();
  const profiles = getProfiles();
  if (activeId) {
    const active = profiles.find((p) => p.id === activeId);
    if (active?.user) userEl.value = active.user;
  }

  setTimeout(() => {
    tryAutoConnectFromStoredState(profiles, activeId).catch(() => {
      // ignore auto-connect errors
    });
  }, 80);

  setShuffleUI();
}

wireEvents();
init();
