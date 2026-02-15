import test from "node:test";
import assert from "node:assert/strict";

import {
  getListPaneSide,
  setListPaneSide,
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
    // Current implementation normalizes non-right values to the default side.
    setListPaneSide("left");
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
