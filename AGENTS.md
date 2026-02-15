# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Music Skin ND** is a car-mode web client (1280×480) for Navidrome using the Subsonic-compatible API (`/rest/...`). It's a static HTML/CSS/JavaScript application with no build step, designed for in-car audio interfaces.

Current state: **proof-of-concept / alpha testing**. UI and playback flow may change.

## Architecture

### Core Structure

- **Single-page application**: `index.html` (main player), `debug.html` (debug console)
- **No build tools**: Vanilla JavaScript ES6 modules, direct browser loading
- **API integration**: Subsonic REST API via Navidrome
- **Authentication**: Token-based (salt+MD5) to avoid sending passwords as plaintext
- **Storage**: localStorage for credentials, server URL, user preferences, and profiles

### Module Organization

```
assets/
├── css/
│   └── styles.css           # All styles in a single file
├── img/
│   └── music-player.svg     # Default fallback cover
└── js/
    ├── app.js               # Main application logic, event handlers, UI flow
    ├── debug-view.js        # Debug console for live telemetry
    └── modules/
        ├── constants.js     # App-wide constants
        ├── debug-bus.js     # Event bus for debug telemetry
        ├── navidrome.js     # Subsonic API client (ping, auth, getArtists, getSongs, scrobble, star/unstar, etc.)
        ├── player.js        # Audio playback queue management, track mapping
        ├── storage.js       # localStorage wrappers (credentials, theme, profiles, preferences)
        ├── ui.js            # UI utilities (escapeHtml, checkForUpdate)
        └── whats-new.js     # User-facing changelog for in-app "What's New" modal
```

### Key Concepts

- **Modular imports**: All JS uses ES6 `import/export`, no bundler
- **Relative paths**: All asset references use `./assets/...` for static deployment compatibility
- **Profiles**: Multi-user support via localStorage profiles (server URL, username, theme, preferences per profile)
- **Debug telemetry**: `debug-bus.js` publishes events (network, covers, player) consumed by `debug.html`
- **Theme system**: Day/Night/Auto modes with IANA timezone + sunrise/sunset calculation
- **Scrobbling**: Playback events reported to Navidrome via `/rest/scrobble`

### Views and Screens

- **Login screen**: Server config (with ping validation), username/password, remember credentials
- **Player screen**: Split layout with artist/genre/album/playlist browser on one side, now-playing panel on the other
  - Toggleable layout: list pane can be on left or right
  - Favorites and Most-Played filters (user-specific)
  - Album/songs modals for detailed browsing
  - Settings modal (theme, layout, user switching)
  - What's New modal (version changelog, auto-shown once per version)

## Development Workflow

### Branching and Versioning

- **`main`**: Stable, production-ready branch. All tags/releases point here.
- **`develope`**: Integration branch for active development and testing.
- **Never tag in `develope`**: Tags are created in `main` after merge.

Follow SemVer in `0.x` with pre-release tags:
- Format: `vMAJOR.MINOR.PATCH-PRERELEASE.INCREMENT`
- Examples: `v0.1.0-alpha.5`, `v0.1.0-beta.2`, `v0.1.0-rc.1`, `v0.1.0`
- In `0.x` phase: breaking changes and new features bump MINOR, bug fixes bump PATCH.
- During pre-release: increment the pre-release number (e.g., `alpha.1` → `alpha.2`).
- After stable release: fixes bump PATCH (e.g., `v0.1.0` → `v0.1.1`).

See `tech_docs/versionado_semver.md` for full versioning rules.

### Commit Conventions

Follow Conventional Commits:
- `feat:` - new user-facing feature
- `fix:` - bug fix
- `chore:` - maintenance, releases
- `docs:` - documentation only
- `refactor:` - code restructuring without behavior change
- `style:` - formatting, no logic change
- `test:` - test additions or updates

If breaking change, include `BREAKING CHANGE:` footer in commit message.

See `tech_docs/14.3_checklist_commits_y_versionado.md` for pre-PR checklist.

### Development Process

1. **Work in `develope`**:
   - Implement changes with small, focused commits.
   - For user-facing changes:
     - Update `CHANGELOG.md` under `[Unreleased]`.
     - Prepare entry in `assets/js/modules/whats-new.js` for target version.
   - Push to `origin/develope`.

2. **Test on staging**:
   - Deploy `develope` to test server.
   - Validate login, browsing, playback, modals, theme switching.
   - Fix issues with new commits in `develope`, repeat testing.

3. **Open PR to `main`**:
   - Base: `main`, compare: `develope`.
   - Review diff, ensure checklist in `tech_docs/14.3_checklist_commits_y_versionado.md` is satisfied.
   - Merge to `main`.

4. **Release and tag (only in `main`)**:
   - Update version in:
     - `index.html`: `<meta name="app-version" content="vX.Y.Z-..." />`
     - `README.md`: badge with new tag
     - `CHANGELOG.md`: move `[Unreleased]` items to new versioned section with date
     - `assets/js/modules/whats-new.js`: add section `"vX.Y.Z-...": [...]` with user-facing changes
   - Commit: `chore(release): vX.Y.Z-...`
   - Create annotated tag: `git tag -a vX.Y.Z-... -m "Release vX.Y.Z-..."`
   - Push: `git push origin main` and `git push origin vX.Y.Z-...`

5. **Sync `develope`**:
   - Merge or fast-forward `main` into `develope` to keep in sync.

See `tech_docs/14.4_proceso_develop_release.md` for full workflow.

### Testing

No automated test suite currently. Testing is manual:
- Login flow (server validation, credentials persistence)
- Artist/genre/album/playlist browsing and filtering
- Playback (play, pause, next, prev, shuffle, queue)
- Favorites and most-played filters
- Scrobbling (verify in Navidrome)
- Theme switching (Day/Night/Auto with timezone)
- Multi-profile switching
- Modal interactions (albums, songs, settings, what's new)
- Layout toggling (list pane left/right)

### User-Facing Changes

**Critical**: Any feature or fix visible to the end user must be documented in two places:
1. `CHANGELOG.md` under `[Unreleased]` (in non-technical language)
2. `assets/js/modules/whats-new.js` for the target version (shown in "What's New" modal)

This ensures users see changes when they update.

## Deployment

- Serve `index.html` as static file (any HTTP server: NAS, VPS, local Apache/nginx, etc.)
- No build step, no transpilation, no dependencies to install
- Ensure `./assets/` is accessible relative to `index.html`
- Configure CORS if Navidrome is on a different domain

## Security

- Use Subsonic token auth (salt+MD5) instead of password parameter
- Credentials stored in localStorage (user must trust device)
- Server URL validated via ping before saving (prevents mistyped URLs)
- No secrets in code or commits

## Notes

- **Car-unit keyboard**: Login UI keeps server URL editor visible above car keyboards
- **Cover optimization**: Uses different cover sizes for lists (96px) vs. now-playing (320px)
- **Fallback covers**: Uses `music-player.svg` when Navidrome returns missing/default disc cover
- **Auto-scroll queue**: Active song stays visible in long queues
- **Desktop fit**: UI is responsive and fits desktop at 100% zoom (no need to reduce to 80%)
- **Debug console**: `debug.html` provides live telemetry (network, covers, player events) for troubleshooting

## External Chat Messaging Policy

- Use external chat only for one-way alerts/requests to notify the user.
- Do not implement or rely on automatic reply polling from external chat.
- Official send script: `tech_docs/mensajes/synology_incoming_send.py`
- Do not use trigger keywords like `Iask` in outgoing messages.
- Prefix every outgoing message with datetime group `[YYYY-MM-DD HH:MM:SS]`.
- Use `--pretty` formatting with sections: `Resumen`, `Detalle`, `Accion requerida`.
- Address the user as `Gotxe`.
- Preferred command format:

```bash
python3 /data/projects/caraudio/tech_docs/mensajes/synology_incoming_send.py \
  --url 'https://srv.dimoti.myds.me/chat/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=TU_TOKEN' \
  --prepend-datetime \
  --pretty \
  --title 'TITULO' \
  --text 'RESUMEN' \
  --detail 'DETALLE' \
  --action 'ACCION REQUERIDA PARA GOTXE'
```
