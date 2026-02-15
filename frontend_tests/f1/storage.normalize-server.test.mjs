import test from "node:test";
import assert from "node:assert/strict";

import { normalizeServer } from "../../assets/js/modules/storage.js";

test("normalizeServer trims trailing slash", () => {
  assert.equal(normalizeServer("https://demo.local/"), "https://demo.local");
  assert.equal(normalizeServer("https://demo.local"), "https://demo.local");
});
