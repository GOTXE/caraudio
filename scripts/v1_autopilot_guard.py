#!/usr/bin/env python3
"""
V1 autopilot guard:
- Reads V1 progress tracker states.
- Runs gate checks.
- Writes machine-readable status file.

Exit codes:
- 0: V1 complete (all tasks done + gate checks pass)
- 2: Not complete yet (normal running state)
- 3: Blocked tasks detected
- 4: Gate checks failed
"""

import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TRACKER = ROOT / "tech_docs" / "V1_16_progress_tracker.md"
LOG_DIR = ROOT / "logs"
STATUS_FILE = LOG_DIR / "v1_autopilot_status.json"
GATE_CMD = ROOT / "scripts" / "v1_gate_check.sh"


def now_iso() -> str:
    return dt.datetime.now().isoformat(timespec="seconds")


def parse_tracker(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Tracker no encontrado: {path}")

    states = {"todo": 0, "doing": 0, "blocked": 0, "done": 0}
    task_rows = []
    phase_rows = []
    row_re = re.compile(r"^\|\s*(V1-[^|]+)\s*\|\s*([^|]+)\s*\|")
    phase_re = re.compile(r"^\|\s*(F[0-9.]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|")

    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        pm = phase_re.match(raw.strip())
        if pm:
            phase = pm.group(1).strip()
            gate = pm.group(2).strip()
            status = pm.group(3).strip().lower()
            if status in {"pending", "done", "blocked", "in_progress"}:
                phase_rows.append({"phase": phase, "gate": gate, "status": status})

        m = row_re.match(raw.strip())
        if not m:
            continue
        task_id = m.group(1).strip()
        state = m.group(2).strip().lower()
        if state in states:
            states[state] += 1
            task_rows.append((task_id, state))

    return states, task_rows, phase_rows


def run_gates() -> tuple[bool, str]:
    try:
        res = subprocess.run(
            [str(GATE_CMD)],
            cwd=str(ROOT),
            check=False,
            capture_output=True,
            text=True,
        )
        out = (res.stdout or "") + (res.stderr or "")
        return (res.returncode == 0), out.strip()
    except Exception as exc:  # pragma: no cover
        return False, f"Exception gate check: {exc}"


def write_status(payload: dict) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    STATUS_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    run_id = os.getenv("V1_AUTOPILOT_RUN_ID", "").strip() or None
    states, rows, phase_rows = parse_tracker(TRACKER)
    gates_ok, gates_output = run_gates()

    blocked = states["blocked"] > 0
    all_done = states["todo"] == 0 and states["doing"] == 0 and states["blocked"] == 0 and states["done"] > 0

    if blocked:
        code = 3
        overall = "blocked"
    elif all_done and gates_ok:
        code = 0
        overall = "complete"
    elif not gates_ok:
        code = 4
        overall = "gates_failed"
    else:
        code = 2
        overall = "in_progress"

    payload = {
        "timestamp": now_iso(),
        "run_id": run_id,
        "overall": overall,
        "exit_code": code,
        "states": states,
        "tasks_detected": len(rows),
        "phase_gates": phase_rows,
        "phase_counts": {
            "done": sum(1 for p in phase_rows if p["status"] == "done"),
            "pending": sum(1 for p in phase_rows if p["status"] == "pending"),
            "blocked": sum(1 for p in phase_rows if p["status"] == "blocked"),
            "in_progress": sum(1 for p in phase_rows if p["status"] == "in_progress"),
        },
        "gates_ok": gates_ok,
        "gates_output_tail": gates_output[-4000:],
    }
    write_status(payload)

    print(json.dumps(payload, ensure_ascii=False))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
