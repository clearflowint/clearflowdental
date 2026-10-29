import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_PROVIDERS, getProvider, isSupportedProvider, isSupportedProviderModel } from '../src/ai-config.js';
import { normalizeModels, listProviderModels, generateChat } from '../src/ai-gateway.js';

test('provider catalogue has unique identifiers and API endpoints', () => {
  const ids = AI_PROVIDERS.map(provider => provider.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const provider of AI_PROVIDERS) {
    assert.ok(provider.name);
    assert.ok(provider.modelsUrl.startsWith('https://'));
    assert.ok(provider.chatUrl.startsWith('https://'));
  }
});

test('model IDs are validated without a hardcoded model allowlist', () => {
  assert.equal(isSupportedProvider('openai'), true);
  assert.equal(isSupportedProvider('unknown'), false);
  assert.equal(isSupportedProviderModel('openai', 'a-new-model-released-today'), true);
  assert.equal(isSupportedProviderModel('openai', ''), false);
  assert.equal(isSupportedProviderModel('openai', 'x'.repeat(201)), false);
  assert.equal(isSupportedProviderModel('unknown', 'model'), false);
});

test('normalizes provider model catalogue formats and removes duplicates', () => {
  assert.deepEqual(
    normalizeModels('openai', { data: [{ id: 'model-b' }, { id: 'model-a' }, { id: 'model-a' }] }),
    ['model-a', 'model-b']
  );
  assert.deepEqual(
    normalizeModels('google', { models: [{ name: 'models/gemini-one' }, { name: 'models/gemini-two' }] }),
    ['gemini-one', 'gemini-two']
  );
});

test('discovers models using the provider API key without storing it', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestedHeaders = {};
  globalThis.fetch = async (url, options) => {
    requestedUrl = String(url);
    requestedHeaders = options.headers;
    return { ok: true, status: 200, json: async () => ({ data: [{ id: 'new-model-id' }] }) };
  };
  try {
    const models = await listProviderModels('openai', 'temporary-test-key');
    assert.deepEqual(models, [{ id: 'new-model-id', name: 'new-model-id' }]);
    assert.equal(requestedUrl, 'https://api.openai.com/v1/models');
    assert.equal(requestedHeaders.Authorization, 'Bearer temporary-test-key');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('chat uses a dynamically supplied model ID and normalizes response usage', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: 'Hello from model' } }], usage: { prompt_tokens: 3, completion_tokens: 4 } })
    };
  };
  try {
    const result = await generateChat({ providerId: 'openai', modelId: 'fresh-model-id', apiKey: 'temporary-test-key', message: 'Hello' });
    assert.equal(requestBody.model, 'fresh-model-id');
    assert.equal(result.reply, 'Hello from model');
    assert.deepEqual(result.usage, { input: 3, output: 4 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('unknown provider is rejected before making a request', async () => {
  assert.equal(getProvider('unknown'), null);
  await assert.rejects(() => listProviderModels('unknown', 'key'), /supported AI provider/);
  await assert.rejects(() => generateChat({ providerId: 'unknown', modelId: 'x', apiKey: 'key', message: 'hi' }), /supported AI provider/);
});
