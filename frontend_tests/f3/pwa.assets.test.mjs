import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

test("manifest.webmanifest exists and includes required install fields", () => {
  const manifestPath = path.join(ROOT, "manifest.webmanifest");
  assert.equal(fs.existsSync(manifestPath), true);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(typeof manifest.name, "string");
  assert.equal(typeof manifest.start_url, "string");
  assert.equal(typeof manifest.display, "string");
  assert.equal(Array.isArray(manifest.icons), true);
  assert.ok(manifest.icons.length >= 1);
});

test("service-worker.js exists and caches app shell", () => {
  const swPath = path.join(ROOT, "service-worker.js");
  assert.equal(fs.existsSync(swPath), true);
  const source = fs.readFileSync(swPath, "utf8");
  assert.match(source, /CACHE_NAME/);
  assert.match(source, /APP_SHELL/);
  assert.match(source, /addEventListener\("install"/);
  assert.match(source, /addEventListener\("fetch"/);
});

test("index.html references manifest for PWA installability", () => {
  const indexPath = path.join(ROOT, "index.html");
  const source = fs.readFileSync(indexPath, "utf8");
  assert.match(source, /rel="manifest"/);
});
