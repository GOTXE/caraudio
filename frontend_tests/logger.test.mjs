import test from "node:test";
import assert from "node:assert/strict";

import { createLogger, normalizeLogLevel } from "../web/assets/js/modules/logger.js";

test("normalizeLogLevel supports none/debug/info/warn/error", () => {
  assert.equal(normalizeLogLevel("NONE"), "none");
  assert.equal(normalizeLogLevel("debug"), "debug");
  assert.equal(normalizeLogLevel("invalid"), "none");
});

test("logger drops records when level is none", async () => {
  const rows = [];
  const store = {
    async insertEvent(event) {
      rows.push(event);
    },
    async queryEvents() {
      return rows;
    },
    async clearEvents() {
      rows.length = 0;
    },
    async enforceRetention() {}
  };

  const logger = createLogger({ store });
  await logger.info("app.start", "Start", {});
  assert.equal(rows.length, 0);
});

test("logger redacts sensitive values and respects level threshold", async () => {
  const rows = [];
  const store = {
    async insertEvent(event) {
      rows.push(event);
    },
    async queryEvents() {
      return rows;
    },
    async clearEvents() {
      rows.length = 0;
    },
    async enforceRetention() {}
  };

  const logger = createLogger({
    store,
    getContext: () => ({ session_id: "abc" })
  });

  logger.setLevel("warn");
  await logger.info("skip", "Skip", {});
  await logger.error("auth.fail", "Failed", { password: "secret", token: "x" });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].level, "error");
  assert.equal(rows[0].meta.password, "<redacted>");
  assert.equal(rows[0].meta.token, "<redacted>");
});
