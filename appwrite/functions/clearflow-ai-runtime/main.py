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

def request_json(url, method, headers, body=None):
    raw = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=raw, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=22) as response:
            return json.loads(response.read(2_000_000).decode())
    except urllib.error.HTTPError as exc:
        # Provider error bodies contain the actionable reason (invalid model, malformed
        # request, quota, etc.). Extract only a bounded message; never echo headers or keys.
        try:
            raw_error = exc.read(16384).decode("utf-8", errors="replace")
            parsed = json.loads(raw_error) if raw_error else {}
            detail = parsed.get("error", {}) if isinstance(parsed, dict) else {}
            if isinstance(detail, dict):
                provider_message = detail.get("message") or detail.get("status") or ""
                provider_status = detail.get("status") or ""
            else:
                provider_message = str(detail or "")
                provider_status = ""
        except Exception:
            provider_message, provider_status = "", ""
        provider_message = str(provider_message).replace(key if "key" in locals() else "", "[redacted]") if provider_message else ""
        provider_message = " ".join(provider_message.split())[:240]
        code = int(exc.code)
        if code in (401, 403):
            raise ValueError("The provider rejected this API key. Check the key and its permissions.")
        if code == 429:
            raise RuntimeError("The provider rate limit or quota was reached. Try again after checking provider billing and limits.")
        label = f" ({provider_status})" if provider_status else ""
        detail_text = f": {provider_message}" if provider_message else ""
        raise RuntimeError(f"The selected AI provider returned HTTP {code}{label}{detail_text}.")
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
    except ValueError as exc:
        return respond(context, {"ok": False, "error": str(exc)}, 422)
    except RuntimeError as exc:
        return respond(context, {"ok": False, "error": str(exc)}, 502)
    except Exception:
        context.error("AI runtime request failed; sensitive request details omitted.")
        return respond(context, {"ok": False, "error": "The AI request could not be completed."}, 500)
