export function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseSemVer(raw) {
  const value = String(raw || "").trim();
  const match = /^v(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(value);
  if (!match) return null;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4] || "";
  let preRank = 4;
  let preNum = 0;
  if (prerelease) {
    const preMatch = /^(alpha|beta|rc)(?:\.(\d+))?$/.exec(prerelease);
    if (!preMatch) return null;
    preRank = preMatch[1] === "alpha" ? 1 : preMatch[1] === "beta" ? 2 : 3;
    preNum = preMatch[2] ? Number(preMatch[2]) : 0;
  }
  return { raw: value, major, minor, patch, preRank, preNum };
}

function compareSemVer(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.preRank !== b.preRank) return a.preRank - b.preRank;
  return a.preNum - b.preNum;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkForUpdate({ currentTag, repo, currentEl, latestEl }) {
  if (!currentEl || !latestEl) return;
  currentEl.textContent = currentTag;
  latestEl.hidden = true;
  if (!repo) return;
  const current = parseSemVer(currentTag);
  if (!current) return;
  try {
    const response = await fetchWithTimeout(`https://api.github.com/repos/${repo}/tags?per_page=30`, 2500);
    if (!response.ok) return;
    const tags = await response.json();
    if (!Array.isArray(tags)) return;
    let best = null;
    for (const tag of tags) {
      const parsed = parseSemVer(tag?.name);
      if (!parsed) continue;
      if (!best || compareSemVer(parsed, best) > 0) best = parsed;
    }
    if (!best) return;
    if (compareSemVer(best, current) > 0) {
      latestEl.textContent = best.raw;
      latestEl.hidden = false;
    }
  } catch {
    // ignore offline/rate-limited errors
  }
}
