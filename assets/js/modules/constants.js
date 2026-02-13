export const STORAGE_KEYS = {
  server: "carplayer.navidrome.server",
  user: "carplayer.navidrome.user",
  pass: "carplayer.navidrome.pass",
  theme: "carplayer.navidrome.theme",
  themeMode: "carplayer.navidrome.themeMode",
  autoTheme: "carplayer.navidrome.autoTheme",
  quality: "carplayer.navidrome.quality",
  listPaneSide: "carplayer.navidrome.listPaneSide",
  rememberCreds: "carplayer.navidrome.rememberCreds",
  whatsNewSeen: "carplayer.navidrome.whatsNewSeen",
  profiles: "carplayer.navidrome.profiles",
  activeProfileId: "carplayer.navidrome.activeProfileId",
};

export const DEFAULTS = {
  listPaneSide: "right",
  rememberCreds: false,
  quality: "low",
  themeMode: "auto",
  autoTheme: {
    timeZone: "UTC",
    dayStart: "07:00",
    nightStart: "19:00",
    cityKey: "",
    lat: null,
    lon: null,
  },
};
