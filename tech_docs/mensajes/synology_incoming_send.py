#!/usr/bin/env python3
"""
Send messages to Synology Chat incoming webhook (Python 3.8+).
"""

import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, Tuple


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Send message to Synology incoming webhook")
    parser.add_argument("--url", required=True, help="Incoming webhook URL")
    parser.add_argument("--text", required=True, help="Message text")
    parser.add_argument("--file-url", default="", help="Optional file URL for attachment")
    parser.add_argument("--title", default="", help="Optional short title for pretty format")
    parser.add_argument("--detail", default="", help="Optional detail block for pretty format")
    parser.add_argument("--action", default="", help="Optional action required block for pretty format")
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Format message with multiline sections for better readability",
    )
    parser.add_argument(
        "--prepend-datetime",
        action="store_true",
        help="Prepend local datetime group like [YYYY-MM-DD HH:MM:SS] to the message",
    )
    parser.add_argument(
        "--min-interval",
        type=float,
        default=1.2,
        help="Minimum seconds between sends across invocations (default: 1.2)",
    )
    parser.add_argument(
        "--retry-on-rate-limit",
        action="store_true",
        default=True,
        help="Retry automatically when Synology returns code 411 (default: enabled)",
    )
    parser.add_argument(
        "--no-retry-on-rate-limit",
        dest="retry_on_rate_limit",
        action="store_false",
        help="Disable automatic retry for code 411",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="Max retries for rate-limit errors (default: 3)",
    )
    parser.add_argument(
        "--retry-delay",
        type=float,
        default=1.0,
        help="Base retry delay in seconds for rate-limit errors (default: 1.0)",
    )
    return parser.parse_args()


def build_pretty_text(args: argparse.Namespace, prefix: str) -> str:
    parts = []
    if args.title:
        parts.append(f"{prefix} {args.title}".strip())
    else:
        parts.append(f"{prefix} Aviso".strip())

    parts.append("")
    parts.append("Resumen:")
    parts.append(args.text)

    if args.detail:
        parts.append("")
        parts.append("Detalle:")
        parts.append(args.detail)

    if args.action:
        parts.append("")
        parts.append("Accion requerida:")
        parts.append(args.action)

    # Visual separator to add breathing room between consecutive chat messages.
    parts.append("")
    parts.append("────────────")

    return "\n".join(parts)


def _state_file_path() -> Path:
    custom = os.getenv("SYNOCHAT_SEND_STATE_FILE", "").strip()
    if custom:
        return Path(custom)
    return Path("/tmp/synochat_send_state.json")


def _load_last_sent(path: Path) -> float:
    if not path.exists():
        return 0.0
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return float(data.get("last_sent_epoch", 0.0))
    except Exception:
        return 0.0


def _save_last_sent(path: Path, epoch: float) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump({"last_sent_epoch": epoch}, f)


def _enforce_min_interval(min_interval: float) -> None:
    if min_interval <= 0:
        return
    state_path = _state_file_path()
    last_sent = _load_last_sent(state_path)
    now = time.time()
    delta = now - last_sent
    if delta < min_interval:
        time.sleep(min_interval - delta)


def _mark_sent_now() -> None:
    _save_last_sent(_state_file_path(), time.time())


def _send_once(url: str, payload: Dict) -> Tuple[bool, Dict]:
    body = urllib.parse.urlencode({"payload": json.dumps(payload)}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    try:
        out = json.loads(raw)
    except json.JSONDecodeError:
        out = {"raw": raw, "success": False}
    success = bool(out.get("success", False))
    return success, out


def main() -> int:
    args = parse_args()
    text = args.text
    prefix = ""
    if args.prepend_datetime:
        stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = f"[{stamp}]"

    if args.pretty:
        text = build_pretty_text(args, prefix)
    elif prefix:
        text = f"{prefix} {text}"

    payload = {"text": text}
    if args.file_url:
        payload["file_url"] = args.file_url

    try:
        attempts = args.max_retries + 1
        for attempt in range(1, attempts + 1):
            _enforce_min_interval(args.min_interval)
            ok, out = _send_once(args.url, payload)
            if ok:
                _mark_sent_now()
                print(json.dumps(out, ensure_ascii=False))
                return 0

            error_code = None
            try:
                error_code = int(out.get("error", {}).get("code"))
            except Exception:
                error_code = None

            is_rate_limit = error_code == 411
            if (
                args.retry_on_rate_limit
                and is_rate_limit
                and attempt < attempts
            ):
                wait_s = max(0.1, args.retry_delay) * (2 ** (attempt - 1))
                time.sleep(wait_s)
                continue

            print(json.dumps(out, ensure_ascii=False), file=sys.stderr)
            return 1
    except Exception as exc:  # pylint: disable=broad-except
        print("ERROR:", exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
