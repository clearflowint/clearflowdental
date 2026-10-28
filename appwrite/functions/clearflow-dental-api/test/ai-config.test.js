import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_PROVIDERS, isSupportedProviderModel } from '../src/ai-config.js';

test('AI provider catalogue contains unique provider identifiers and non-empty model lists', () => {
  const ids = AI_PROVIDERS.map(provider => provider.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const provider of AI_PROVIDERS) {
    assert.ok(provider.name);
    assert.ok(provider.models.length > 0);
  }
});

test('AI model selection is constrained to the selected provider', () => {
  assert.equal(isSupportedProviderModel('openai', 'gpt-4.1-mini'), true);
  assert.equal(isSupportedProviderModel('google', 'gemini-2.5-flash'), true);
  assert.equal(isSupportedProviderModel('openai', 'gemini-2.5-flash'), false);
  assert.equal(isSupportedProviderModel('unknown', 'gpt-4.1-mini'), false);
  assert.equal(isSupportedProviderModel('openai', ''), false);
});
