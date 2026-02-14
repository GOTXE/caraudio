import {
  getListPaneSide,
  getRememberCreds,
  getStoredCredentials,
  getStoredServer,
  getTheme,
  setListPaneSide,
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

const statusEl = document.getElementById("status");
const btnEditServer = document.getElementById("btnEditServer");
const btnWhatsNew = document.getElementById("btnWhatsNew");
const verCurrent = document.getElementById("verCurrent");
const verLatest = document.getElementById("verLatest");
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
const headerUser = document.getElementById("headerUser");
const menuModal = document.getElementById("menuModal");
const btnCloseMenu = document.getElementById("btnCloseMenu");
const btnThemeDay = document.getElementById("btnThemeDay");
const btnThemeNight = document.getElementById("btnThemeNight");
const btnThemeAuto = document.getElementById("btnThemeAuto");
const btnThemeAutoConfig = document.getElementById("btnThemeAutoConfig");
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
  scrobbleTrackId: "",
  scrobbleNowSent: false,
  scrobbleSubmissionSent: false,
  mostPlayedLoading: false,
  nowCoverRequestId: 0,
  quickActionLoading: "",
  coverRetryTimer: null,
  coverRetryTrackId: "",
};

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
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
    themeAutoHint.textContent = `Auto: ${autoCfg.timeZone || "UTC"}`;
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
    headerUser.textContent = "@—";
    return;
  }
  headerUser.hidden = false;
  headerUser.textContent = `@${value}`;
}

function showScreen(which) {
  const isLogin = which === "login";
  screenLogin.hidden = !isLogin;
  screenPlayer.hidden = isLogin;
  if (btnOpenMenu) btnOpenMenu.hidden = isLogin;
  if (headerUser) headerUser.hidden = isLogin || !state.user;
  if (isLogin) {
    if (menuModal) menuModal.hidden = true;
    if (profilesModal) profilesModal.hidden = true;
    if (autoThemeModal) autoThemeModal.hidden = true;
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
    setStatus("Modo auto: usando horario configurado.", "ok");
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
  btnEditServer.textContent = ok ? "Servidor configurado" : "Servidor no configurado";
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
    setServerCheck("idle", "Sin comprobar");
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
    setServerCheck("bad", raw.includes("://") ? "URL invalida" : "Falta https://");
    return lastProbe;
  }

  setServerCheck("checking", "Comprobando...");
  try {
    const pingUrl = `${normalized}/rest/ping.view?f=json&c=carplayer&v=1.16.1`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(pingUrl, { method: "GET", signal: ctrl.signal });
    clearTimeout(t);

    if (res.status === 404) {
      lastProbe = { url: normalized, state: "bad", kind: "not_found" };
      setServerCheck("bad", "No encontrado (404). Revisa dominio o subruta");
      return lastProbe;
    }
    if (res.ok || res.status === 401 || res.status === 403) {
      lastProbe = { url: normalized, state: "ok", kind: "ok" };
      setServerCheck("ok", "OK");
      return lastProbe;
    }

    lastProbe = { url: normalized, state: "warn", kind: "http" };
    setServerCheck("warn", `Respuesta HTTP ${res.status} (no bloqueante)`);
    return lastProbe;
  } catch {
    lastProbe = { url: normalized, state: "warn", kind: "network" };
    setServerCheck("warn", "No se pudo comprobar (DNS/CORS/offline)");
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
  btnPaneSide.textContent = side === "right" ? "Dercha" : "Izquierda";
}

function renderProfiles() {
  profilesList.innerHTML = "";
  state.profiles = getProfiles();
  for (const profile of state.profiles) {
    const row = document.createElement("div");
    row.className = "profileRow";
    const active = profile.id === state.activeProfileId;
    row.innerHTML = `
      <div>
        <div class="profileName">${escapeHtml(profile.user)}${active ? " · Activo" : ""}</div>
        <div class="profileMeta">${escapeHtml(profile.server)}</div>
      </div>
      <button class="ghostBtn">Cambiar</button>
    `;
    row.querySelector("button").addEventListener("click", async () => {
      if (!profile.pass) {
        setStatus("Ese perfil no tiene clave guardada.", "bad");
        return;
      }
      await connectWithCredentials({ server: profile.server, username: profile.user, password: profile.pass, silent: false });
      profilesModal.hidden = true;
      menuModal.hidden = true;
    });
    profilesList.appendChild(row);
  }
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
      <button class="cta">Ver</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), a.coverArt, COVER_SIZE_LIST);
    const open = async () => {
      try {
        setStatus(`Cargando albumes: ${a.name}...`);
        await selectArtist(a.id, a.name, { openModal: true });
        setStatus("OK.", "ok");
      } catch (e) {
        setStatus(`Error: ${String(e)}`, "bad");
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
        <div class="desc">${count ? `${count} ${g.albumCount ? "albumes" : "canciones"}` : ""}</div>
      </div>
      <button class="cta">Ver</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), g.coverArt, COVER_SIZE_LIST);
    const open = async () => {
      try {
        setStatus(`Cargando genero: ${name}...`);
        await selectGenre(name);
        setStatus("OK.", "ok");
      } catch (e) {
        setStatus(`Error: ${String(e)}`, "bad");
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
      <button class="cta">Reproducir</button>
    `;
    applyDeferredCover(div.querySelector("img.cover"), al.coverArt, COVER_SIZE_LIST);
    const play = async () => {
      try {
        await playAlbum(al.id);
        setStatus("OK.", "ok");
      } catch (e) {
        setStatus(`Error: ${String(e)}`, "bad");
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
        <div class="desc">${p.songCount ? `${p.songCount} canciones` : ""}</div>
      </div>
      <button class="cta">Reproducir</button>
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
        setStatus("OK.", "ok");
      } catch (e) {
        setStatus(`Error: ${String(e)}`, "bad");
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
    div.innerHTML = `<div class="meta"><div class="name">${escapeHtml(emptyText || "Sin resultados")}</div></div>`;
    artistsList.appendChild(div);
    return;
  }
  items.forEach((track, index) => {
    const div = document.createElement("div");
    div.className = "item";
    const stars = track.playCount ? ` · ${track.playCount} plays` : "";
    div.innerHTML = `
      <img class="cover" alt="" src="${DEFAULT_COVER}"/>
      <div class="meta">
        <div class="name">${escapeHtml(track.title || "-")}</div>
        <div class="desc">${escapeHtml(track.artist || "")}${stars}</div>
      </div>
      <button class="cta">Play</button>
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
      pauseHint.textContent = "CARGANDO";
      pauseHint.hidden = false;
    } else {
      pauseHint.textContent = "PAUSA";
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
    nowTitle.textContent = "Nada reproduciendo";
    nowSub.textContent = "-";
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
  btnSongs.textContent = state.queue.length ? `Canciones (${state.queue.length})` : "Canciones";
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
    btnShuffle.textContent = "Aleatorio ✓";
  } else {
    btnShuffle.classList.remove("primary");
    btnShuffle.textContent = "Aleatorio";
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
    renderSongsCatalog(mapped, "No hay favoritas");
  }
}

async function playFavoritesNow() {
  setQuickActionLoading("fav");
  await loadFavorites({ render: false });
  state.shuffleEnabled = true;
  setShuffleUI();
  if (!queueAndPlayTracks(state.favoriteSongs, { shuffleStart: true })) {
    setQuickActionLoading("");
    setStatus("No hay favoritas para reproducir.", "bad");
    return;
  }
  setStatus(`Favoritas: ${state.favoriteSongs.length} canciones`, "ok");
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
      setStatus(`Indexando albumes... ${allAlbums.length}`);
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
          setStatus(`Calculando mas reproducidas... ${done}/${allAlbums.length}`);
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
            renderSongsCatalog(songs, "No hay reproducciones");
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
    renderSongsCatalog(state.mostPlayedSongs, "No hay reproducciones");
  }
}

async function playMostPlayedNow() {
  setQuickActionLoading("most");
  await loadMostPlayed({ render: false });
  state.shuffleEnabled = true;
  setShuffleUI();
  if (!queueAndPlayTracks(state.mostPlayedSongs, { shuffleStart: true })) {
    setQuickActionLoading("");
    setStatus("No hay canciones en más reproducidas.", "bad");
    return;
  }
  setStatus(`Más reproducidas: ${state.mostPlayedSongs.length} canciones`, "ok");
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
  setStatus("Aleatorio: cargando 20 canciones...");
  state.shuffleEnabled = true;
  setShuffleUI();
  state.randomMode = true;
  state.queue = [];
  state.queueIndex = -1;
  try {
    await loadRandomBlock(20);
    setStatus("OK.", "ok");
  } catch (e) {
    setStatus(`Error: ${String(e)}`, "bad");
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
  btnAlbums.textContent = albums.length ? `Albumes (${albums.length})` : "Albumes";
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
  btnAlbums.textContent = albums.length ? `Albumes (${albums.length})` : "Albumes";
  openAlbumsModal();
}

function openAlbumsModal() {
  const a = state.selectedArtist;
  const g = state.selectedGenre;
  const albums = a ? state.selectedArtistAlbums : state.selectedGenreAlbums;
  if (a) albumsTitle.textContent = `Albumes · ${a.name}`;
  else if (g) albumsTitle.textContent = `Albumes · ${g.name}`;
  else albumsTitle.textContent = "Albumes";

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
      <button class="cta">Play</button>
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

  setStatus(`Cargando ${albums.length} albumes...`);
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
        setStatus(`Cargando albumes... ${done}/${total}`);
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
    setStatus("OK.", "ok");
    closeAlbumsModal();
  } catch (e) {
    setStatus(`Error: ${String(e)}`, "bad");
  } finally {
    btnPlayAllAlbums.disabled = false;
  }
}

function openSongsModal() {
  if (!state.queue || state.queue.length === 0) return;
  const current = state.queue[state.queueIndex] || null;
  songsTitle.textContent = current?.album ? `Canciones · ${current.album}` : "Canciones";
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
      <button class="cta">Play</button>
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
  whatsNewTitle.textContent = `Mejoras en ${APP_VERSION}`;
  whatsNewList.innerHTML = "";
  const sections = getWhatsNewSections(APP_VERSION);
  for (const section of sections) {
    const title = document.createElement("div");
    title.className = "whatsNewSectionTitle";
    title.textContent = section.version;
    whatsNewList.appendChild(title);

    const items = Array.isArray(section.items) && section.items.length ? section.items : ["Sin detalles."];
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
  setServerCheck("idle", "Sin comprobar");
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
  btnAlbums.textContent = "Albumes";
  btnSongs.disabled = true;
  btnSongs.textContent = "Canciones";
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
    if (!silent) setStatus("Configura el servidor primero.", "bad");
    openServerModal();
    return false;
  }
  if (!user || !password) {
    if (!silent) setStatus("Falta usuario/contraseña.", "bad");
    return false;
  }
  if (!silent) setStatus("Conectando...");
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
    const storedServer = setStoredServer(normalizedServer);
    updateServerButton(storedServer);
    setStoredCredentials({ user, pass: password }, remember);
    saveCurrentProfile(normalizedServer, user, password);
    resetPlayerState();
    await hydrateStarredIds();
    if (!silent) setStatus("OK. Conectado.", "ok");
    showScreen("player");
    setViewMode("artists");
    renderProfiles();
    return true;
  } catch (e) {
    if (!silent) setStatus(`Error: ${String(e)}`, "bad");
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
    renderSongsCatalog(state.favoriteSongsFiltered, "No hay favoritas");
  } else if (state.viewMode === "mostPlayed") {
    state.mostPlayedSongsFiltered = !q
      ? state.mostPlayedSongs
      : state.mostPlayedSongs.filter((s) => `${s.title || ""} ${s.artist || ""} ${s.album || ""}`.toLowerCase().includes(q));
    renderSongsCatalog(state.mostPlayedSongsFiltered, "No hay reproducciones");
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
      ? "Filtrar genero..."
      : mode === "albums"
        ? "Filtrar album..."
        : mode === "playlists"
          ? "Filtrar lista..."
          : "Filtrar artista...";

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
    setStatus(`Error al cambiar favorita: ${String(e)}`, "bad");
  }
}

function wireEvents() {
  nowCover.addEventListener("error", () => {
    if ((nowCover.getAttribute("src") || "").endsWith(DEFAULT_COVER)) return;
    clearNowCover();
  });

  setAppHeight();
  window.addEventListener("resize", setAppHeight);
  window.visualViewport?.addEventListener("resize", setAppHeight);
  window.visualViewport?.addEventListener("scroll", setAppHeight);

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
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Protocolo invalido");
      const normalized = normalizeServer(`${parsed.origin}${parsed.pathname}`);
      if (lastProbe.kind === "not_found" && lastProbe.url === normalizeServer(normalized)) {
        setStatus("La URL no existe (ping 404). Revisa dominio o subruta.", "bad");
        return;
      }
      const stored = setStoredServer(normalized);
      updateServerButton(stored);
      closeServerModal();
    } catch {
      setStatus("URL invalida. Ej: https://navidrome.tudominio.com", "bad");
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
        setStatus("Aleatorio: cargando 20 canciones...");
        try {
          state.randomMode = true;
          await loadRandomBlock(20);
          setStatus("OK.", "ok");
        } catch (e) {
          setStatus(`Error: ${String(e)}`, "bad");
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
      setStatus("Cargando más reproducidas...");
      await playMostPlayedNow();
    } catch (e) {
      setQuickActionLoading("");
      setStatus(`Error: ${String(e)}`, "bad");
    }
  });
  btnPlayFavorites.addEventListener("click", async () => {
    try {
      setStatus("Cargando favoritas...");
      await playFavoritesNow();
    } catch (e) {
      setQuickActionLoading("");
      setStatus(`Error: ${String(e)}`, "bad");
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
    renderProfiles();
    profilesModal.hidden = false;
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
    setStatus("Introduce credenciales del nuevo usuario.");
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
  updateServerButton(getStoredServer());

  const remember = getRememberCreds();
  setRememberCreds(remember);
  if (rememberCredsEl) rememberCredsEl.checked = remember;
  const { user, pass } = getStoredCredentials();
  if (user) userEl.value = user;
  if (pass) passEl.value = pass;

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

  checkForUpdate({ currentTag: APP_VERSION, repo: UPDATE_REPO, currentEl: verCurrent, latestEl: verLatest });
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

  if (getRememberCreds()) {
    const active = profiles.find((p) => p.id === activeId) || profiles[0];
    if (active?.server && active?.user && active?.pass) {
      setStatus("Autoconectando...");
      setTimeout(() => {
        connectWithCredentials({
          server: active.server,
          username: active.user,
          password: active.pass,
          silent: false,
        });
      }, 80);
    }
  }

  setShuffleUI();
}

wireEvents();
init();
