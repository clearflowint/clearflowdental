import { getProvider } from './ai-config.js';

const MAX_MODELS = 500;
const REQUEST_TIMEOUT_MS = 12000;

function httpError(message, status = 502) {
  return Object.assign(new Error(message), { status });
}

function modelIdFrom(item, providerId) {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return '';
  const raw = item.id || item.name || '';
  if (typeof raw !== 'string') return '';
  return providerId === 'google' ? raw.replace(/^models\//, '') : raw;
}

export function normalizeModels(providerId, payload) {
  const provider = getProvider(providerId);
  if (!provider) return [];
  const items = Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.models) ? payload.models : [];
  return [...new Set(items
    .map(item => modelIdFrom(item, providerId).trim())
    .filter(id => id && id.length <= 200 && !/[\u0000-\u001f]/.test(id)))]
    .slice(0, MAX_MODELS)
    .sort((a, b) => a.localeCompare(b));
}

async function fetchJson(url, options, providerId) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    throw httpError('Could not reach the selected AI provider. Try again.', 502);
  }

  let data = {};
  try { data = await response.json(); } catch { /* handled as a provider error below */ }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw httpError('The provider rejected this API key. Check the key and try again.', 422);
    }
    if (response.status === 429) {
      throw httpError('The provider rate limit was reached. Try again shortly.', 429);
    }
    throw httpError(`The ${getProvider(providerId)?.name || 'AI'} provider returned HTTP ${response.status}.`, 502);
  }
  return data;
}

export async function listProviderModels(providerId, apiKey) {
  const provider = getProvider(providerId);
  if (!provider) throw httpError('Choose a supported AI provider.', 400);
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw httpError('Connect this clinic’s provider API key to discover models.', 409);
  }

  const key = apiKey.trim();
  let url = provider.modelsUrl;
  const headers = { Accept: 'application/json' };

  if (provider.apiStyle === 'anthropic') {
    headers['x-api-key'] = key;
    headers['anthropic-version'] = '2023-06-01';
    url += '?limit=1000';
  } else if (provider.apiStyle === 'google') {
    url += '?key=' + encodeURIComponent(key);
  } else {
    headers.Authorization = 'Bearer ' + key;
  }

  const payload = await fetchJson(url, { method: 'GET', headers }, providerId);
  return normalizeModels(providerId, payload).map(id => ({ id, name: id }));
}

export async function generateChat({ providerId, modelId, apiKey, message }) {
  const provider = getProvider(providerId);
  if (!provider) throw httpError('Choose a supported AI provider.', 400);
  if (typeof modelId !== 'string' || !modelId.trim() || modelId.length > 200) {
    throw httpError('Choose a model from the selected provider.', 400);
  }

  const key = String(apiKey || '').trim();
  const content = String(message || '').trim();
  let url = provider.chatUrl;
  let headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  let body;

  if (provider.apiStyle === 'anthropic') {
    headers['x-api-key'] = key;
    headers['anthropic-version'] = '2023-06-01';
    body = { model: modelId, max_tokens: 1200, messages: [{ role: 'user', content }] };
  } else if (provider.apiStyle === 'google') {
    url += '/' + encodeURIComponent(modelId) + ':generateContent?key=' + encodeURIComponent(key);
    body = { contents: [{ parts: [{ text: content }] }], generationConfig: { maxOutputTokens: 1200 } };
  } else {
    headers.Authorization = 'Bearer ' + key;
    body = { model: modelId, messages: [{ role: 'user', content }], max_tokens: 1200 };
  }

  const data = await fetchJson(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  }, providerId);

  let reply = '';
  let usage = { input: 0, output: 0 };
  if (provider.apiStyle === 'anthropic') {
    reply = (data.content || []).filter(part => part.type === 'text').map(part => part.text).join('\n');
    usage = { input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 };
  } else if (provider.apiStyle === 'google') {
    reply = (data.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n');
    usage = { input: data.usageMetadata?.promptTokenCount || 0, output: data.usageMetadata?.candidatesTokenCount || 0 };
  } else {
    reply = data.choices?.[0]?.message?.content || '';
    usage = { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 };
  }

  reply = String(reply).trim();
  if (!reply) throw httpError('The provider returned an empty response. Try again.', 502);
  return { reply, usage };
}
