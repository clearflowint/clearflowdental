import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptProviderKey, decryptProviderKey } from '../src/ai-credentials.js';

const KEY = 'a'.repeat(64);

test('encrypts provider keys and decrypts only with the configured master key', () => {
  process.env.CLEARFLOW_AI_ENCRYPTION_KEY = KEY;
  const stored = encryptProviderKey('sk-test-example-key-1234');
  assert.notEqual(stored.credentialCiphertext, 'sk-test-example-key-1234');
  assert.equal(stored.maskedSuffix, '1234');
  assert.equal(decryptProviderKey(stored), 'sk-test-example-key-1234');
});

test('uses a fresh nonce for every encryption', () => {
  process.env.CLEARFLOW_AI_ENCRYPTION_KEY = KEY;
  const a = encryptProviderKey('sk-test-example-key-1234');
  const b = encryptProviderKey('sk-test-example-key-1234');
  assert.notEqual(a.credentialNonce, b.credentialNonce);
  assert.notEqual(a.credentialCiphertext, b.credentialCiphertext);
});

test('rejects tampered ciphertext', () => {
  process.env.CLEARFLOW_AI_ENCRYPTION_KEY = KEY;
  const stored = encryptProviderKey('sk-test-example-key-1234');
  stored.credentialCiphertext = Buffer.from('tampered').toString('base64');
  assert.throws(() => decryptProviderKey(stored));
});

test('fails closed when the master key is absent or malformed', () => {
  delete process.env.CLEARFLOW_AI_ENCRYPTION_KEY;
  assert.throws(() => encryptProviderKey('sk-test-example-key-1234'), /encryption is not configured/);
});
