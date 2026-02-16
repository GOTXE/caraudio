import test from "node:test";
import assert from "node:assert/strict";

import { buildRestUrl, makeAuth, restJson, scrobble } from "../../assets/js/modules/navidrome.js";

test("buildRestUrl normalizes base URL and omits empty params", () => {
  const url = buildRestUrl("https://music.local/", "getArtists", {
    f: "json",
    c: "carplayer",
    empty: "",
    nil: null,
    page: 1,
  });
  assert.equal(
    url,
    "https://music.local/rest/getArtists.view?f=json&c=carplayer&page=1",
  );
});

test("makeAuth returns token auth payload", () => {
  const auth = makeAuth("gotxe", "secret");
  assert.equal(auth.u, "gotxe");
  assert.equal(typeof auth.s, "string");
  assert.equal(auth.s.length, 16);
  assert.match(auth.s, /^[a-z0-9]+$/);
  assert.equal(typeof auth.t, "string");
  assert.equal(auth.t.length, 32);
  assert.match(auth.t, /^[a-f0-9]{32}$/);
});

test("restJson returns parsed subsonic-response payload", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify({
        "subsonic-response": {
          status: "ok",
          artists: { index: [{ name: "A" }] },
        },
      });
    },
  });

  try {
    const response = await restJson(
      "https://music.local",
      { u: "u", s: "salt", t: "token" },
      "getArtists",
      {},
    );
    assert.equal(response.status, "ok");
    assert.deepEqual(response.artists, { index: [{ name: "A" }] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("restJson throws when subsonic status is failed", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify({
        "subsonic-response": {
          status: "failed",
          error: { message: "auth failed" },
        },
      });
    },
  });

  try {
    await assert.rejects(
      restJson("https://music.local", { u: "u", s: "salt", t: "token" }, "ping", {}),
      /auth failed/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("scrobble sends submission and timestamp fields as expected", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  globalThis.fetch = async (url) => {
    capturedUrl = String(url);
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({ "subsonic-response": { status: "ok" } });
      },
    };
  };

  try {
    await scrobble("https://music.local/", { u: "u", s: "salt", t: "token" }, "track-1", {
      submission: true,
      time: 1700000000.8,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  const url = new URL(capturedUrl);
  assert.equal(url.pathname, "/rest/scrobble.view");
  assert.equal(url.searchParams.get("id"), "track-1");
  assert.equal(url.searchParams.get("submission"), "true");
  assert.equal(url.searchParams.get("time"), "1700000000");
});
