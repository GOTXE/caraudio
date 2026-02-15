import test from "node:test";
import assert from "node:assert/strict";

import { getDeviceMode, setDeviceMode, getRemember, setRemember } from "../web/assets/js/modules/storage.js";

test("deviceMode persists in storage adapter", () => {
  setDeviceMode("car");
  assert.equal(getDeviceMode(), "car");
});

test("remember flag roundtrip", () => {
  setRemember(true);
  assert.equal(getRemember(), true);
  setRemember(false);
  assert.equal(getRemember(), false);
});
