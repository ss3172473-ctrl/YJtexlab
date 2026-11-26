import 'server-only';
import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt } from 'node:crypto';


function encryptionKey() {
  const key = Buffer.from(process.env.CRM_CODE_ENCRYPTION_KEY ?? '', 'base64');
  if (key.length !== 32) throw new Error('CRM code encryption key must be 32 bytes in base64');
  return key;
}
export function encryptCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const payload = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), payload].map(value => value.toString('base64url')).join('.');
}
export function decryptCode(value: string) {
  const [iv, tag, payload] = value.split('.').map(part => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8');
}
export function newCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  for (;;) {
    const value = Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join('');
    if (/[0-9]/.test(value) && /[A-Z]/.test(value)) return value;
  }
}
export function crmFingerprint(code: string) {
  const key = process.env.CRM_CODE_HASH_KEY;
  if (!key || key.length < 32) throw new Error('CRM code hash key missing');
  return createHmac('sha256', key).update(`crm-code:${code}`).digest('base64url');
}
