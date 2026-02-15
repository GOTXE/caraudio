#!/usr/bin/env python3
"""
Capture an incident snapshot when autopilot enters failure states.
Python stdlib only (3.8+).
"""

import argparse
import datetime as dt
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "logs"
STATUS_FILE = LOG_DIR / "v1_autopilot_status.json"
INCIDENTS_DIR = LOG_DIR / "incidents"
INCIDENT_SIG_FILE = LOG_DIR / "v1_last_incident_signature.json"
TRACKER_FILE = ROOT / "tech_docs" / "V1_16_progress_tracker.md"


def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, cwd=str(ROOT), check=False, capture_output=True, text=True)
        return {
            "cmd": " ".join(cmd),
            "rc": res.returncode,
            "stdout": (res.stdout or "").strip(),
            "stderr": (res.stderr or "").strip(),
        }
    except Exception as exc:  # pragma: no cover
        return {"cmd": " ".join(cmd), "rc": -1, "stdout": "", "stderr": str(exc)}


def load_json(path: Path):
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def get_active_task():
    if not TRACKER_FILE.exists():
        return None
    for line in TRACKER_FILE.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line.startswith("| V1-"):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) < 2:
            continue
        task_id, state = parts[0], parts[1].lower()
        if state == "doing":
            return task_id
    return None


def make_signature(payload):
    base = {
        "reason": payload.get("reason"),
        "overall": (payload.get("status") or {}).get("overall"),
        "states": (payload.get("status") or {}).get("states"),
        "gates_ok": (payload.get("status") or {}).get("gates_ok"),
        "error_tail": (payload.get("status") or {}).get("gates_output_tail"),
    }
    return json.dumps(base, sort_keys=True, ensure_ascii=False)


def parse_args():
    p = argparse.ArgumentParser(description="Capture V1 autopilot incident snapshot")
    p.add_argument("--reason", required=True, help="blocked|gates_failed|guard_error")
    p.add_argument("--rc", type=int, default=0, help="Loop RC associated with incident")
    p.add_argument("--force", action="store_true", help="Capture even if signature is unchanged")
    return p.parse_args()


def main():
    args = parse_args()
    now = dt.datetime.now()
    ts = now.isoformat(timespec="seconds")
    run_id = os.getenv("V1_AUTOPILOT_RUN_ID", "").strip() or "unknown-run"

    status = load_json(STATUS_FILE) or {}
    payload = {
        "timestamp": ts,
        "reason": args.reason,
        "rc": args.rc,
        "run_id": run_id,
        "active_task": get_active_task(),
        "status": status,
        "git": {
            "branch": run_cmd(["git", "branch", "--show-current"]),
            "status_short": run_cmd(["git", "status", "--short"]),
            "head": run_cmd(["git", "rev-parse", "--short", "HEAD"]),
        },
        "diagnostics": {
            "python": run_cmd(["python3", "--version"]),
            "node": run_cmd(["bash", "-lc", "command -v node || true"]),
            "gate_check_last": (status.get("gates_output_tail") or "")[-3000:],
            "autopilot_log_tail": run_cmd(["bash", "-lc", "tail -n 80 logs/v1_autopilot.log || true"]),
        },
    }

    signature = make_signature(payload)
    prev = load_json(INCIDENT_SIG_FILE) or {}
    if not args.force and prev.get("signature") == signature:
        print("incident_skipped=duplicate")
        return 0

    INCIDENTS_DIR.mkdir(parents=True, exist_ok=True)
    safe_run = "".join(c for c in run_id if c.isalnum() or c in ("-", "_"))[:48] or "run"
    name = f"{now.strftime('%Y%m%d_%H%M%S')}_{args.reason}_{safe_run}.json"
    out = INCIDENTS_DIR / name
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    INCIDENT_SIG_FILE.write_text(
        json.dumps({"signature": signature, "last_incident_file": str(out)}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(str(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

