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
} from "./modules/storage.js";
import { checkForUpdate, escapeHtml } from "./modules/ui.js";
import { coverUrl, getStarred2, makeAuth, restJson, scrobble, star, streamUrl, unstar } from "./modules/navidrome.js";
import { formatTime, mapSongsToQueue, toTrack } from "./modules/player.js";
import { getWhatsNewForVersion, getWhatsNewSections } from "./modules/whats-new.js";

const DEFAULT_COVER = "./assets/img/music-player.svg";
const COVER_SIZE_LIST = 96;
const COVER_SIZE_NOW = 320;
const MOST_PLAYED_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const TIMEZONE_REFERENCE_CITIES = {
  "Atlantic/Canary": { key: "las_palmas", label: "Las Palmas", lat: 28.1235, lon: -15.4363 },
  "Europe/Madrid": { key: "madrid", label: "Madrid", lat: 40.4168, lon: -3.7038 },
  "Europe/London": { key: "london", label: "London", lat: 51.5074, lon: -0.1278 },
  "Europe/Paris": { key: "paris", label: "Paris", lat: 48.8566, lon: 2.3522 },
  "Europe/Berlin": { key: "berlin", label: "Berlin", lat: 52.52, lon: 13.405 },
  "America/New_York": { key: "new_york", label: "New York", lat: 40.7128, lon: -74.006 },
  "America/Chicago": { key: "chicago", label: "Chicago", lat: 41.8781, lon: -87.6298 },
  "America/Denver": { key: "denver", label: "Denver", lat: 39.7392, lon: -104.9903 },
  "America/Los_Angeles": { key: "los_angeles", label: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  "America/Mexico_City": { key: "mexico_city", label: "Mexico City", lat: 19.4326, lon: -99.1332 },
  "America/Sao_Paulo": { key: "sao_paulo", label: "Sao Paulo", lat: -23.5505, lon: -46.6333 },
  "America/Buenos_Aires": { key: "buenos_aires", label: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
  "Asia/Tokyo": { key: "tokyo", label: "Tokyo", lat: 35.6762, lon: 139.6503 },
  "Asia/Seoul": { key: "seoul", label: "Seoul", lat: 37.5665, lon: 126.978 },
  "Asia/Shanghai": { key: "shanghai", label: "Shanghai", lat: 31.2304, lon: 121.4737 },
  "Asia/Singapore": { key: "singapore", label: "Singapore", lat: 1.3521, lon: 103.8198 },
  "Asia/Kolkata": { key: "new_delhi", label: "New Delhi", lat: 28.6139, lon: 77.209 },
  "Australia/Sydney": { key: "sydney", label: "Sydney", lat: -33.8688, lon: 151.2093 },
  "Pacific/Auckland": { key: "auckland", label: "Auckland", lat: -36.8509, lon: 174.7645 },
};

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
const btnViewFavorites = document.getElementById("btnViewFavorites");
const btnViewMostPlayed = document.getElementById("btnViewMostPlayed");
const artistFilter = document.getElementById("artistFilter");
const artistsList = document.getElementById("artistsList");
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
const autoThemeCity = document.getElementById("autoThemeCity");
const autoThemeDayStart = document.getElementById("autoThemeDayStart");
const autoThemeNightStart = document.getElementById("autoThemeNightStart");
const btnAutoThemeCancel = document.getElementById("btnAutoThemeCancel");
const btnAutoThemeSave = document.getElementById("btnAutoThemeSave");

let filterTimer = null;
let autoThemeTimer = null;
let sunriseCache = { key: "", sunrise: null, sunset: null };
let serverProbeTimer = null;
let lastProbe = { url: "", state: "idle", kind: "idle" };

let state = {
  server: getStoredServer(),
  auth: null,
  user: "",
  artists: [],
  artistsFiltered: [],
  selectedArtist: null,
  selectedArtistAlbums: [],
  artistAlbumsById: {},
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
  themeAutoHint.textContent = `Auto: ${autoCfg.timeZone || "sin zona"}${autoCfg.cityKey ? ` · ${autoCfg.cityKey}` : " · horario fijo"}`;
}

function getTimeZonesList() {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      const values = Intl.supportedValuesOf("timeZone");
      if (Array.isArray(values) && values.length) return values;
    } catch {
      // ignore
    }
  }
  return [
    "UTC",
    "Atlantic/Canary",
    "Europe/Madrid",
    "Europe/London",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
}

function parseTimeToMinutes(value, fallback) {
  const raw = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(raw)) return fallback;
  const [h, m] = raw.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return fallback;
  return h * 60 + m;
}

function getDateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
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

async function getSunriseSunset({ lat, lon, timeZone }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !timeZone) return null;
  const dateStr = getDateInTimeZone(new Date(), timeZone);
  const key = `${lat}:${lon}:${dateStr}`;
  if (sunriseCache.key === key && sunriseCache.sunrise && sunriseCache.sunset) {
    return { sunrise: sunriseCache.sunrise, sunset: sunriseCache.sunset };
  }
  try {
    const query = new URLSearchParams({ lat: String(lat), lng: String(lon), date: dateStr, formatted: "0" });
    const response = await fetch(`https://api.sunrise-sunset.org/json?${query.toString()}`);
    if (!response.ok) return null;
    const json = await response.json();
    if (!json?.results?.sunrise || !json?.results?.sunset) return null;
    const sunrise = new Date(json.results.sunrise);
    const sunset = new Date(json.results.sunset);
    if (!Number.isFinite(sunrise.getTime()) || !Number.isFinite(sunset.getTime())) return null;
    sunriseCache = { key, sunrise, sunset };
    return { sunrise, sunset };
  } catch {
    return null;
  }
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

  if (Number.isFinite(cfg.lat) && Number.isFinite(cfg.lon)) {
    const sun = await getSunriseSunset({ lat: cfg.lat, lon: cfg.lon, timeZone: tz });
    if (sun) {
      const now = Date.now();
      applyTheme(now >= sun.sunrise.getTime() && now < sun.sunset.getTime() ? "light" : "dark");
      syncThemeButtons();
      return;
    }
  }

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
  btnPaneSide.textContent = side === "right" ? "Listas: Der" : "Listas: Izq";
}

function showScreen(which) {
  const isLogin = which === "login";
  screenLogin.hidden = !isLogin;
  screenPlayer.hidden = isLogin;
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
    const imgSrc = a.coverArt ? coverUrl(state.server, state.auth, a.coverArt, COVER_SIZE_LIST) : DEFAULT_COVER;
    div.innerHTML = `
      <img class="cover" alt="" src="${imgSrc}"/>
      <div class="meta">
        <div class="name">${escapeHtml(a.name || "-")}</div>
      </div>
      <button class="cta">Ver</button>
    `;
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
    const imgSrc = g.coverArt ? coverUrl(state.server, state.auth, g.coverArt, COVER_SIZE_LIST) : DEFAULT_COVER;
    const name = g.value || g.name || "-";
    const count = g.albumCount || g.songCount || 0;
    div.innerHTML = `
      <img class="cover" alt="" src="${imgSrc}"/>
      <div class="meta">
        <div class="name">${escapeHtml(name)}</div>
        <div class="desc">${count ? `${count} ${g.albumCount ? "albumes" : "canciones"}` : ""}</div>
      </div>
      <button class="cta">Ver</button>
    `;
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
    const imgSrc = al.coverArt ? coverUrl(state.server, state.auth, al.coverArt, COVER_SIZE_LIST) : DEFAULT_COVER;
    div.innerHTML = `
      <img class="cover" alt="" src="${imgSrc}"/>
      <div class="meta">
        <div class="name">${escapeHtml(al.name || "-")}</div>
        <div class="desc">${escapeHtml(al.artist || "")}</div>
      </div>
      <button class="cta">Reproducir</button>
    `;
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
    const imgSrc = p.coverArt ? coverUrl(state.server, state.auth, p.coverArt, COVER_SIZE_LIST) : DEFAULT_COVER;
    div.innerHTML = `
      <img class="cover" alt="" src="${imgSrc}"/>
      <div class="meta">
        <div class="name">${escapeHtml(p.name || "-")}</div>
        <div class="desc">${p.songCount ? `${p.songCount} canciones` : ""}</div>
      </div>
      <button class="cta">Reproducir</button>
    `;
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
    const imgSrc = track.coverArt ? coverUrl(state.server, state.auth, track.coverArt, COVER_SIZE_LIST) : DEFAULT_COVER;
    const stars = track.playCount ? ` · ${track.playCount} plays` : "";
    div.innerHTML = `
      <img class="cover" alt="" src="${imgSrc}"/>
      <div class="meta">
        <div class="name">${escapeHtml(track.title || "-")}</div>
        <div class="desc">${escapeHtml(track.artist || "")}${stars}</div>
      </div>
      <button class="cta">Play</button>
    `;
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
    pauseHint.hidden = !(hasTrack && player.paused && !player.ended);
  }
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }
}

function updateFavoriteButton(track) {
  if (!track || !track.id) {
    btnFavoriteSong.classList.remove("active");
    btnFavoriteSong.textContent = "♡ Favorita";
    return;
  }
  const isStarred = state.starredIds.has(track.id) || !!track.starred;
  btnFavoriteSong.classList.toggle("active", isStarred);
  btnFavoriteSong.textContent = isStarred ? "❤ Favorita" : "♡ Favorita";
}

function setNow(track) {
  if (!track) {
    nowTitle.textContent = "Nada reproduciendo";
    nowSub.textContent = "-";
    nowCover.src = DEFAULT_COVER;
    nowBg.style.opacity = "0";
    nowBg.style.removeProperty("--cover-url");
    updateFavoriteButton(null);
    return;
  }
  nowTitle.textContent = track.title || "-";
  nowSub.textContent = `${track.artist || ""}${track.album ? " · " + track.album : ""}`;
  const coverId = track.coverArt || track.albumId || null;
  state.lastCoverId = coverId;
  if (coverId) {
    const coverSrc = coverUrl(state.server, state.auth, coverId, COVER_SIZE_NOW);
    nowCover.src = coverSrc;
    nowBg.style.setProperty("--cover-url", `url("${coverSrc}")`);
    nowBg.style.opacity = "1";
  } else {
    nowCover.src = DEFAULT_COVER;
    nowBg.style.opacity = "0";
    nowBg.style.removeProperty("--cover-url");
  }
  updateFavoriteButton(track);

  if ("mediaSession" in navigator) {
    const art = coverId ? coverUrl(state.server, state.auth, coverId, COVER_SIZE_NOW) : null;
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

async function loadFavorites() {
  const sub = await getStarred2(state.server, state.auth);
  const songs = sub.starred2?.song || [];
  const mapped = markSongsStarred(mapSongsToQueue(songs));
  state.favoriteSongs = mapped;
  state.favoriteSongsFiltered = mapped;
  renderSongsCatalog(mapped, "No hay favoritas");
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

async function loadMostPlayed() {
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
          renderSongsCatalog(songs, "No hay reproducciones");
          return;
        }
      } catch {
        // ignore
      }
    }
  }

  await buildMostPlayedFromServer();
  renderSongsCatalog(state.mostPlayedSongs, "No hay reproducciones");
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
    const imgSrc = al.coverArt ? coverUrl(state.server, state.auth, al.coverArt, COVER_SIZE_LIST) : DEFAULT_COVER;
    div.innerHTML = `
      <img class="cover" alt="" src="${imgSrc}"/>
      <div class="meta">
        <div class="name">${escapeHtml(al.name || "-")}</div>
        <div class="desc">${escapeHtml(a?.name || "")}</div>
      </div>
      <button class="cta">Play</button>
    `;
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
  autoThemeTimezone.value = zones.includes(cfg.timeZone) ? cfg.timeZone : "UTC";
  refreshAutoThemeCityOptions(autoThemeTimezone.value, cfg.cityKey);
  autoThemeDayStart.value = cfg.dayStart || "07:00";
  autoThemeNightStart.value = cfg.nightStart || "19:00";
}

function refreshAutoThemeCityOptions(timeZone, selectedKey) {
  autoThemeCity.innerHTML = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Sin ciudad (usar horario)";
  autoThemeCity.appendChild(none);

  const ref = TIMEZONE_REFERENCE_CITIES[timeZone];
  if (ref) {
    const option = document.createElement("option");
    option.value = ref.key;
    option.textContent = ref.label;
    autoThemeCity.appendChild(option);
  }

  if (selectedKey) autoThemeCity.value = selectedKey;
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
  state.queue = [];
  state.queueIndex = -1;
  state.selectedArtist = null;
  state.selectedArtistAlbums = [];
  state.artistAlbumsById = {};
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
  btnViewFavorites.classList.toggle("active", mode === "favorites");
  btnViewMostPlayed.classList.toggle("active", mode === "mostPlayed");
  artistFilter.value = "";
  artistFilter.placeholder =
    mode === "genres"
      ? "Filtrar genero..."
      : mode === "albums"
        ? "Filtrar album..."
        : mode === "playlists"
          ? "Filtrar lista..."
          : mode === "favorites" || mode === "mostPlayed"
            ? "Filtrar cancion..."
            : "Filtrar artista...";

  if (mode === "genres") {
    await loadGenres();
  } else if (mode === "albums") {
    await loadAlbums();
  } else if (mode === "playlists") {
    await loadPlaylists();
  } else if (mode === "favorites") {
    await loadFavorites();
  } else if (mode === "mostPlayed") {
    await loadMostPlayed();
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
  player.addEventListener("play", updatePlayPauseUI);
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
  btnViewFavorites.addEventListener("click", () => setViewMode("favorites").catch((e) => setStatus(String(e), "bad")));
  btnViewMostPlayed.addEventListener("click", () => setViewMode("mostPlayed").catch((e) => setStatus(String(e), "bad")));

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

  autoThemeTimezone.addEventListener("change", () => {
    refreshAutoThemeCityOptions(autoThemeTimezone.value, "");
  });
  btnAutoThemeCancel.addEventListener("click", () => closeAutoThemeModal());
  btnAutoThemeSave.addEventListener("click", () => {
    const tz = autoThemeTimezone.value || "UTC";
    const cityKey = autoThemeCity.value || "";
    const ref = TIMEZONE_REFERENCE_CITIES[tz];
    const settings = {
      timeZone: tz,
      cityKey,
      lat: cityKey && ref && ref.key === cityKey ? ref.lat : null,
      lon: cityKey && ref && ref.key === cityKey ? ref.lon : null,
      dayStart: autoThemeDayStart.value || "07:00",
      nightStart: autoThemeNightStart.value || "19:00",
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
