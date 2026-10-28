"""Deterministic appointment reminder candidate generator for Windmill.

This script intentionally does not send messages, read contact details, or make
clinical decisions. It processes one clinic tenant per invocation and emits
only the IDs and scheduling metadata needed for a later, separately approved
delivery workflow.
"""
from datetime import datetime, timedelta, timezone
from typing import Any


def _parse_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamps must include a timezone")
    return parsed.astimezone(timezone.utc)


def main(
    appointments: list[dict[str, Any]],
    tenant_id: str,
    now_iso: str,
    window_hours: int = 24,
) -> dict[str, Any]:
    """Return deterministic reminder candidates for a single tenant."""
    tenant_id = str(tenant_id or "").strip()
    if not tenant_id:
        raise ValueError("tenant_id is required")
    if not 1 <= int(window_hours) <= 168:
        raise ValueError("window_hours must be between 1 and 168")

    now = _parse_time(now_iso)
    horizon = now + timedelta(hours=int(window_hours))
    candidates = []
    for item in appointments:
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
