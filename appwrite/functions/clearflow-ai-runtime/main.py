import json
import urllib.request
import urllib.error
import urllib.parse
import time

PROVIDERS = {
    "openai": ("openai", "https://api.openai.com/v1/models", "https://api.openai.com/v1/chat/completions"),
    "groq": ("openai", "https://api.groq.com/openai/v1/models", "https://api.groq.com/openai/v1/chat/completions"),
    "mistral": ("openai", "https://api.mistral.ai/v1/models", "https://api.mistral.ai/v1/chat/completions"),
    "xai": ("openai", "https://api.x.ai/v1/models", "https://api.x.ai/v1/chat/completions"),
    "anthropic": ("anthropic", "https://api.anthropic.com/v1/models", "https://api.anthropic.com/v1/messages"),
    "google": ("google", "https://generativelanguage.googleapis.com/v1beta/models", "https://generativelanguage.googleapis.com/v1beta/models"),
}

def respond(context, data, status=200):
    return context.res.json(data, status)

class ProviderHTTPError(Exception):
    def __init__(self, status, message, provider_code="", provider_type="", diagnostics=None):
        super().__init__(message)
        self.status = int(status)
        self.provider_code = str(provider_code or "")[:80]
        self.provider_type = str(provider_type or "")[:80]
        self.diagnostics = diagnostics or {}


def request_json(url, method, headers, body=None):
    raw = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=raw, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=22) as response:
            return json.loads(response.read(2_000_000).decode())
    except urllib.error.HTTPError as exc:
        # Preserve the provider's actionable error while strictly bounding and
        # sanitizing it. Never include request headers, credentials, or prompts.
        raw_error = ""
        try:
            raw_error = exc.read(16384).decode("utf-8", errors="replace")
        except Exception:
            pass
        provider_message = ""
        provider_code = ""
        provider_type = ""
        # Capture only non-sensitive edge metadata useful for identifying a
        # provider-side Cloudflare challenge. Never log cookies or auth headers.
        response_headers = getattr(exc, "headers", {}) or {}
        diagnostics = {
            "server": str(response_headers.get("server", ""))[:80],
            "cfRay": str(response_headers.get("cf-ray", ""))[:80],
            "cfMitigated": str(response_headers.get("cf-mitigated", ""))[:40],
            "contentType": str(response_headers.get("content-type", ""))[:100],
            "via": str(response_headers.get("via", ""))[:100],
            "bodyKind": "html" if "<html" in raw_error.lower() or "<!doctype html" in raw_error.lower() else "json" if raw_error.lstrip().startswith("{") else "text" if raw_error else "empty",
        }
        try:
            parsed = json.loads(raw_error) if raw_error else {}
            detail = parsed.get("error", parsed) if isinstance(parsed, dict) else {}
            if isinstance(detail, dict):
                provider_message = detail.get("message") or detail.get("detail") or detail.get("status") or ""
                provider_code = detail.get("code") or ""
                provider_type = detail.get("type") or detail.get("status") or ""
            elif isinstance(detail, str):
                provider_message = detail
        except (ValueError, TypeError):
            # Some gateways return plain text or HTML instead of JSON.
            provider_message = raw_error

        def safe_text(value, limit):
            value = str(value or "")
            value = value.replace("\\n", " ").replace("\\r", " ")
            value = " ".join(value.split())
            # Defensive redaction for any credential-like text in upstream errors.
            value = __import__("re").sub(r"(?i)(bearer\\s+)[^\\s,;]+", r"\\1[redacted]", value)
            value = __import__("re").sub(r"(?i)(api[_-]?key\\s*[:=]\\s*)[^\\s,;]+", r"\\1[redacted]", value)
            return value[:limit]

        provider_message = safe_text(provider_message, 240)
        provider_code = safe_text(provider_code, 80)
        provider_type = safe_text(provider_type, 80)
        code = int(exc.code)
        label = "unauthorized" if code == 401 else "forbidden" if code == 403 else "provider error"
        code_text = f" [{provider_code}]" if provider_code else ""
        type_text = f" ({provider_type})" if provider_type and provider_type != provider_code else ""
        detail_text = f": {provider_message}" if provider_message else ""
        raise ProviderHTTPError(
            code,
            f"Provider request failed (HTTP {code} {label}){code_text}{type_text}{detail_text}.",
            provider_code=provider_code,
            provider_type=provider_type,
            diagnostics=diagnostics,
        )
    except (urllib.error.URLError, TimeoutError):
        raise RuntimeError("Could not reach the selected AI provider. Try again.")

def headers_for(provider, key):
    if provider == "anthropic":
        return {"x-api-key": key, "anthropic-version": "2023-06-01", "Accept": "application/json"}
    if provider == "google":
        return {"x-goog-api-key": key, "Accept": "application/json"}
    return {"Authorization": "Bearer " + key, "Accept": "application/json"}

def list_models(provider, key):
    _, endpoint, _ = PROVIDERS[provider]
    if provider == "anthropic":
        endpoint += "?limit=1000"
    data = request_json(endpoint, "GET", headers_for(provider, key))
    items = data.get("data") if isinstance(data.get("data"), list) else data.get("models", [])
    result = set()
    for item in items:
        if provider == "google" and isinstance(item, dict):
            supported = item.get("supportedGenerationMethods", [])
            if supported and "generateContent" not in supported:
                continue
        value = item if isinstance(item, str) else item.get("id") or item.get("name") or ""
        if isinstance(value, str):
            if provider == "google" and value.startswith("models/"):
                value = value[7:]
            if value and len(value) <= 200 and not any(ord(c) < 32 for c in value):
                result.add(value)
    return [{"id": x, "name": x} for x in sorted(result)[:500]]

def chat(provider, model, key, messages):
    style, _, endpoint = PROVIDERS[provider]
    headers = headers_for(provider, key)
    headers["Content-Type"] = "application/json"
    if style == "anthropic":
        data = request_json(endpoint, "POST", headers, {"model": model, "max_tokens": 1200, "messages": messages})
        reply = "\n".join(x.get("text", "") for x in data.get("content", []) if x.get("type") == "text")
    elif style == "google":
        endpoint += "/" + urllib.parse.quote(model, safe="") + ":generateContent"
        contents = [{"role": "model" if x["role"] == "assistant" else "user", "parts": [{"text": x["content"]}]} for x in messages]
        data = request_json(endpoint, "POST", headers, {"contents": contents, "generationConfig": {"maxOutputTokens": 1200}})
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        reply = "\n".join(x.get("text", "") for x in parts)
    else:
        data = request_json(endpoint, "POST", headers, {"model": model, "messages": messages, "max_tokens": 1200})
        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    reply = str(reply).strip()
    if not reply:
        raise RuntimeError("The provider returned an empty response.")
    return reply

def main(context):
    if context.req.method != "POST":
        return respond(context, {"ok": False, "error": "Method not allowed."}, 405)
    try:
        body = context.req.body_json or {}
        action = body.get("action")
        if action == "health":
            return respond(context, {"ok": True, "status": "ready", "runtime": "python-3.12"})
        if action not in ("models", "chat"):
            return respond(context, {"ok": False, "error": "Unknown action."}, 400)
        provider = str(body.get("providerId") or "")
        if provider not in PROVIDERS:
            return respond(context, {"ok": False, "error": "Choose a supported AI provider."}, 400)
        key = body.get("apiKey")
        if not isinstance(key, str) or len(key.strip()) < 12 or len(key) > 4096:
            return respond(context, {"ok": False, "error": "A valid provider key is required."}, 400)
        key = key.strip()
        if action == "models":
            return respond(context, {"ok": True, "status": "ready", "models": list_models(provider, key)})
        model = body.get("modelId")
        if not isinstance(model, str) or not model.strip() or len(model) > 200:
            return respond(context, {"ok": False, "error": "Choose a valid model."}, 400)
        messages = body.get("messages")
        if not isinstance(messages, list) or not messages:
            messages = [{"role": "user", "content": str(body.get("message") or "").strip()}]
        safe = []
        for item in messages[-12:]:
            if isinstance(item, dict) and item.get("role") in ("user", "assistant") and isinstance(item.get("content"), str):
                value = item["content"].strip()[-4000:]
                if value:
                    safe.append({"role": item["role"], "content": value})
        if not safe:
            return respond(context, {"ok": False, "error": "Enter a question first."}, 400)
        started = time.time()
        reply = chat(provider, model.strip(), key, safe)
        return respond(context, {"ok": True, "status": "completed", "reply": reply, "latencyMs": int((time.time()-started)*1000), "clinicalDataChanged": False})
    except ProviderHTTPError as exc:
        # Appwrite execution records expose function logs even when responseBody
        # is omitted by the execution metadata API. This diagnostic contains only
        # provider error metadata; it never includes keys, headers, or prompts.
        diagnostic = {
            "event": "AI_PROVIDER_HTTP_ERROR",
            "provider": str(body.get("providerId") or "")[:40],
            "action": str(body.get("action") or "")[:20],
            "httpStatus": exc.status,
            "providerCode": exc.provider_code,
            "providerType": exc.provider_type,
            "responseMetadata": exc.diagnostics,
            "message": str(exc)[:420],
        }
        context.log(json.dumps(diagnostic, separators=(",", ":")))
        status = 422 if exc.status in (401, 403) else 502
        return respond(context, {"ok": False, "error": str(exc)}, status)
    except ValueError as exc:
        return respond(context, {"ok": False, "error": str(exc)}, 422)
    except RuntimeError as exc:
        return respond(context, {"ok": False, "error": str(exc)}, 502)
    except Exception:
        context.error("AI runtime request failed; sensitive request details omitted.")
        return respond(context, {"ok": False, "error": "The AI request could not be completed."}, 500)
