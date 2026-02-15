import test from "node:test";
import assert from "node:assert/strict";

import { createI18n, detectLanguage } from "../web/assets/js/modules/i18n.js";

test("detectLanguage supports ES and EN fallback", () => {
  assert.equal(detectLanguage("es-ES"), "es");
  assert.equal(detectLanguage("en-US"), "en");
  assert.equal(detectLanguage("fr-FR"), "en");
});

test("i18n returns translated string and key fallback", () => {
  const i18n = createI18n("en");
  assert.equal(i18n.t("login.connect"), "Connect");
  assert.equal(i18n.t("missing.key"), "missing.key");
});
