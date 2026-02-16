import test from "node:test";
import assert from "node:assert/strict";

import { STORAGE_KEYS } from "../../assets/js/modules/constants.js";
import {
  getActiveProfileId,
  getAutoThemeSettings,
  getProfiles,
  getRememberCreds,
  getThemeMode,
  migrateLegacyPreferences,
  setAutoThemeSettings,
  setStoredCredentials,
} from "../../assets/js/modules/storage.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

test("migrateLegacyPreferences keeps legacy autologin/profile behavior", () => {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    globalThis.localStorage.setItem(STORAGE_KEYS.server, "https://music.local/");
    globalThis.localStorage.setItem(STORAGE_KEYS.user, "Alice");
    globalThis.localStorage.setItem(STORAGE_KEYS.pass, "secret");
    globalThis.localStorage.setItem(STORAGE_KEYS.theme, "dark");

    migrateLegacyPreferences();

    assert.equal(getThemeMode(), "night");
    const profiles = getProfiles();
    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].id, "https://music.local::alice");
    assert.equal(profiles[0].server, "https://music.local");
    assert.equal(profiles[0].user, "Alice");
    assert.equal(profiles[0].pass, "secret");
    assert.equal(getActiveProfileId(), "https://music.local::alice");
    assert.equal(globalThis.localStorage.getItem(STORAGE_KEYS.storageSchema), "2");
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("auto theme legacy value is normalized and treated as configured", () => {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    globalThis.localStorage.setItem(
      STORAGE_KEYS.autoTheme,
      JSON.stringify({
        timeZone: "Europe/Madrid",
        dayStart: "06:30",
        nightStart: "21:15",
        cityKey: "legacy-key",
      }),
    );

    const normalized = getAutoThemeSettings();
    assert.deepEqual(normalized, {
      timeZone: "Europe/Madrid",
      dayStart: "06:30",
      nightStart: "21:15",
      configured: true,
    });

    const savedRaw = globalThis.localStorage.getItem(STORAGE_KEYS.autoTheme);
    assert.equal(
      savedRaw,
      JSON.stringify({
        timeZone: "Europe/Madrid",
        dayStart: "06:30",
        nightStart: "21:15",
        configured: true,
      }),
    );

    assert.deepEqual(setAutoThemeSettings({ nightStart: "20:45" }), {
      timeZone: "Europe/Madrid",
      dayStart: "06:30",
      nightStart: "20:45",
      configured: true,
    });
  } finally {
    globalThis.localStorage = originalStorage;
  }
});

test("remember credentials keeps legacy fallback and explicit clear", () => {
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    globalThis.localStorage.setItem(STORAGE_KEYS.pass, "legacy-pass");
    assert.equal(getRememberCreds(), true);

    setStoredCredentials({ user: "Bob", pass: "new-pass" }, false);
    assert.equal(globalThis.localStorage.getItem(STORAGE_KEYS.user), "Bob");
    assert.equal(globalThis.localStorage.getItem(STORAGE_KEYS.pass), null);
    assert.equal(getRememberCreds(), false);
  } finally {
    globalThis.localStorage = originalStorage;
  }
});
