from typing import TypedDict
from urllib.parse import quote

import requests


class appwrite_connection(TypedDict):
    endpoint: str
    project_id: str
    api_key: str
    database_id: str


def main(connection: appwrite_connection):
    """
    Verify outbound Windmill -> Appwrite connectivity without reading or changing
    patient/tenant records. The resource must be stored in Windmill, never Git.
    """
    endpoint = connection["endpoint"].rstrip("/")
    project_id = connection["project_id"].strip()
    api_key = connection["api_key"]
    database_id = connection["database_id"].strip()

    if not endpoint.startswith("https://"):
        raise ValueError("Appwrite endpoint must use HTTPS.")
    if not project_id or not api_key or not database_id:
        raise ValueError("Appwrite connection is missing a required field.")

    # Public health probe: validates DNS/TLS/network path without exposing credentials.
    health_response = requests.get(
        f"{endpoint}/health",
        timeout=(5, 10),
        headers={"Accept": "application/json"},
    )
    if not health_response.ok:
        raise RuntimeError(
            f"Appwrite health check failed with HTTP {health_response.status_code}."
        )

    # Authenticated read-only probe: verify project key and access to the selected DB.
    database_response = requests.get(
        f"{endpoint}/tablesdb/{quote(database_id, safe='')}",
        timeout=(5, 10),
        headers={
            "Accept": "application/json",
            "X-Appwrite-Project": project_id,
            "X-Appwrite-Key": api_key,
        },
    )
    if not database_response.ok:
        # Do not include response bodies, URLs with credentials, or secrets in logs.
        raise RuntimeError(
            "Authenticated Appwrite database probe failed with HTTP "
            f"{database_response.status_code}. Check endpoint, project ID, "
            "database ID, and the API key's least-privilege scopes."
        )

    database = database_response.json()
    return {
        "status": "ok",
        "integration": "windmill_to_appwrite",
        "health_check": "passed",
        "authenticated_read_check": "passed",
        "project_id": project_id,
        "database_id": database_id,
        "database_name": database.get("name"),
        "writes_performed": False,
        "clinical_records_read": False,
    }
