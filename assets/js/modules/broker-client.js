const API_BASE = "/api";

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function requestJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const text = await response.text();
  const data = safeJsonParse(text) || {};
  if (!response.ok) {
    const errorCode = data.error || `http_${response.status}`;
    const errorId = data.error_id ? ` (${data.error_id})` : "";
    throw new Error(`${errorCode}${errorId}`);
  }
  return data;
}

export function startDevice(payload) {
  return requestJson("/device/start", payload);
}

export function pollDevice(payload) {
  return requestJson("/device/poll", payload);
}

export function verifyDeviceCode(payload) {
  return requestJson("/device/verify", payload);
}

export function completeDevice(payload) {
  return requestJson("/device/complete", payload);
}

export function refreshSession(payload) {
  return requestJson("/session/refresh", payload);
}

export function revokeSession(payload) {
  return requestJson("/session/revoke", payload);
}
