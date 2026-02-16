import test from "node:test";
import assert from "node:assert/strict";

import { createI18n, normalizeLanguage } from "../../assets/js/modules/i18n.js";

test("normalizeLanguage supports fallback and browser-like tags", () => {
  assert.equal(normalizeLanguage("es"), "es");
  assert.equal(normalizeLanguage("en"), "en");
  assert.equal(normalizeLanguage("en-US"), "en");
  assert.equal(normalizeLanguage("ES-es"), "es");
  assert.equal(normalizeLanguage(""), "es");
  assert.equal(normalizeLanguage("fr-FR"), "es");
});

test("createI18n translates keys and interpolates params", () => {
  const i18n = createI18n("es");
  assert.equal(i18n.t("login.connect"), "Conectar");
  assert.equal(i18n.t("player.song_count", { count: 9 }), "Canciones (9)");
  assert.equal(i18n.t("unknown.key"), "unknown.key");
});

test("createI18n switches language and keeps fallback to es", () => {
  const i18n = createI18n("en");
  assert.equal(i18n.t("login.connect"), "Connect");
  i18n.setLanguage("es");
  assert.equal(i18n.t("login.connect"), "Conectar");
  i18n.setLanguage("de");
  assert.equal(i18n.getLanguage(), "es");
});
