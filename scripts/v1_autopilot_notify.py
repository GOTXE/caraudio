#!/usr/bin/env python3
"""
Send V1 autopilot status updates to Synology Chat when state changes.
"""

import json
import os
import subprocess
import sys
import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STATUS_FILE = ROOT / "logs" / "v1_autopilot_status.json"
NOTIFY_STATE_FILE = ROOT / "logs" / "v1_autopilot_notify_state.json"
SENDER = ROOT / "tech_docs" / "mensajes" / "synology_incoming_send.py"


def load_json(path: Path):
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def make_signature(status: dict) -> str:
    base = {
        "overall": status.get("overall"),
        "states": status.get("states"),
        "phase_counts": status.get("phase_counts"),
        "gates_ok": status.get("gates_ok"),
    }
    return json.dumps(base, sort_keys=True, ensure_ascii=False)


def build_message(status: dict):
    overall = status.get("overall", "unknown")
    run_id = status.get("run_id") or "-"
    states = status.get("states", {})
    phase_counts = status.get("phase_counts", {})
    phase_rows = status.get("phase_gates", [])

    if overall == "complete":
        title = "V1 completada al 100%"
    elif overall == "blocked":
        title = "V1 bloqueada"
    elif overall == "gates_failed":
        title = "V1 error en validaciones"
    else:
        title = "V1 en progreso"

    resumen = (
        f"Estado general: {overall}. run_id={run_id}. "
        f"Tareas: completado={states.get('done', 0)}, pendiente={states.get('todo', 0)}, "
        f"en_progreso={states.get('doing', 0)}, error={states.get('blocked', 0)}."
    )

    details = [
        "Resumen de fases:",
        (
            f"- Completado: {phase_counts.get('done', 0)}\n"
            f"- Pendiente: {phase_counts.get('pending', 0)}\n"
            f"- En progreso: {phase_counts.get('in_progress', 0)}\n"
            f"- Error: {phase_counts.get('blocked', 0)}"
        ),
        f"Gate tecnico: {'OK' if status.get('gates_ok') else 'ERROR'}",
    ]
    if phase_rows:
        status_map = {
            "done": "completado",
            "pending": "pendiente",
            "in_progress": "en progreso",
            "blocked": "error",
        }
        per_phase_lines = []
        for row in phase_rows[:7]:
            phase = row.get("phase", "?")
            gate = row.get("gate", "").strip()
            phase_status = status_map.get(str(row.get("status", "")).lower(), str(row.get("status", "")))
            per_phase_lines.append(f"- {phase}: {phase_status} ({gate})")
        if len(phase_rows) > 7:
            per_phase_lines.append(f"- ... +{len(phase_rows) - 7} fases adicionales")
        details.append("Estado por fase:\n" + "\n".join(per_phase_lines))
    if overall in {"blocked", "gates_failed"}:
        tail = (status.get("gates_output_tail") or "").strip()
        if tail:
            details.append("Error: " + tail.splitlines()[-1][:180])
    detalle = "\n".join(details)

    if overall == "complete":
        action = "V1 ya está en verde total. Puedes cerrar el autopilot."
    elif overall in {"blocked", "gates_failed"}:
        action = "Gotxe, revisa el log de autopilot y corrige el bloqueo para continuar."
    else:
        action = "Seguimos ejecutando automáticamente. Se avisará al próximo cambio relevante."

    return title, resumen, detalle, action


def send_chat(webhook_url: str, title: str, resumen: str, detalle: str, action: str) -> int:
    cmd = [
        sys.executable,
        str(SENDER),
        "--url",
        webhook_url,
        "--prepend-datetime",
        "--pretty",
        "--title",
        title,
        "--text",
        resumen,
        "--detail",
        detalle,
        "--action",
        action,
    ]
    res = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stdout)
        print(res.stderr, file=sys.stderr)
        return 1
    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Notify V1 autopilot status to chat")
    p.add_argument("--dry-run", action="store_true", help="Do not send webhook; print payload preview")
    p.add_argument("--force", action="store_true", help="Send/print even when signature did not change")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    webhook_url = os.getenv("CARAUDIO_CHAT_WEBHOOK_URL", "").strip()
    enabled = os.getenv("V1_AUTOPILOT_NOTIFY", "1").strip() not in {"0", "false", "False"}
    if not enabled or not webhook_url:
        if not args.dry_run:
            return 0

    status = load_json(STATUS_FILE)
    if not status:
        return 0

    signature = make_signature(status)
    prev = load_json(NOTIFY_STATE_FILE) or {}
    prev_sig = prev.get("signature")
    if signature == prev_sig and not args.force:
        return 0

    title, resumen, detalle, action = build_message(status)
    if args.dry_run:
        preview = {
            "dry_run": True,
            "webhook_configured": bool(webhook_url),
            "would_send": True,
            "title": title,
            "resumen": resumen,
            "detalle": detalle,
            "action": action,
        }
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        return 0

    rc = send_chat(webhook_url, title, resumen, detalle, action)
    if rc != 0:
        return rc

    NOTIFY_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    NOTIFY_STATE_FILE.write_text(
        json.dumps({"signature": signature, "last_overall": status.get("overall")}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
