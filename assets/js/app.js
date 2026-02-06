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
} from "./modules/storage.js";
import { checkForUpdate, escapeHtml } from "./modules/ui.js";
import { coverUrl, makeAuth, restJson, streamUrl } from "./modules/navidrome.js";
import { formatTime, mapSongsToQueue, toTrack } from "./modules/player.js";
import { getWhatsNewForVersion } from "./modules/whats-new.js";

const statusEl = document.getElementById("status");
      const btnEditServer = document.getElementById("btnEditServer");
      const themeToggle = document.getElementById("themeToggle");
      const btnWhatsNew = document.getElementById("btnWhatsNew");
      const verCurrent = document.getElementById("verCurrent");
      const verLatest = document.getElementById("verLatest");
      const APP_VERSION = document.querySelector('meta[name="app-version"]')?.content || "dev";
      const UPDATE_REPO = document.querySelector('meta[name="update-repo"]')?.content || "";
      const serverModal = document.getElementById("serverModal");
      const serverUrlInput = document.getElementById("serverUrlInput");
      const btnServerCancel = document.getElementById("btnServerCancel");
      const btnServerSave = document.getElementById("btnServerSave");
      const userEl = document.getElementById("username");
      const passEl = document.getElementById("password");
      const rememberCredsEl = document.getElementById("rememberCreds");
      const btnConnect = document.getElementById("btnConnect");

      const nowCover = document.getElementById("nowCover");
      const DEFAULT_COVER = "./assets/img/music-player.svg";
      const nowBg = document.getElementById("nowBg");
      const nowTitle = document.getElementById("nowTitle");
      const nowSub = document.getElementById("nowSub");
      const player = document.getElementById("player");
      const btnShuffle = document.getElementById("btnShuffle");
      const btnPrev = document.getElementById("btnPrev");
      const btnPlayPause = document.getElementById("btnPlayPause");
      const btnNext = document.getElementById("btnNext");
      const btnPlayAll = document.getElementById("btnPlayAll");

      const screenLogin = document.getElementById("screenLogin");

      const screenPlayer = document.getElementById("screenPlayer");
      const btnLogout = document.getElementById("btnLogout");
      const btnClearArtists = document.getElementById("btnClearArtists");
      const btnViewArtists = document.getElementById("btnViewArtists");
      const btnViewGenres = document.getElementById("btnViewGenres");
      const btnViewAlbums = document.getElementById("btnViewAlbums");
      const btnViewPlaylists = document.getElementById("btnViewPlaylists");
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


      function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.className = "status" + (kind ? ` ${kind}` : "");
      }

      function applyTheme(mode) {
        const html = document.documentElement;
        html.classList.remove("theme-dark", "theme-light");
        if (mode === "dark") {
          html.classList.add("theme-dark");
          themeToggle.textContent = "☾";
        } else {
          html.classList.add("theme-light");
          themeToggle.textContent = "☀︎";
        }
        setTheme(mode);
      }

      (function initTheme() {
        const saved = getTheme();
        if (saved) {
          applyTheme(saved);
          return;
        }
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(prefersDark ? "dark" : "light");
      })();

      themeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.contains("theme-dark");
        applyTheme(isDark ? "light" : "dark");
      });

      // Ajuste de altura real disponible (barra de direcciones + teclado en Android).
      function setAppHeight() {
        const h = window.visualViewport?.height || window.innerHeight;
        document.documentElement.style.setProperty("--app-height", `${Math.round(h)}px`);
      }
      setAppHeight();
      window.addEventListener("resize", setAppHeight);
      window.visualViewport?.addEventListener("resize", setAppHeight);
      window.visualViewport?.addEventListener("scroll", setAppHeight);

      function updateServerButton(server) {
        const normalized = normalizeServer(server || "");
        const ok = !!normalized;
        btnEditServer.classList.toggle("ok", ok);
        btnEditServer.textContent = ok ? "Servidor configurado" : "Servidor no configurado";
      }

      function openServerModal() {
        serverUrlInput.value = getStoredServer();
        serverModal.hidden = false;
        setTimeout(() => {
          setAppHeight();
          serverUrlInput.focus();
        }, 0);
      }

      function closeServerModal() {
        serverModal.hidden = true;
      }

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
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Protocolo inválido");
          const normalized = setStoredServer(normalizeServer(`${parsed.origin}${parsed.pathname}`));
          updateServerButton(normalized);
          closeServerModal();
        } catch {
          setStatus("URL inválida. Ej: https://navidrome.tudominio.com", "bad");
        }
      });
      serverUrlInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        btnServerSave.click();
      });
      serverModal.addEventListener("click", (event) => {
        if (event.target === serverModal) closeServerModal();
      });

      function applyListPaneSide(side) {
        if (!playerGrid || !btnPaneSide) return;
        playerGrid.dataset.listPane = side;
        btnPaneSide.textContent = side === "right" ? "Listas: Der" : "Listas: Izq";
      }

      (function initListPaneSide() {
        const side = getListPaneSide();
        applyListPaneSide(side);
      })();

      btnPaneSide?.addEventListener("click", () => {
        const current = playerGrid?.dataset.listPane === "right" ? "right" : "left";
        const next = setListPaneSide(current === "left" ? "right" : "left");
        applyListPaneSide(next);
      });

      function showScreen(which) {
        const isLogin = which === "login";
        screenLogin.hidden = !isLogin;
        screenPlayer.hidden = isLogin;
        btnLogout.style.display = isLogin ? "none" : "inline-flex";
      }

      let state = {
        server: getStoredServer(),
        auth: null,
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
        viewMode: "artists",
        queue: [],
        queueIndex: -1,
        lastCoverId: null,
        shuffleEnabled: false,
        randomMode: false,
        randomLoading: false,
        randomPrefetchAt: 0,
      };

      function renderArtists(list) {
        artistsList.innerHTML = "";
        const items = list || [];
        for (const a of items) {
          const div = document.createElement("div");
          div.className = "item";
          const imgSrc = a.coverArt ? coverUrl(state.server, state.auth, a.coverArt, 128) : DEFAULT_COVER;
          div.innerHTML = `
            <img class="cover" alt="" src="${imgSrc}"/>
            <div class="meta">
              <div class="name">${escapeHtml(a.name || "—")}</div>
            </div>
            <button class="cta">Ver</button>
          `;
          const open = async () => {
            try {
              setStatus(`Cargando álbumes: ${a.name}…`);
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
        const items = list || [];
        for (const g of items) {
          const div = document.createElement("div");
          div.className = "item";
          const imgSrc = g.coverArt ? coverUrl(state.server, state.auth, g.coverArt, 128) : DEFAULT_COVER;
          const name = g.value || g.name || "—";
          const count = g.albumCount || g.songCount || 0;
          div.innerHTML = `
            <img class="cover" alt="" src="${imgSrc}"/>
            <div class="meta">
              <div class="name">${escapeHtml(name)}</div>
              <div class="desc">${count ? `${count} ${g.albumCount ? "álbumes" : "canciones"}` : ""}</div>
            </div>
            <button class="cta">Ver</button>
          `;
          const open = async () => {
            try {
              setStatus(`Cargando género: ${name}…`);
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
        const items = list || [];
        for (const al of items) {
          const div = document.createElement("div");
          div.className = "item";
          const imgSrc = al.coverArt ? coverUrl(state.server, state.auth, al.coverArt, 128) : DEFAULT_COVER;
          div.innerHTML = `
            <img class="cover" alt="" src="${imgSrc}"/>
            <div class="meta">
              <div class="name">${escapeHtml(al.name || "—")}</div>
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
        const items = list || [];
        for (const p of items) {
          const div = document.createElement("div");
          div.className = "item";
          const imgSrc = p.coverArt ? coverUrl(state.server, state.auth, p.coverArt, 128) : DEFAULT_COVER;
          div.innerHTML = `
            <img class="cover" alt="" src="${imgSrc}"/>
            <div class="meta">
              <div class="name">${escapeHtml(p.name || "—")}</div>
              <div class="desc">${p.songCount ? `${p.songCount} canciones` : ""}</div>
            </div>
            <button class="cta">Reproducir</button>
          `;
          const play = async () => {
            try {
              const sub = await restJson(state.server, state.auth, "getPlaylist", { id: p.id });
              const entries = sub.playlist?.entry || [];
              state.queue = mapSongsToQueue(entries);
              state.queueIndex = 0;
              btnSongs.disabled = state.queue.length === 0;
              btnSongs.textContent = state.queue.length ? `Canciones (${state.queue.length})` : "Canciones";
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

      function setBar(el, ratio) {
        const r = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
        el.style.transform = `scaleX(${r})`;
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
          if (b && b.length) {
            buf = b.end(b.length - 1);
          }
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
      }

      function updatePlayPauseUI() {
        const playing = !player.paused && !player.ended;
        btnPlayPause.classList.toggle("playing", playing);
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = playing ? "playing" : "paused";
        }
      }

      function setNow(track) {
        if (!track) {
          nowTitle.textContent = "Nada reproduciendo";
          nowSub.textContent = "—";
          nowCover.src = DEFAULT_COVER;
          nowBg.style.opacity = "0";
          nowBg.style.removeProperty("--cover-url");
          return;
        }
        nowTitle.textContent = track.title || "—";
        nowSub.textContent = `${track.artist || ""}${track.album ? " · " + track.album : ""}`;
        const coverId = track.coverArt || track.albumId || null;
        state.lastCoverId = coverId;
        if (coverId) {
          const coverSrc = coverUrl(state.server, state.auth, coverId, 600);
          nowCover.src = coverSrc;
          nowBg.style.setProperty("--cover-url", `url("${coverSrc}")`);
          nowBg.style.opacity = "1";
        } else {
          nowCover.src = DEFAULT_COVER;
          nowBg.style.opacity = "0";
          nowBg.style.removeProperty("--cover-url");
        }

        if ("mediaSession" in navigator) {
          const art = coverId ? coverUrl(state.server, state.auth, coverId, 512) : null;
          try {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: track.title || "",
              artist: track.artist || "",
              album: track.album || "",
              artwork: art
                ? [
                    { src: art, sizes: "512x512", type: "image/jpeg" },
                    { src: art, sizes: "256x256", type: "image/jpeg" },
                  ]
                : [],
            });
          } catch {
            // ignore
          }
        }
      }

      function playIndex(idx) {
        if (idx < 0 || idx >= state.queue.length) return;
        state.queueIndex = idx;
        const track = state.queue[idx];
        setNow(track);
	        renderSongMenu();
	        maybePrefetchRandom();
	        const url = streamUrl(state.server, state.auth, track.id);
	        (async () => {
	          player.src = url;
	          try {
	            await player.play();
	          } catch {
	            // ignore (autoplay restrictions)
          }
        })();
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
        tNow.textContent = fmtTime(dur * v);
      });
      seekEl.addEventListener("change", () => {
        const dur = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 0;
        if (!dur) return;
        const v = Number(seekEl.value) / 1000;
        player.currentTime = dur * v;
        updateProgress();
      });

      btnPrev.addEventListener("click", () => playNext(-1));
      btnNext.addEventListener("click", () => playNext(1));
      btnPlayPause.addEventListener("click", async () => {
        if (player.paused) {
          try {
            await player.play();
          } catch {}
        } else {
          player.pause();
        }
        updatePlayPauseUI();
      });

      btnPlayAll.addEventListener("click", async () => {
        await playAllRandom();
      });

      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", async () => {
            try {
              await player.play();
            } catch {}
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
          navigator.mediaSession.setActionHandler("seekbackward", (details) => {
            const delta = details && Number.isFinite(details.seekOffset) ? details.seekOffset : 10;
            player.currentTime = Math.max(0, player.currentTime - delta);
            updateProgress();
          });
          navigator.mediaSession.setActionHandler("seekforward", (details) => {
            const delta = details && Number.isFinite(details.seekOffset) ? details.seekOffset : 10;
            player.currentTime = Math.min(player.duration || player.currentTime + delta, player.currentTime + delta);
            updateProgress();
          });
        } catch {
          // ignore
        }
      }

      async function loadRandomBlock(count = 20) {
        const sub = await restJson(state.server, state.auth, "getRandomSongs", { size: count });
        const songs = sub.randomSongs?.song || [];
        const mapped = mapSongsToQueue(songs);
        if (state.queue.length === 0) {
          state.queue = mapped;
          state.queueIndex = 0;
          btnSongs.disabled = state.queue.length === 0;
          btnSongs.textContent = state.queue.length ? `Canciones (${state.queue.length})` : "Canciones";
          state.randomPrefetchAt = state.queue.length;
          if (state.queue.length) playIndex(0);
        } else {
          state.queue = state.queue.concat(mapped);
          btnSongs.disabled = state.queue.length === 0;
          btnSongs.textContent = state.queue.length ? `Canciones (${state.queue.length})` : "Canciones";
          state.randomPrefetchAt = state.queue.length;
        }
      }

      async function maybePrefetchRandom() {
        if (!state.shuffleEnabled || !state.randomMode) return;
        if (state.randomLoading) return;
        if (state.queue.length === 0) return;
        const remaining = state.queue.length - 1 - state.queueIndex;
        if (remaining > 5) return; // antes de la 15ª si tenemos bloques de 20
        if (state.randomPrefetchAt && state.queue.length < state.randomPrefetchAt) return;
        state.randomLoading = true;
        try {
          await loadRandomBlock(20);
        } catch (e) {
          // silencioso: si falla, intentará en el siguiente avance
        } finally {
          state.randomLoading = false;
        }
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

      btnShuffle.addEventListener("click", async () => {
        state.shuffleEnabled = !state.shuffleEnabled;
        setShuffleUI();
        if (state.shuffleEnabled) {
          if (state.queue.length > 0) {
            shuffleQueue(true);
            state.randomMode = false;
          } else {
            setStatus("Aleatorio: cargando 20 canciones…");
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
        state.queue = mapSongsToQueue(songs);
        state.queueIndex = 0;
        btnSongs.disabled = state.queue.length === 0;
        btnSongs.textContent = state.queue.length ? `Canciones (${state.queue.length})` : "Canciones";
        state.randomMode = false;
        renderSongMenu();
        if (state.shuffleEnabled) shuffleQueue(true);
        playIndex(0);
      }

      async function playAllRandom() {
        setStatus("Aleatorio: cargando 20 canciones…");
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
        btnAlbums.textContent = albums.length ? `Álbumes (${albums.length})` : "Álbumes";
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
        btnAlbums.textContent = albums.length ? `Álbumes (${albums.length})` : "Álbumes";
        openAlbumsModal();
      }

      function openAlbumsModal() {
        const a = state.selectedArtist;
        const g = state.selectedGenre;
        const albums = a ? state.selectedArtistAlbums : state.selectedGenreAlbums;
        if (a) {
          albumsTitle.textContent = `Álbumes · ${a.name}`;
        } else if (g) {
          albumsTitle.textContent = `Álbumes · ${g.name}`;
        } else {
          albumsTitle.textContent = "Álbumes";
        }
        albumsList.innerHTML = "";
        btnPlayAllAlbums.disabled = albums.length === 0;
        for (const al of albums) {
          const div = document.createElement("div");
          div.className = "item";
          const imgSrc = al.coverArt ? coverUrl(state.server, state.auth, al.coverArt, 128) : DEFAULT_COVER;
          div.innerHTML = `
            <img class="cover" alt="" src="${imgSrc}"/>
            <div class="meta">
              <div class="name">${escapeHtml(al.name || "—")}</div>
              <div class="desc">${escapeHtml(a?.name || "")}</div>
            </div>
            <button class="cta">Play</button>
          `;
          div.querySelector("button").addEventListener("click", async (e) => {
            e.stopPropagation();
            try {
              await playAlbum(al.id);
              closeAlbumsModal();
            } catch (err) {
              setStatus(`Error: ${String(err)}`, "bad");
            }
          });
          div.addEventListener("click", async () => {
            try {
              await playAlbum(al.id);
              closeAlbumsModal();
            } catch (err) {
              setStatus(`Error: ${String(err)}`, "bad");
            }
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
        const cacheKey = state.selectedArtist ? `artist:${state.selectedArtist.id}` : state.selectedGenre ? `genre:${state.selectedGenre.name}` : null;
        const cached = cacheKey ? state.artistSongsById[cacheKey] : null;
        if (Array.isArray(cached) && cached.length) {
          state.queue = cached;
          state.queueIndex = 0;
          btnSongs.disabled = state.queue.length === 0;
          btnSongs.textContent = state.queue.length ? `Canciones (${state.queue.length})` : "Canciones";
          state.randomMode = false;
          renderSongMenu();
          if (state.shuffleEnabled) shuffleQueue(true);
          if (state.queue.length) playIndex(0);
          closeAlbumsModal();
          return;
        }

        setStatus(`Cargando ${albums.length} álbumes…`);
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
              for (const s of songs) {
                allSongs.push(toTrack(s));
              }
              done++;
              setStatus(`Cargando álbumes… ${done}/${total}`);
            }
          }

          const workers = Array.from({ length: concurrency }, () => worker());
          await Promise.all(workers);

          if (cacheKey) state.artistSongsById[cacheKey] = allSongs.slice();

          state.queue = allSongs;
          state.queueIndex = 0;
          btnSongs.disabled = state.queue.length === 0;
          btnSongs.textContent = state.queue.length ? `Canciones (${state.queue.length})` : "Canciones";
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
        state.queue.forEach((t, idx) => {
          const div = document.createElement("div");
          div.className = "item";
          const active = idx === state.queueIndex;
          div.innerHTML = `
            <div class="cover" style="display:grid;place-items:center;font-weight:900">${active ? "▶" : String(idx + 1)}</div>
            <div class="meta">
              <div class="name">${escapeHtml(t.title || "—")}</div>
              <div class="desc">${escapeHtml(t.artist || "")}</div>
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
          songsList.appendChild(div);
        });
        songsModal.hidden = false;
      }

      function closeSongsModal() {
        songsModal.hidden = true;
      }

      btnAlbums.addEventListener("click", () => {
        if (btnAlbums.disabled) return;
        openAlbumsModal();
      });
      btnPlayAllAlbums.addEventListener("click", () => playAllAlbums());
      btnCloseAlbums.addEventListener("click", () => closeAlbumsModal());
      albumsModal.addEventListener("click", (e) => {
        if (e.target === albumsModal) closeAlbumsModal();
      });

      btnSongs.addEventListener("click", () => {
        if (btnSongs.disabled) return;
        openSongsModal();
      });
      btnCloseSongs.addEventListener("click", () => closeSongsModal());
      songsModal.addEventListener("click", (e) => {
        if (e.target === songsModal) closeSongsModal();
      });

      function closeWhatsNewModal(markSeen = true) {
        if (markSeen) setWhatsNewSeenVersion(APP_VERSION);
        whatsNewModal.hidden = true;
      }

      function openWhatsNewModal() {
        const items = getWhatsNewForVersion(APP_VERSION);
        whatsNewTitle.textContent = `Mejoras en ${APP_VERSION}`;
        whatsNewList.innerHTML = "";
        const list = items.length ? items : ["No hay novedades registradas para esta version."];
        for (const item of list) {
          const row = document.createElement("div");
          row.className = "whatsNewItem";
          row.textContent = item;
          whatsNewList.appendChild(row);
        }
        whatsNewModal.hidden = false;
      }

      btnWhatsNew?.addEventListener("click", () => openWhatsNewModal());
      btnCloseWhatsNew?.addEventListener("click", () => closeWhatsNewModal(true));
      whatsNewModal?.addEventListener("click", (event) => {
        if (event.target === whatsNewModal) closeWhatsNewModal(true);
      });

      async function connect() {
        const server = getStoredServer();
        const username = (userEl.value || "").trim();
        const password = passEl.value || "";
        if (!server) {
          setStatus("Configura el servidor primero.", "bad");
          openServerModal();
          return;
        }
        if (!username || !password) {
          setStatus("Falta usuario/contraseña.", "bad");
          return;
        }
        setStatus("Conectando…");
        btnConnect.disabled = true;

        const auth = makeAuth(username, password);
        try {
          await restJson(server, auth, "ping", {});
          state.server = server;
          state.auth = auth;
          const remember = !!rememberCredsEl?.checked;
          setRememberCreds(remember);
          const normalized = setStoredServer(server);
          updateServerButton(normalized);
          setStoredCredentials({ user: username, pass: password }, remember);
          setStatus("OK. Conectado.", "ok");
          showScreen("player");
          setViewMode("artists");
        } catch (e) {
          setStatus(`Error: ${String(e)}`, "bad");
        } finally {
          btnConnect.disabled = false;
        }
      }

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

      (function prefill() {
        updateServerButton(getStoredServer());
        const remember = getRememberCreds();
        setRememberCreds(remember);
        if (rememberCredsEl) rememberCredsEl.checked = remember;
        const { user, pass } = getStoredCredentials();
        if (user) userEl.value = user;
        if (pass) passEl.value = pass;
      })();

      // Evita que el teclado tape el input (especialmente en navegadores “car”).
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

      btnLogout.addEventListener("click", () => {
        state.auth = null;
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
        btnAlbums.disabled = true;
        btnAlbums.textContent = "Álbumes";
        btnSongs.disabled = true;
        btnSongs.textContent = "Canciones";
        state.shuffleEnabled = false;
        state.randomMode = false;
        state.randomLoading = false;
        state.randomPrefetchAt = 0;
        setShuffleUI();
        setNow(null);
        songMenu.innerHTML = "";
        player.pause();
        player.removeAttribute("src");
        updateProgress();
        showScreen("login");
        setStatus("Sesión cerrada.", "");
      });

      function renderSongMenu() {
        songMenu.innerHTML = "";
        if (!state.queue || state.queue.length === 0) return;
        state.queue.forEach((t, idx) => {
          const btn = document.createElement("button");
          btn.className = "songBtn" + (idx === state.queueIndex ? " active" : "");
          btn.innerHTML = `
            <div class="songLine">${idx + 1} - ${escapeHtml(t.title || "—")}</div>
          `;
          btn.addEventListener("click", () => playIndex(idx));
          songMenu.appendChild(btn);
        });
      }

      btnClearArtists.addEventListener("click", () => {
        artistFilter.value = "";
        applyListFilter();
        artistsList.scrollTo({ top: 0, behavior: "smooth" });
      });

      function applyListFilter() {
        const q = (artistFilter.value || "").trim().toLowerCase();
        if (state.viewMode === "genres") {
          if (!q) {
            state.genresFiltered = state.genres;
          } else {
            state.genresFiltered = state.genres.filter((g) => (g.value || g.name || "").toLowerCase().includes(q));
          }
          renderGenres(state.genresFiltered);
        } else if (state.viewMode === "albums") {
          if (!q) {
            state.albumsFiltered = state.albums;
          } else {
            state.albumsFiltered = state.albums.filter((a) => (a.name || "").toLowerCase().includes(q));
          }
          renderAlbums(state.albumsFiltered);
        } else if (state.viewMode === "playlists") {
          if (!q) {
            state.playlistsFiltered = state.playlists;
          } else {
            state.playlistsFiltered = state.playlists.filter((p) => (p.name || "").toLowerCase().includes(q));
          }
          renderPlaylists(state.playlistsFiltered);
        } else {
          if (!q) {
            state.artistsFiltered = state.artists;
          } else {
            state.artistsFiltered = state.artists.filter((a) => (a.name || "").toLowerCase().includes(q));
          }
          renderArtists(state.artistsFiltered);
        }
      }

      let filterTimer = null;
      artistFilter.addEventListener("input", () => {
        if (filterTimer) clearTimeout(filterTimer);
        filterTimer = setTimeout(() => applyListFilter(), 120);
      });

      function setViewMode(mode) {
        state.viewMode = mode;
        btnViewArtists.classList.toggle("active", mode === "artists");
        btnViewGenres.classList.toggle("active", mode === "genres");
        btnViewAlbums.classList.toggle("active", mode === "albums");
        btnViewPlaylists.classList.toggle("active", mode === "playlists");
        artistFilter.value = "";
        artistFilter.placeholder =
          mode === "genres"
            ? "Filtrar género…"
            : mode === "albums"
            ? "Filtrar álbum…"
            : mode === "playlists"
            ? "Filtrar lista…"
            : "Filtrar artista…";
        if (mode === "genres") {
          loadGenres().catch((e) => setStatus(String(e), "bad"));
        } else if (mode === "albums") {
          loadAlbums().catch((e) => setStatus(String(e), "bad"));
        } else if (mode === "playlists") {
          loadPlaylists().catch((e) => setStatus(String(e), "bad"));
        } else {
          loadArtists().catch((e) => setStatus(String(e), "bad"));
        }
      }

      btnViewArtists.addEventListener("click", () => setViewMode("artists"));
      btnViewGenres.addEventListener("click", () => setViewMode("genres"));
      btnViewAlbums.addEventListener("click", () => setViewMode("albums"));
      btnViewPlaylists.addEventListener("click", () => setViewMode("playlists"));

      showScreen("login");
      checkForUpdate({ currentTag: APP_VERSION, repo: UPDATE_REPO, currentEl: verCurrent, latestEl: verLatest });
      (function showWhatsNewOncePerVersion() {
        const seen = getWhatsNewSeenVersion();
        if (seen === APP_VERSION) return;
        if (!getWhatsNewForVersion(APP_VERSION).length) return;
        openWhatsNewModal();
      })();

      // Auto-login si el usuario eligió "recordarme" y hay credenciales guardadas.
      (function autoLoginIfRemembered() {
        if (!getRememberCreds()) return;
        const pass = getStoredCredentials().pass;
        if (!pass) return;
        if (!userEl.value || !getStoredServer()) return;
        setStatus("Autoconectando…");
        // Deja que la UI pinte antes de lanzar requests.
        setTimeout(() => connect(), 50);
      })();

      setShuffleUI();
