from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


DEVICE_CODE_TTL_SECONDS = 300
VERIFY_TOKEN_TTL_SECONDS = 300
ACCESS_TOKEN_TTL_SECONDS = 15 * 60
REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60
POLL_INTERVAL_SECONDS = 2
POLL_INTERVAL_MAX_SECONDS = 8

USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def now_ts() -> int:
    return int(time.time())


def make_error_id() -> str:
    return f"ERR-{uuid.uuid4().hex[:10].upper()}"


def normalize_server_url(raw: str) -> str:
    value = str(raw or "").strip().rstrip("/")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("invalid_server_url")
    return value


def normalize_user_code(raw: str) -> str:
    value = str(raw or "").strip().upper().replace(" ", "")
    if len(value) != 9 or value[4] != "-":
        raise ValueError("invalid_code")
    left, right = value[:4], value[5:]
    if any(ch not in USER_CODE_ALPHABET for ch in f"{left}{right}"):
        raise ValueError("invalid_code")
    return f"{left}-{right}"


def generate_user_code() -> str:
    chars = [secrets.choice(USER_CODE_ALPHABET) for _ in range(8)]
    return f"{''.join(chars[:4])}-{''.join(chars[4:])}"


def generate_device_code() -> str:
    return secrets.token_urlsafe(32)


def generate_token() -> str:
    return secrets.token_urlsafe(40)


def md5_hex(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest()


def subsonic_token(password: str) -> tuple[str, str]:
    salt = secrets.token_hex(8)
    return salt, md5_hex(f"{password}{salt}")


@dataclass
class BrokerConfig:
    db_path: str
    secret: str
    allowed_origins: list[str]
    frontend_dir: str


class RateLimiter:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: dict[str, list[float]] = {}
        self._blocked_until: dict[str, float] = {}

    def check(self, key: str, *, limit: int, window_seconds: int, block_seconds: int = 60) -> bool:
        now = time.time()
        with self._lock:
            if self._blocked_until.get(key, 0) > now:
                return False
            values = [ts for ts in self._hits.get(key, []) if now - ts <= window_seconds]
            if len(values) >= limit:
                self._blocked_until[key] = now + block_seconds
                self._hits[key] = values
                return False
            values.append(now)
            self._hits[key] = values
            return True


class BrokerStore:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        self._lock = threading.Lock()
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS device_requests (
                  device_code TEXT PRIMARY KEY,
                  user_code_hash TEXT UNIQUE NOT NULL,
                  server_url TEXT NOT NULL,
                  nav_user TEXT,
                  nav_salt TEXT,
                  nav_token TEXT,
                  status TEXT NOT NULL,
                  expires_at INTEGER NOT NULL,
                  interval_seconds INTEGER NOT NULL,
                  created_at INTEGER NOT NULL,
                  updated_at INTEGER NOT NULL,
                  verification_token_hash TEXT,
                  verification_expires_at INTEGER,
                  poll_count INTEGER NOT NULL DEFAULT 0,
                  session_id TEXT,
                  access_token TEXT,
                  refresh_token TEXT,
                  access_expires_at INTEGER,
                  refresh_expires_at INTEGER
                );
                CREATE TABLE IF NOT EXISTS sessions (
                  session_id TEXT PRIMARY KEY,
                  device_code TEXT NOT NULL,
                  server_url TEXT NOT NULL,
                  username TEXT NOT NULL,
                  nav_salt TEXT,
                  nav_token TEXT,
                  created_at INTEGER NOT NULL,
                  revoked_at INTEGER,
                  last_refresh_at INTEGER,
                  refresh_rotation INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS session_tokens (
                  token_hash TEXT PRIMARY KEY,
                  session_id TEXT NOT NULL,
                  token_type TEXT NOT NULL,
                  expires_at INTEGER NOT NULL,
                  revoked_at INTEGER,
                  created_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_session_tokens_session ON session_tokens(session_id);
                CREATE INDEX IF NOT EXISTS idx_session_tokens_type ON session_tokens(token_type);
                """
            )
            for table_name, column_name, column_def in (
                ("device_requests", "nav_user", "TEXT"),
                ("device_requests", "nav_salt", "TEXT"),
                ("device_requests", "nav_token", "TEXT"),
                ("sessions", "nav_salt", "TEXT"),
                ("sessions", "nav_token", "TEXT"),
            ):
                cols = {row["name"] for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()}
                if column_name not in cols:
                    conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")
            conn.commit()

    def execute(self, query: str, params: tuple = ()) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(query, params)
            conn.commit()

    def fetch_one(self, query: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        with self._lock, self._connect() as conn:
            return conn.execute(query, params).fetchone()


class StartRequest(BaseModel):
    server_url: str


class VerifyRequest(BaseModel):
    user_code: str


class CompleteRequest(BaseModel):
    verification_token: str
    username: str
    password: str


class PollRequest(BaseModel):
    device_code: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RevokeRequest(BaseModel):
    refresh_token: str


def hash_value(secret: str, value: str) -> str:
    return hmac.new(secret.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


def parse_allowed_origins(raw: str) -> list[str]:
    out = [part.strip() for part in str(raw or "").split(",") if part.strip()]
    return out or ["http://localhost:8080", "http://127.0.0.1:8080"]


def load_config() -> BrokerConfig:
    db_path = os.getenv("CARAUDIO_BROKER_DB", "broker/data/broker.db")
    secret = os.getenv("CARAUDIO_BROKER_SECRET", "change-this-secret-in-production")
    allowed = parse_allowed_origins(os.getenv("CARAUDIO_ALLOWED_ORIGINS", ""))
    frontend = os.getenv("CARAUDIO_FRONTEND_DIR", "")
    return BrokerConfig(db_path=db_path, secret=secret, allowed_origins=allowed, frontend_dir=frontend)


def error_response(error: str, status_code: int) -> JSONResponse:
    return JSONResponse({"ok": False, "error": error, "error_id": make_error_id()}, status_code=status_code)


async def validate_navidrome_credentials(server_url: str, username: str, password: str) -> bool:
    salt, token = subsonic_token(password)
    params = {
        "u": username,
        "s": salt,
        "t": token,
        "v": "1.16.1",
        "c": "carplayer",
        "f": "json",
    }
    url = f"{server_url}/rest/ping.view"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(url, params=params)
        if response.status_code >= 500:
            return False
        payload = response.json()
    except Exception:
        return False
    sub = payload.get("subsonic-response") if isinstance(payload, dict) else None
    return isinstance(sub, dict) and sub.get("status") == "ok"


def create_app(config: Optional[BrokerConfig] = None) -> FastAPI:
    cfg = config or load_config()
    store = BrokerStore(cfg.db_path)
    limiter = RateLimiter()

    app = FastAPI(title="Caraudio Broker", version="1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def _on_unhandled(_: Request, __: Exception) -> JSONResponse:
        return error_response("internal_error", 500)

    @app.get("/api/health")
    async def health() -> dict:
        return {"ok": True}

    @app.post("/api/device/start")
    async def device_start(body: StartRequest, request: Request):
        ip = request.client.host if request.client else "unknown"
        if not limiter.check(f"start:{ip}", limit=20, window_seconds=60, block_seconds=90):
            return error_response("rate_limited", 429)
        try:
            server_url = normalize_server_url(body.server_url)
        except ValueError:
            return error_response("invalid_server_url", 400)

        for _ in range(20):
            user_code = generate_user_code()
            user_code_hash = hash_value(cfg.secret, user_code)
            device_code = generate_device_code()
            now = now_ts()
            try:
                store.execute(
                    """
                    INSERT INTO device_requests (
                      device_code, user_code_hash, server_url, status, expires_at, interval_seconds, created_at, updated_at
                    ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
                    """,
                    (
                        device_code,
                        user_code_hash,
                        server_url,
                        now + DEVICE_CODE_TTL_SECONDS,
                        POLL_INTERVAL_SECONDS,
                        now,
                        now,
                    ),
                )
                return {
                    "device_code": device_code,
                    "user_code": user_code,
                    "expires_in": DEVICE_CODE_TTL_SECONDS,
                    "interval_seconds": POLL_INTERVAL_SECONDS,
                    "server_hint": server_url,
                }
            except sqlite3.IntegrityError:
                continue
        return error_response("code_generation_failed", 500)

    @app.post("/api/device/verify")
    async def device_verify(body: VerifyRequest, request: Request):
        ip = request.client.host if request.client else "unknown"
        if not limiter.check(f"verify:{ip}", limit=25, window_seconds=60, block_seconds=120):
            return error_response("rate_limited", 429)
        try:
            normalized = normalize_user_code(body.user_code)
        except ValueError:
            return error_response("invalid_code", 400)

        now = now_ts()
        code_hash = hash_value(cfg.secret, normalized)
        row = store.fetch_one(
            """
            SELECT device_code, status, expires_at FROM device_requests
            WHERE user_code_hash = ?
            """,
            (code_hash,),
        )
        if not row:
            return error_response("invalid_code", 404)
        if row["expires_at"] <= now:
            store.execute("UPDATE device_requests SET status = 'expired', updated_at = ? WHERE device_code = ?", (now, row["device_code"]))
            return {"status": "expired"}
        if row["status"] not in {"pending", "verified"}:
            return error_response("invalid_code", 400)

        verification_token = generate_token()
        verification_hash = hash_value(cfg.secret, verification_token)
        store.execute(
            """
            UPDATE device_requests
            SET status='verified', verification_token_hash=?, verification_expires_at=?, updated_at=?
            WHERE device_code=?
            """,
            (verification_hash, now + VERIFY_TOKEN_TTL_SECONDS, now, row["device_code"]),
        )
        return {"verification_token": verification_token, "expires_in": VERIFY_TOKEN_TTL_SECONDS}

    @app.post("/api/device/complete")
    async def device_complete(body: CompleteRequest, request: Request):
        ip = request.client.host if request.client else "unknown"
        if not limiter.check(f"complete:{ip}", limit=25, window_seconds=60, block_seconds=120):
            return error_response("rate_limited", 429)
        token = str(body.verification_token or "").strip()
        username = str(body.username or "").strip()
        password = str(body.password or "")
        if not token or not username or not password:
            return error_response("invalid_request", 400)

        now = now_ts()
        token_hash = hash_value(cfg.secret, token)
        row = store.fetch_one(
            """
            SELECT device_code, server_url, status, expires_at, verification_expires_at
            FROM device_requests WHERE verification_token_hash = ?
            """,
            (token_hash,),
        )
        if not row:
            return error_response("invalid_code", 404)
        if row["expires_at"] <= now or (row["verification_expires_at"] and row["verification_expires_at"] <= now):
            store.execute("UPDATE device_requests SET status='expired', updated_at=? WHERE device_code=?", (now, row["device_code"]))
            return {"status": "expired"}
        if row["status"] not in {"verified", "pending"}:
            return error_response("invalid_code", 400)

        valid = await validate_navidrome_credentials(row["server_url"], username, password)
        if not valid:
            return error_response("invalid_credentials", 401)

        nav_salt, nav_token = subsonic_token(password)
        session_id = uuid.uuid4().hex
        access_token = generate_token()
        refresh_token = generate_token()
        access_expires_at = now + ACCESS_TOKEN_TTL_SECONDS
        refresh_expires_at = now + REFRESH_TOKEN_TTL_SECONDS

        store.execute(
            """
            INSERT INTO sessions (session_id, device_code, server_url, username, nav_salt, nav_token, created_at, revoked_at, last_refresh_at, refresh_rotation)
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0)
            """,
            (session_id, row["device_code"], row["server_url"], username, nav_salt, nav_token, now),
        )
        store.execute(
            """
            INSERT INTO session_tokens (token_hash, session_id, token_type, expires_at, revoked_at, created_at)
            VALUES (?, ?, 'access', ?, NULL, ?), (?, ?, 'refresh', ?, NULL, ?)
            """,
            (
                hash_value(cfg.secret, access_token),
                session_id,
                access_expires_at,
                now,
                hash_value(cfg.secret, refresh_token),
                session_id,
                refresh_expires_at,
                now,
            ),
        )
        store.execute(
            """
            UPDATE device_requests
            SET status='completed',
                session_id=?,
                nav_user=?,
                nav_salt=?,
                nav_token=?,
                access_token=?,
                refresh_token=?,
                access_expires_at=?,
                refresh_expires_at=?,
                verification_token_hash=NULL,
                verification_expires_at=NULL,
                updated_at=?
            WHERE device_code=?
            """,
            (session_id, username, nav_salt, nav_token, access_token, refresh_token, access_expires_at, refresh_expires_at, now, row["device_code"]),
        )
        return {"status": "ok"}

    @app.post("/api/device/poll")
    async def device_poll(body: PollRequest, request: Request):
        ip = request.client.host if request.client else "unknown"
        code = str(body.device_code or "").strip()
        if not code:
            return error_response("invalid_code", 400)
        if not limiter.check(f"poll:{ip}:{code[:10]}", limit=80, window_seconds=60, block_seconds=60):
            return error_response("rate_limited", 429)

        now = now_ts()
        row = store.fetch_one("SELECT * FROM device_requests WHERE device_code = ?", (code,))
        if not row:
            return error_response("invalid_code", 404)
        if row["expires_at"] <= now and row["status"] not in {"completed", "consumed"}:
            store.execute("UPDATE device_requests SET status='expired', updated_at=? WHERE device_code=?", (now, code))
            return {"status": "expired"}
        if row["status"] in {"pending", "verified"}:
            polls = int(row["poll_count"] or 0) + 1
            interval = min(POLL_INTERVAL_MAX_SECONDS, max(POLL_INTERVAL_SECONDS, int(row["interval_seconds"] or 2) + (1 if polls % 3 == 0 else 0)))
            store.execute(
                "UPDATE device_requests SET poll_count=?, interval_seconds=?, updated_at=? WHERE device_code=?",
                (polls, interval, now, code),
            )
            return {"status": "pending", "interval_seconds": interval}
        if row["status"] == "completed":
            response = {
                "status": "approved",
                "session_id": row["session_id"],
                "server_url": row["server_url"],
                "username": row["nav_user"],
                "auth_salt": row["nav_salt"],
                "auth_token": row["nav_token"],
                "access_token": row["access_token"],
                "refresh_token": row["refresh_token"],
                "access_expires_at": row["access_expires_at"],
                "refresh_expires_at": row["refresh_expires_at"],
            }
            store.execute(
                """
                UPDATE device_requests
                SET status='consumed', access_token=NULL, refresh_token=NULL, updated_at=?
                WHERE device_code=?
                """,
                (now, code),
            )
            return response
        if row["status"] == "expired":
            return {"status": "expired"}
        if row["status"] == "denied":
            return {"status": "denied"}
        return {"status": "consumed"}

    @app.post("/api/session/refresh")
    async def session_refresh(body: RefreshRequest, request: Request):
        ip = request.client.host if request.client else "unknown"
        if not limiter.check(f"refresh:{ip}", limit=40, window_seconds=60, block_seconds=120):
            return error_response("rate_limited", 429)
        token = str(body.refresh_token or "").strip()
        if not token:
            return error_response("invalid_session", 401)
        now = now_ts()
        token_hash = hash_value(cfg.secret, token)
        row = store.fetch_one(
            """
            SELECT token_hash, session_id, expires_at, revoked_at
            FROM session_tokens
            WHERE token_hash=? AND token_type='refresh'
            """,
            (token_hash,),
        )
        if not row or row["revoked_at"] is not None or row["expires_at"] <= now:
            return error_response("invalid_session", 401)
        session = store.fetch_one("SELECT session_id, revoked_at, refresh_rotation FROM sessions WHERE session_id=?", (row["session_id"],))
        if not session or session["revoked_at"] is not None:
            return error_response("invalid_session", 401)

        access_token = generate_token()
        refresh_token = generate_token()
        access_expires_at = now + ACCESS_TOKEN_TTL_SECONDS
        refresh_expires_at = now + REFRESH_TOKEN_TTL_SECONDS

        store.execute("UPDATE session_tokens SET revoked_at=? WHERE token_hash=?", (now, row["token_hash"]))
        store.execute(
            """
            INSERT INTO session_tokens (token_hash, session_id, token_type, expires_at, revoked_at, created_at)
            VALUES (?, ?, 'access', ?, NULL, ?), (?, ?, 'refresh', ?, NULL, ?)
            """,
            (
                hash_value(cfg.secret, access_token),
                row["session_id"],
                access_expires_at,
                now,
                hash_value(cfg.secret, refresh_token),
                row["session_id"],
                refresh_expires_at,
                now,
            ),
        )
        store.execute(
            "UPDATE sessions SET last_refresh_at=?, refresh_rotation=? WHERE session_id=?",
            (now, int(session["refresh_rotation"] or 0) + 1, row["session_id"]),
        )
        return {
            "session_id": row["session_id"],
            "access_token": access_token,
            "refresh_token": refresh_token,
            "access_expires_at": access_expires_at,
            "refresh_expires_at": refresh_expires_at,
        }

    @app.post("/api/session/revoke")
    async def session_revoke(body: RevokeRequest, request: Request):
        ip = request.client.host if request.client else "unknown"
        if not limiter.check(f"revoke:{ip}", limit=30, window_seconds=60, block_seconds=120):
            return error_response("rate_limited", 429)
        token = str(body.refresh_token or "").strip()
        if not token:
            return error_response("invalid_session", 401)
        now = now_ts()
        token_hash = hash_value(cfg.secret, token)
        row = store.fetch_one(
            "SELECT session_id, revoked_at FROM session_tokens WHERE token_hash=? AND token_type='refresh'",
            (token_hash,),
        )
        if not row or row["revoked_at"] is not None:
            return error_response("invalid_session", 401)

        store.execute("UPDATE sessions SET revoked_at=? WHERE session_id=?", (now, row["session_id"]))
        store.execute("UPDATE session_tokens SET revoked_at=? WHERE session_id=? AND revoked_at IS NULL", (now, row["session_id"]))
        return {"status": "ok"}

    frontend_dir = cfg.frontend_dir.strip()
    if frontend_dir and Path(frontend_dir).exists():
        app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

    return app


app = create_app()
