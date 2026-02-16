const DICT = {
  es: {
    "app.subtitle": "Skin local para Navidrome.",
    "header.whats_new": "Novedades",
    "header.hide_keyboard": "Ocultar teclado",
    "header.menu": "Menú",
    "login.access": "Acceso",
    "login.server_config": "Configurar servidor",
    "login.device": "Dispositivo",
    "login.device_auto": "Auto",
    "login.device_car": "Car Unit",
    "login.device_desktop": "Desktop",
    "login.username": "Usuario",
    "login.password": "Contraseña",
    "login.remember": "Recordar credenciales",
    "login.connect": "Conectar",
    "login.saved_users": "Usuarios",
    "login.link_other_device": "Vincular con otro dispositivo",
    "common.close": "Cerrar",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.clear": "Limpiar",
    "common.show": "Mostrar",
    "common.hide": "Ocultar",
    "common.ok": "OK.",
    "common.error": "Error: {{error}}",
    "common.play": "Reproducir",
    "common.view": "Ver",
    "common.loading": "Cargando",
    "player.tab_artists": "Artistas",
    "player.tab_genres": "Géneros",
    "player.tab_albums": "Álbumes",
    "player.tab_playlists": "Listas",
    "player.filter_artist": "Filtrar artista...",
    "player.filter_genre": "Filtrar género...",
    "player.filter_album": "Filtrar álbum...",
    "player.filter_playlist": "Filtrar lista...",
    "player.most_played": "Más reproducidas",
    "player.favorites": "Favoritas",
    "player.albums": "Álbumes",
    "player.songs": "Canciones",
    "player.shuffle": "Aleatorio",
    "player.shuffle_on": "Aleatorio ✓",
    "player.play_all": "Reproducir todo",
    "player.nothing_playing": "Nada reproduciendo",
    "player.pause": "PAUSA",
    "player.loading_cover": "CARGANDO",
    "player.mark_favorite": "Marcar favorita",
    "player.song_count": "Canciones ({{count}})",
    "player.albums_count": "Álbumes ({{count}})",
    "player.albums_of": "Álbumes · {{name}}",
    "player.empty_results": "Sin resultados",
    "player.no_favorites": "No hay favoritas",
    "player.no_plays": "No hay reproducciones",
    "player.no_favorites_play": "No hay favoritas para reproducir.",
    "player.no_most_played_play": "No hay canciones en más reproducidas.",
    "player.favorites_count": "Favoritas: {{count}} canciones",
    "player.most_played_count": "Más reproducidas: {{count}} canciones",
    "player.load_albums_artist": "Cargando álbumes: {{name}}...",
    "player.load_genre": "Cargando género: {{name}}...",
    "player.load_albums_total": "Cargando {{count}} álbumes...",
    "player.indexing_albums": "Indexando álbumes... {{count}}",
    "player.calc_most_played": "Calculando más reproducidas... {{done}}/{{total}}",
    "player.random_loading": "Aleatorio: cargando 20 canciones...",
    "player.albumes_fallback": "Álbumes",
    "player.songs_fallback": "Canciones",
    "player.plays_suffix": "plays",
    "status.auto_theme": "Modo auto: usando horario configurado.",
    "status.profile_no_password": "Ese perfil no tiene clave guardada.",
    "status.profile_retry_password": "No se pudo entrar automáticamente. Revisa la contraseña y pulsa Conectar.",
    "status.need_server": "Configura el servidor primero.",
    "status.missing_credentials": "Falta usuario/contraseña.",
    "status.connecting": "Conectando...",
    "status.connected": "OK. Conectado.",
    "status.favorite_toggle_error": "Error al cambiar favorita: {{error}}",
    "status.new_profile_credentials": "Introduce credenciales del nuevo usuario.",
    "status.autoconnecting": "Autoconectando...",
    "status.loading_most_played": "Cargando más reproducidas...",
    "status.loading_favorites": "Cargando favoritas...",
    "status.server_not_found": "La URL no existe (ping 404). Revisa dominio o subruta.",
    "status.invalid_url": "URL inválida. Ej: https://navidrome.tudominio.com",
    "status.server_checked": "Servidor configurado",
    "status.server_not_configured": "Servidor no configurado",
    "status.server_idle": "Sin comprobar",
    "status.server_url_invalid": "URL inválida",
    "status.server_missing_scheme": "Falta https://",
    "status.server_checking": "Comprobando...",
    "status.server_http_warn": "Respuesta HTTP {{code}} (no bloqueante)",
    "status.server_network_warn": "No se pudo comprobar (DNS/CORS/offline)",
    "status.server_404": "No encontrado (404). Revisa dominio o subruta",
    "status.server_not_navidrome": "Respuesta no válida (no es Navidrome/Subsonic).",
    "menu.settings": "Ajustes",
    "menu.theme": "Tema",
    "menu.theme_day": "Día",
    "menu.theme_night": "Noche",
    "menu.theme_auto": "Auto",
    "menu.theme_config": "Configurar",
    "menu.list_pane": "Panel listas",
    "menu.pane_right": "Derecha",
    "menu.pane_left": "Izquierda",
    "menu.user": "Usuario",
    "menu.switch_user": "Cambiar usuario",
    "menu.language": "Idioma",
    "modal.albums_title": "Álbumes",
    "modal.songs_title": "Canciones",
    "modal.server_title": "Servidor Navidrome",
    "modal.whatsnew_ack": "Entendido",
    "modal.profiles_title": "Perfiles",
    "modal.profile_add": "Añadir nuevo perfil",
    "modal.profile_use": "Entrar",
    "modal.auto_theme_title": "Tema automático",
    "modal.timezone": "Zona horaria",
    "modal.day": "Día",
    "modal.night": "Noche",
    "device_mode.title": "Modo de dispositivo",
    "device_mode.suggest_text":
      "Detección automática: {{suggested}}. Puedes fijarlo manualmente o seguir en modo auto.",
    "device_mode.use": "Usar {{mode}}",
    "device_mode.keep_auto": "Seguir en auto",
    "device_mode.aria_group": "Modo de dispositivo",
    "device_mode.car": "Car Unit",
    "device_mode.desktop": "Desktop",
    "misc.change": "Cambiar",
    "misc.active_profile_suffix": " · Activo",
    "whatsnew.title": "Mejoras en {{version}}",
    "whatsnew.no_details": "Sin detalles.",
    "link.modal_title": "Vincular con otro dispositivo",
    "link.modal_body": "Abre la URL e introduce el PIN para autorizar.",
    "link.code_label": "Código",
    "link.authorize": "Autorizar",
    "link.attempts_left": "Tienes 3 intentos.",
    "link.attempts_count": "Tienes {{count}} intentos.",
    "link.no_attempts": "Sin intentos. Vuelve a solicitar código.",
    "link.pending": "Esperando confirmación...",
    "link.new_code": "Generar nuevo código",
    "link.connecting": "Vinculación completada. Entrando...",
    "link.expired": "Código expirado. Genera uno nuevo.",
    "link.denied": "Autorización cancelada.",
    "link.failed_start": "No se pudo iniciar la vinculación.",
    "link.url_open_value": "Abre {{url}}",
    "link.pin_hint": "e introduce el PIN",
  },
  en: {
    "app.subtitle": "Local skin for Navidrome.",
    "header.whats_new": "What's New",
    "header.hide_keyboard": "Hide keyboard",
    "header.menu": "Menu",
    "login.access": "Login",
    "login.server_config": "Configure server",
    "login.device": "Device",
    "login.device_auto": "Auto",
    "login.device_car": "Car Unit",
    "login.device_desktop": "Desktop",
    "login.username": "Username",
    "login.password": "Password",
    "login.remember": "Remember credentials",
    "login.connect": "Connect",
    "login.saved_users": "Users",
    "login.link_other_device": "Link another device",
    "common.close": "Close",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.clear": "Clear",
    "common.show": "Show",
    "common.hide": "Hide",
    "common.ok": "OK.",
    "common.error": "Error: {{error}}",
    "common.play": "Play",
    "common.view": "View",
    "common.loading": "Loading",
    "player.tab_artists": "Artists",
    "player.tab_genres": "Genres",
    "player.tab_albums": "Albums",
    "player.tab_playlists": "Playlists",
    "player.filter_artist": "Filter artist...",
    "player.filter_genre": "Filter genre...",
    "player.filter_album": "Filter album...",
    "player.filter_playlist": "Filter playlist...",
    "player.most_played": "Most played",
    "player.favorites": "Favorites",
    "player.albums": "Albums",
    "player.songs": "Songs",
    "player.shuffle": "Shuffle",
    "player.shuffle_on": "Shuffle ✓",
    "player.play_all": "Play all",
    "player.nothing_playing": "Nothing playing",
    "player.pause": "PAUSED",
    "player.loading_cover": "LOADING",
    "player.mark_favorite": "Mark favorite",
    "player.song_count": "Songs ({{count}})",
    "player.albums_count": "Albums ({{count}})",
    "player.albums_of": "Albums · {{name}}",
    "player.empty_results": "No results",
    "player.no_favorites": "No favorites",
    "player.no_plays": "No plays",
    "player.no_favorites_play": "No favorites to play.",
    "player.no_most_played_play": "No songs in most played.",
    "player.favorites_count": "Favorites: {{count}} songs",
    "player.most_played_count": "Most played: {{count}} songs",
    "player.load_albums_artist": "Loading albums: {{name}}...",
    "player.load_genre": "Loading genre: {{name}}...",
    "player.load_albums_total": "Loading {{count}} albums...",
    "player.indexing_albums": "Indexing albums... {{count}}",
    "player.calc_most_played": "Calculating most played... {{done}}/{{total}}",
    "player.random_loading": "Shuffle: loading 20 songs...",
    "player.albumes_fallback": "Albums",
    "player.songs_fallback": "Songs",
    "player.plays_suffix": "plays",
    "status.auto_theme": "Auto mode: using configured schedule.",
    "status.profile_no_password": "This profile has no saved password.",
    "status.profile_retry_password": "Automatic sign-in failed. Check password and press Connect.",
    "status.need_server": "Configure the server first.",
    "status.missing_credentials": "Missing username/password.",
    "status.connecting": "Connecting...",
    "status.connected": "OK. Connected.",
    "status.favorite_toggle_error": "Favorite toggle error: {{error}}",
    "status.new_profile_credentials": "Enter credentials for the new user.",
    "status.autoconnecting": "Auto-connecting...",
    "status.loading_most_played": "Loading most played...",
    "status.loading_favorites": "Loading favorites...",
    "status.server_not_found": "The URL does not exist (ping 404). Check domain or subpath.",
    "status.invalid_url": "Invalid URL. Ex: https://navidrome.yourdomain.com",
    "status.server_checked": "Server configured",
    "status.server_not_configured": "Server not configured",
    "status.server_idle": "Unchecked",
    "status.server_url_invalid": "Invalid URL",
    "status.server_missing_scheme": "Missing https://",
    "status.server_checking": "Checking...",
    "status.server_http_warn": "HTTP response {{code}} (non-blocking)",
    "status.server_network_warn": "Could not verify (DNS/CORS/offline)",
    "status.server_404": "Not found (404). Check domain or subpath",
    "status.server_not_navidrome": "Invalid response (not Navidrome/Subsonic).",
    "menu.settings": "Settings",
    "menu.theme": "Theme",
    "menu.theme_day": "Day",
    "menu.theme_night": "Night",
    "menu.theme_auto": "Auto",
    "menu.theme_config": "Configure",
    "menu.list_pane": "List pane",
    "menu.pane_right": "Right",
    "menu.pane_left": "Left",
    "menu.user": "User",
    "menu.switch_user": "Switch user",
    "menu.language": "Language",
    "modal.albums_title": "Albums",
    "modal.songs_title": "Songs",
    "modal.server_title": "Navidrome Server",
    "modal.whatsnew_ack": "Got it",
    "modal.profiles_title": "Profiles",
    "modal.profile_add": "Add new profile",
    "modal.profile_use": "Sign in",
    "modal.auto_theme_title": "Auto theme",
    "modal.timezone": "Time zone",
    "modal.day": "Day",
    "modal.night": "Night",
    "device_mode.title": "Device mode",
    "device_mode.suggest_text": "Auto-detected: {{suggested}}. You can lock it manually or keep auto mode.",
    "device_mode.use": "Use {{mode}}",
    "device_mode.keep_auto": "Keep auto",
    "device_mode.aria_group": "Device mode",
    "device_mode.car": "Car Unit",
    "device_mode.desktop": "Desktop",
    "misc.change": "Switch",
    "misc.active_profile_suffix": " · Active",
    "whatsnew.title": "Improvements in {{version}}",
    "whatsnew.no_details": "No details.",
    "link.modal_title": "Link another device",
    "link.modal_body": "Open the URL and enter the PIN to authorize.",
    "link.code_label": "Code",
    "link.authorize": "Authorize",
    "link.attempts_left": "You have 3 attempts.",
    "link.attempts_count": "You have {{count}} attempts.",
    "link.no_attempts": "No attempts left. Request a new code.",
    "link.pending": "Waiting for mobile confirmation...",
    "link.new_code": "Generate new code",
    "link.connecting": "Link completed. Entering player...",
    "link.expired": "Code expired. Generate a new one.",
    "link.denied": "Authorization canceled.",
    "link.failed_start": "Could not start link flow.",
    "link.url_open_value": "Open {{url}}",
    "link.pin_hint": "and enter the PIN",
  },
};

const LANGS = new Set(["es", "en"]);

export function normalizeLanguage(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return "es";
  if (LANGS.has(raw)) return raw;
  if (raw.startsWith("en")) return "en";
  return "es";
}

export function detectPreferredLanguage() {
  try {
    return normalizeLanguage(navigator.language || navigator.userLanguage || "es");
  } catch {
    return "es";
  }
}

function interpolate(text, params) {
  const source = String(text || "");
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (!params || params[key] === undefined || params[key] === null) return "";
    return String(params[key]);
  });
}

function getMessage(lang, key) {
  return DICT[lang]?.[key] ?? DICT.es[key] ?? key;
}

export function applyI18nToDom(root, t) {
  if (!root || typeof root.querySelectorAll !== "function") return;
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    el.setAttribute("placeholder", t(key));
  });
  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    el.setAttribute("title", t(key));
  });
  root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });
}

export function createI18n(initialLanguage) {
  let language = normalizeLanguage(initialLanguage);
  return {
    t(key, params) {
      return interpolate(getMessage(language, key), params);
    },
    getLanguage() {
      return language;
    },
    setLanguage(nextLanguage) {
      language = normalizeLanguage(nextLanguage);
      return language;
    },
    apply(root = document) {
      applyI18nToDom(root, (key, params) => this.t(key, params));
    },
  };
}
