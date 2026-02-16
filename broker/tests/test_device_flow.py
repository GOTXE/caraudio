import sqlite3
import sys
import time
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from broker.app.main import BrokerConfig, create_app


def build_client(tmp_path, monkeypatch, *, navidrome_ok=True) -> tuple[TestClient, str]:
    async def fake_validate(server_url: str, username: str, password: str) -> bool:
        return navidrome_ok and bool(server_url and username and password)

    monkeypatch.setattr("broker.app.main.validate_navidrome_credentials", fake_validate)
    db_path = str(tmp_path / "broker-test.db")
    app = create_app(
        BrokerConfig(
            db_path=db_path,
            secret="test-secret",
            allowed_origins=["http://localhost:8080"],
            frontend_dir="",
        )
    )
    return TestClient(app), db_path


def test_device_flow_refresh_rotation_and_revoke(tmp_path, monkeypatch):
    client, _ = build_client(tmp_path, monkeypatch, navidrome_ok=True)

    start = client.post("/api/device/start", json={"server_url": "https://music.local"})
    assert start.status_code == 200
    payload = start.json()
    assert "device_code" in payload
    assert "user_code" in payload

    verify = client.post("/api/device/verify", json={"user_code": payload["user_code"]})
    assert verify.status_code == 200
    verification_token = verify.json()["verification_token"]

    complete = client.post(
        "/api/device/complete",
        json={"verification_token": verification_token, "username": "gotxe", "password": "secret"},
    )
    assert complete.status_code == 200
    assert complete.json()["status"] == "ok"

    reused_code = client.post("/api/device/verify", json={"user_code": payload["user_code"]})
    assert reused_code.status_code == 400
    assert reused_code.json()["error"] == "invalid_code"

    poll = client.post("/api/device/poll", json={"device_code": payload["device_code"]})
    assert poll.status_code == 200
    approved = poll.json()
    assert approved["status"] == "approved"
    assert approved["server_url"] == "https://music.local"
    assert approved["username"] == "gotxe"
    assert approved["auth_salt"]
    assert approved["auth_token"]
    assert approved["access_token"]
    assert approved["refresh_token"]

    consumed = client.post("/api/device/poll", json={"device_code": payload["device_code"]})
    assert consumed.status_code == 200
    assert consumed.json()["status"] == "consumed"

    refresh_1 = client.post("/api/session/refresh", json={"refresh_token": approved["refresh_token"]})
    assert refresh_1.status_code == 200
    refreshed = refresh_1.json()
    assert refreshed["refresh_token"] != approved["refresh_token"]
    assert refreshed["access_token"] != approved["access_token"]

    refresh_old = client.post("/api/session/refresh", json={"refresh_token": approved["refresh_token"]})
    assert refresh_old.status_code == 401
    assert refresh_old.json()["error"] == "invalid_session"
    assert "error_id" in refresh_old.json()

    revoke = client.post("/api/session/revoke", json={"refresh_token": refreshed["refresh_token"]})
    assert revoke.status_code == 200
    assert revoke.json()["status"] == "ok"

    refresh_after_revoke = client.post("/api/session/refresh", json={"refresh_token": refreshed["refresh_token"]})
    assert refresh_after_revoke.status_code == 401
    assert refresh_after_revoke.json()["error"] == "invalid_session"


def test_complete_rejects_invalid_navidrome_credentials(tmp_path, monkeypatch):
    client, _ = build_client(tmp_path, monkeypatch, navidrome_ok=False)

    start = client.post("/api/device/start", json={"server_url": "https://music.local"})
    code = start.json()["user_code"]

    verify = client.post("/api/device/verify", json={"user_code": code})
    token = verify.json()["verification_token"]

    bad = client.post(
        "/api/device/complete",
        json={"verification_token": token, "username": "bad", "password": "bad"},
    )
    assert bad.status_code == 401
    payload = bad.json()
    assert payload["error"] == "invalid_credentials"
    assert "error_id" in payload


def test_verify_returns_expired_when_code_ttl_is_over(tmp_path, monkeypatch):
    client, db_path = build_client(tmp_path, monkeypatch, navidrome_ok=True)
    start = client.post("/api/device/start", json={"server_url": "https://music.local"})
    code = start.json()["user_code"]

    with sqlite3.connect(db_path) as conn:
        conn.execute("UPDATE device_requests SET expires_at=?, status='pending' WHERE 1=1", (int(time.time()) - 1,))
        conn.commit()

    verify = client.post("/api/device/verify", json={"user_code": code})
    assert verify.status_code == 200
    assert verify.json()["status"] == "expired"
