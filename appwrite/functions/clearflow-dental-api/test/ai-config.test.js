import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_PROVIDERS, getProvider, isSupportedProvider, isSupportedProviderModel } from '../src/ai-config.js';

test('provider catalogue contains unique IDs and API metadata', () => {
  const ids = AI_PROVIDERS.map(provider => provider.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const provider of AI_PROVIDERS) {
    assert.ok(provider.name);
    assert.ok(provider.modelsUrl.startsWith('https://'));
    assert.ok(provider.chatUrl.startsWith('https://'));
  }
});

test('model IDs are validated dynamically instead of through a hardcoded allowlist', () => {
  assert.equal(isSupportedProvider('openai'), true);
  assert.equal(isSupportedProvider('unknown'), false);
  assert.equal(isSupportedProviderModel('openai', 'new-model-release'), true);
  assert.equal(isSupportedProviderModel('openai', ''), false);
  assert.equal(isSupportedProviderModel('openai', 'x'.repeat(201)), false);
  assert.equal(isSupportedProviderModel('unknown', 'model'), false);
  assert.equal(getProvider('openai').name, 'OpenAI');
});
