import test from "node:test";
import assert from "node:assert/strict";

import {
  clearBrokerSession,
  getBrokerSession,
  getDeviceMode,
  getDeviceModePromptSeen,
  getLanguage,
  getListPaneSide,
  setListPaneSide,
  setDeviceMode,
  setDeviceModePromptSeen,
  setLanguage,
  setBrokerSession,
  getRememberCreds,
  setRememberCreds,
  normalizeServer,
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

test("storage helpers persist list pane side", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    setListPaneSide("right");
    assert.equal(getListPaneSide(), "right");
    setListPaneSide("left");
    assert.equal(getListPaneSide(), "left");

    setListPaneSide("unexpected");
    assert.equal(getListPaneSide(), "left");

    globalThis.localStorage.setItem("carplayer.navidrome.listPaneSide", "broken");
    assert.equal(getListPaneSide(), "right");
  } finally {
    globalThis.localStorage = original;
  }
});

test("remember creds roundtrip", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    setRememberCreds(true);
    assert.equal(getRememberCreds(), true);
    setRememberCreds(false);
    assert.equal(getRememberCreds(), false);
    assert.equal(normalizeServer("https://a/"), "https://a");
  } finally {
    globalThis.localStorage = original;
  }
});

test("device mode persists and normalizes fallback to auto", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    assert.equal(getDeviceMode(), "auto");
    assert.equal(setDeviceMode("car"), "car");
    assert.equal(getDeviceMode(), "car");
    assert.equal(setDeviceMode("desktop"), "desktop");
    assert.equal(getDeviceMode(), "desktop");
    assert.equal(setDeviceMode("invalid"), "auto");
    assert.equal(getDeviceMode(), "auto");
  } finally {
    globalThis.localStorage = original;
  }
});

test("device mode suggestion flag persists as boolean", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    assert.equal(getDeviceModePromptSeen(), false);
    setDeviceModePromptSeen(true);
    assert.equal(getDeviceModePromptSeen(), true);
    setDeviceModePromptSeen(false);
    assert.equal(getDeviceModePromptSeen(), false);
  } finally {
    globalThis.localStorage = original;
  }
});

test("language persists and normalizes to es/en", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    assert.equal(getLanguage(), "");
    assert.equal(setLanguage("en"), "en");
    assert.equal(getLanguage(), "en");
    assert.equal(setLanguage("other"), "es");
    assert.equal(getLanguage(), "es");
  } finally {
    globalThis.localStorage = original;
  }
});

test("broker session persists with normalized server url", () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = createMemoryStorage();
  try {
    assert.equal(getBrokerSession(), null);
    const saved = setBrokerSession({
      sessionId: "s1",
      serverUrl: "https://music.local/",
      username: "gotxe",
      authSalt: "salt",
      authToken: "token",
      accessToken: "access",
      refreshToken: "refresh",
      accessExpiresAt: 100,
      refreshExpiresAt: 200,
      linkedAt: 300,
    });
    assert.equal(saved.serverUrl, "https://music.local");
    assert.equal(getBrokerSession().username, "gotxe");
    clearBrokerSession();
    assert.equal(getBrokerSession(), null);
  } finally {
    globalThis.localStorage = original;
  }
});
