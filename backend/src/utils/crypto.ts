import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure the encryption key is exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.JWT_SECRET as string;
const IV_LENGTH = 16; 

export const encrypt = (text: string): string => {
  if (!text) return '';
  // Derive a 32-byte key from our JWT_SECRET
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error);
    return '';
  }
};
