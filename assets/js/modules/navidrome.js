import { normalizeServer } from "./storage.js";

function randSalt(len = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let index = 0; index < len; index++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function md5(str) {
  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md5cycle(x, k) {
    let a = x[0];
    let b = x[1];
    let c = x[2];
    let d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function md5blk(s) {
    const md5blks = [];
    for (let index = 0; index < 64; index += 4) {
      md5blks[index >> 2] =
        s.charCodeAt(index) +
        (s.charCodeAt(index + 1) << 8) +
        (s.charCodeAt(index + 2) << 16) +
        (s.charCodeAt(index + 3) << 24);
    }
    return md5blks;
  }
  function md51(s) {
    let n = s.length;
    let state = [1732584193, -271733879, -1732584194, 271733878];
    let index;
    for (index = 64; index <= n; index += 64) {
      md5cycle(state, md5blk(s.substring(index - 64, index)));
    }
    s = s.substring(index - 64);
    const tail = new Array(16).fill(0);
    for (index = 0; index < s.length; index++) tail[index >> 2] |= s.charCodeAt(index) << ((index % 4) << 3);
    tail[index >> 2] |= 0x80 << ((index % 4) << 3);
    if (index > 55) {
      md5cycle(state, tail);
      for (index = 0; index < 16; index++) tail[index] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function rhex(n) {
    const s = "0123456789abcdef";
    let out = "";
    for (let index = 0; index < 4; index++) {
      out += s[(n >> (index * 8 + 4)) & 0x0f] + s[(n >> (index * 8)) & 0x0f];
    }
    return out;
  }
  function hex(x) {
    for (let index = 0; index < x.length; index++) x[index] = rhex(x[index]);
    return x.join("");
  }
  function add32(a, b) {
    return (a + b) & 0xffffffff;
  }
  return hex(md51(str));
}

function baseParams(auth) {
  return {
    u: auth.u,
    t: auth.t,
    s: auth.s,
    v: "1.16.1",
    c: "carplayer",
    f: "json",
  };
}

export function buildRestUrl(server, viewName, params) {
  const base = normalizeServer(server);
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  return `${base}/rest/${viewName}.view?${query.toString()}`;
}

export async function restJson(server, auth, viewName, params) {
  const url = buildRestUrl(server, viewName, { ...baseParams(auth), ...(params || {}) });
  const response = await fetch(url, { method: "GET" });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Respuesta no JSON (${response.status})`);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const sub = json["subsonic-response"];
  if (!sub) throw new Error("Respuesta Subsonic inválida");
  if (sub.status === "failed") throw new Error(sub.error?.message || "Subsonic failed");
  return sub;
}

export function makeAuth(username, password) {
  const salt = randSalt(16);
  return { u: username, s: salt, t: md5(password + salt) };
}

export function coverUrl(server, auth, id, size = 256) {
  return buildRestUrl(server, "getCoverArt", { ...baseParams(auth), id, size });
}

export function streamUrl(server, auth, id) {
  return buildRestUrl(server, "stream", { ...baseParams(auth), id });
}

export async function star(server, auth, id) {
  return restJson(server, auth, "star", { id });
}

export async function unstar(server, auth, id) {
  return restJson(server, auth, "unstar", { id });
}

export async function getStarred2(server, auth) {
  return restJson(server, auth, "getStarred2", {});
}

export async function scrobble(server, auth, id, { submission = false, time } = {}) {
  const payload = { id, submission: submission ? "true" : "false" };
  if (Number.isFinite(time) && time > 0) payload.time = Math.floor(time);
  return restJson(server, auth, "scrobble", payload);
}
