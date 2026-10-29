import test from 'node:test';
import assert from 'node:assert/strict';
import { runWindmillAi } from '../src/ai-windmill.js';

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('Windmill bridge requires its shared webhook secret', async () => {
  const originalSecret = process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
  const originalFetch = globalThis.fetch;
  delete process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
  let called = false;
  globalThis.fetch = async () => { called = true; return response({}); };
  try {
    await assert.rejects(
      () => runWindmillAi({ action: 'chat' }),
      error => error.status === 503 && /not configured/.test(error.message)
    );
    assert.equal(called, false);
  } finally {
    if (originalSecret === undefined) delete process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
    else process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET = originalSecret;
    globalThis.fetch = originalFetch;
  }
});

test('chat forwards the verified tenant envelope to Windmill and accepts normalized reply', async () => {
  const originalSecret = process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
  const originalUrl = process.env.CLEARFLOW_WINDMILL_AI_URL;
  const originalFetch = globalThis.fetch;
  process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.CLEARFLOW_WINDMILL_AI_URL = 'https://windmill.test/api/dental/ai/chat';
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options, body: JSON.parse(options.body) };
    return response({ ok: true, status: 'completed', reply: 'Synthetic reply', usage: { input: 2, output: 3 } });
  };
  try {
    const payload = { action: 'chat', tenantId: 'tenant-test', actorId: 'actor-test', providerId: 'openai', modelId: 'new-model', message: 'synthetic only' };
    const result = await runWindmillAi(payload);
    assert.equal(captured.url, 'https://windmill.test/api/dental/ai/chat');
    assert.equal(captured.options.headers['X-ClearFlow-Webhook-Key'], 'test-webhook-secret');
    assert.deepEqual(captured.body, payload);
    assert.equal(result.reply, 'Synthetic reply');
  } finally {
    if (originalSecret === undefined) delete process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
    else process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET = originalSecret;
    if (originalUrl === undefined) delete process.env.CLEARFLOW_WINDMILL_AI_URL;
    else process.env.CLEARFLOW_WINDMILL_AI_URL = originalUrl;
    globalThis.fetch = originalFetch;
  }
});

test('model discovery accepts a ready model catalogue response', async () => {
  const originalSecret = process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
  const originalFetch = globalThis.fetch;
  process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET = 'test-webhook-secret';
  globalThis.fetch = async () => response({ ok: true, status: 'ready', models: [{ id: 'fresh-model', name: 'fresh-model' }] });
  try {
    const result = await runWindmillAi({ action: 'models', tenantId: 'tenant-test', actorId: 'actor-test', providerId: 'openai' });
    assert.equal(result.models[0].id, 'fresh-model');
  } finally {
    if (originalSecret === undefined) delete process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
    else process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET = originalSecret;
    globalThis.fetch = originalFetch;
  }
});

test('Windmill provider-not-connected response is mapped to a conflict', async () => {
  const originalSecret = process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
  const originalFetch = globalThis.fetch;
  process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET = 'test-webhook-secret';
  globalThis.fetch = async () => response({ ok: false, status: 'provider_not_connected', message: 'Connect provider key.' });
  try {
    await assert.rejects(
      () => runWindmillAi({ action: 'chat' }),
      error => error.status === 409 && /Connect provider key/.test(error.message)
    );
  } finally {
    if (originalSecret === undefined) delete process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
    else process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET = originalSecret;
    globalThis.fetch = originalFetch;
  }
});
