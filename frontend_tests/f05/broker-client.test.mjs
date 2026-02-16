import test from "node:test";
import assert from "node:assert/strict";

import { pollDevice, startDevice } from "../../assets/js/modules/broker-client.js";

test("startDevice uses POST JSON against /api/device/start", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          device_code: "dev-1",
          user_code: "ABCD-EFGH",
          expires_in: 300,
        });
      },
    };
  };

  try {
    const result = await startDevice({ server_url: "https://music.local" });
    assert.equal(result.device_code, "dev-1");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/device/start");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[0].options.headers["Content-Type"], "application/json");
    assert.equal(calls[0].options.body, JSON.stringify({ server_url: "https://music.local" }));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("pollDevice throws safe error and keeps error_id", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    async text() {
      return JSON.stringify({
        ok: false,
        error: "invalid_session",
        error_id: "ERR-ABC123",
      });
    },
  });

  try {
    await assert.rejects(
      pollDevice({ device_code: "dev-x" }),
      /invalid_session \(ERR-ABC123\)/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
