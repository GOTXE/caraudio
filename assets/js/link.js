import { completeDevice, verifyDeviceCode } from "./modules/broker-client.js";
import { createI18n, detectPreferredLanguage } from "./modules/i18n.js";

const codeEl = document.getElementById("linkCode");
const userEl = document.getElementById("linkUser");
const passEl = document.getElementById("linkPass");
const statusEl = document.getElementById("linkStatus");
const attemptsEl = document.getElementById("linkAttempts");
const authorizeBtn = document.getElementById("linkAuthorize");

const i18n = createI18n(detectPreferredLanguage());
i18n.apply(document);

let attemptsLeft = 3;

function t(key, params) {
  return i18n.t(key, params);
}

function setStatus(text, kind = "") {
  statusEl.textContent = text;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function normalizeCodeInput(raw) {
  const sanitized = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  if (sanitized.length <= 4) return sanitized;
  return `${sanitized.slice(0, 4)}-${sanitized.slice(4)}`;
}

function updateAttempts() {
  attemptsEl.textContent = t("link.attempts_count", { count: attemptsLeft });
}

codeEl.addEventListener("input", () => {
  codeEl.value = normalizeCodeInput(codeEl.value);
});

authorizeBtn.addEventListener("click", async () => {
  if (attemptsLeft <= 0) {
    setStatus(t("link.no_attempts"), "bad");
    return;
  }
  const code = normalizeCodeInput(codeEl.value);
  const username = String(userEl.value || "").trim();
  const password = String(passEl.value || "");
  if (code.length !== 9 || !username || !password) {
    setStatus(t("status.missing_credentials"), "bad");
    return;
  }

  authorizeBtn.disabled = true;
  setStatus(t("status.connecting"));
  try {
    const verified = await verifyDeviceCode({ user_code: code });
    await completeDevice({
      verification_token: verified.verification_token,
      username,
      password,
    });
    setStatus(t("link.connecting"), "ok");
  } catch (e) {
    const message = String(e || "");
    if (message.includes("invalid_code") || message.includes("invalid_credentials")) {
      attemptsLeft = Math.max(0, attemptsLeft - 1);
      updateAttempts();
      if (attemptsLeft <= 0) {
        setStatus(t("link.no_attempts"), "bad");
      } else {
        setStatus(t("common.error", { error: message }), "bad");
      }
    } else {
      setStatus(t("common.error", { error: message }), "bad");
    }
  } finally {
    authorizeBtn.disabled = false;
  }
});

updateAttempts();
