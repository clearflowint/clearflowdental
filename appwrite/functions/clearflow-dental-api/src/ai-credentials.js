import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const AAD = Buffer.from('clearflow-dental:provider-credential:v1');

function masterKey() {
  const raw = process.env.CLEARFLOW_AI_ENCRYPTION_KEY;
  if (typeof raw !== 'string' || !raw.length) {
    throw Object.assign(new Error('AI credential encryption is not configured on the server.'), { status: 503 });
  }

  // Accept the existing 32-byte key in common representations. Both Appwrite
  // and Windmill use the same decoding rules; the decoded key must be 32 bytes.
  let key = null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex');
  } else {
    try {
      const decoded = Buffer.from(raw, 'base64');
      if (decoded.length === 32 && decoded.toString('base64') === raw) key = decoded;
    } catch {
      // Fall through to the exact-length UTF-8 representation below.
    }
    if (!key && Buffer.byteLength(raw, 'utf8') === 32) key = Buffer.from(raw, 'utf8');
  }

  if (!key || key.length !== 32) {
    throw Object.assign(new Error('AI credential encryption key must decode to exactly 32 bytes (hex, Base64, or 32-byte UTF-8).'), { status: 503 });
  }
  return key;
}

export function encryptProviderKey(apiKey) {
  if (typeof apiKey !== 'string' || apiKey.trim().length < 12 || apiKey.length > 4096) {
    throw Object.assign(new Error('Enter a valid provider API key.'), { status: 400 });
  }
  const key = masterKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(AAD);
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
  decipher.setAAD(AAD);
  decipher.setAuthTag(Buffer.from(record.credentialTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(record.credentialCiphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
