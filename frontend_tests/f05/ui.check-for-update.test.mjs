import test from "node:test";
import assert from "node:assert/strict";

import { checkForUpdate } from "../../assets/js/modules/ui.js";

test("checkForUpdate shows newer tag when available", async () => {
  const currentEl = { textContent: "", hidden: false };
  const latestEl = { textContent: "", hidden: true };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return [{ name: "v0.2.0" }, { name: "v0.1.0-alpha.6" }];
    },
  });

  try {
    await checkForUpdate({
      currentTag: "v0.1.0-alpha.6",
      repo: "GOTXE/caraudio",
      currentEl,
      latestEl,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(currentEl.textContent, "v0.1.0-alpha.6");
  assert.equal(latestEl.hidden, false);
  assert.equal(latestEl.textContent, "v0.2.0");
});
