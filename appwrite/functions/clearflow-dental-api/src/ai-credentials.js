import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';

function masterKey() {
  const raw = process.env.CLEARFLOW_AI_ENCRYPTION_KEY;
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw Object.assign(new Error('AI credential encryption is not configured on the server.'), { status: 503 });
  }
  return Buffer.from(raw, 'hex');
}

export function encryptProviderKey(apiKey) {
  if (typeof apiKey !== 'string' || apiKey.trim().length < 12 || apiKey.length > 4096) {
    throw Object.assign(new Error('Enter a valid provider API key.'), { status: 400 });
  }
  const key = masterKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(Buffer.from('clearflow-dental:provider-credential:v1'));
  const ciphertext = Buffer.concat([cipher.update(apiKey.trim(), 'utf8'), cipher.final()]);
  return {
    credentialCiphertext: ciphertext.toString('base64'),
    credentialNonce: nonce.toString('base64'),
    credentialTag: cipher.getAuthTag().toString('base64'),
    keyVersion: VERSION,
    maskedSuffix: apiKey.trim().slice(-4),
  };
}

export function decryptProviderKey(record) {
  if (!record || record.keyVersion !== VERSION) throw new Error('Unsupported credential encryption version.');
  const decipher = createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(record.credentialNonce, 'base64'));
  decipher.setAAD(Buffer.from('clearflow-dental:provider-credential:v1'));
  decipher.setAuthTag(Buffer.from(record.credentialTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(record.credentialCiphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
