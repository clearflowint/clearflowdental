"""Deterministic appointment reminder candidates for one tenant.

No messages are sent and no contact details are read. appointments_json is a
JSON-encoded array of appointment rows because Windmill's Python input schema
does not reliably expose nested list[dict] types in its run form.
"""
import json
from datetime import datetime, timedelta, timezone
from typing import Any


def _parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamps must include a timezone")
    return parsed.astimezone(timezone.utc)


def generate_candidates(
    appointments: list[dict[str, Any]],
    tenant_id: str,
    now_iso: str,
    window_hours: int = 24,
) -> dict[str, Any]:
    tenant_id = str(tenant_id or "").strip()
    if not tenant_id:
        raise ValueError("tenant_id is required")
    if not 1 <= int(window_hours) <= 168:
        raise ValueError("window_hours must be between 1 and 168")

    now = _parse_time(now_iso)
    horizon = now + timedelta(hours=int(window_hours))
    candidates = []
    for item in appointments:
        if not isinstance(item, dict):
            continue
        if str(item.get("tenantId", "")) != tenant_id:
            continue
        if item.get("status") not in {"scheduled", "confirmed"}:
            continue
        try:
            starts_at = _parse_time(str(item.get("startsAt", "")))
        except (TypeError, ValueError):
            continue
        if now <= starts_at <= horizon:
            candidates.append({
                "appointmentId": str(item.get("$id", "")),
                "tenantId": tenant_id,
                "patientId": str(item.get("patientId", "")),
                "startsAt": starts_at.isoformat(),
                "candidateType": "upcoming_appointment",
                "deliveryStatus": "not_requested",
            })

    candidates.sort(key=lambda row: (row["startsAt"], row["appointmentId"]))
    return {"candidateCount": len(candidates), "candidates": candidates, "sent": 0}


def main(appointments_json: str, tenant_id: str, now_iso: str, window_hours: int = 24) -> dict[str, Any]:
    try:
        appointments = json.loads(appointments_json)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError("appointments_json must contain a JSON array") from exc
    if not isinstance(appointments, list):
        raise ValueError("appointments_json must contain a JSON array")
    return generate_candidates(appointments, tenant_id, now_iso, window_hours)
