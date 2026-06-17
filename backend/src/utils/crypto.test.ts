import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { encrypt, decrypt } from './crypto';

const TEST_KEY = 'unit-test-encryption-key-value';

describe('crypto utilities', () => {
  let originalSecret: string | undefined;

  before(() => {
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_KEY;
  });

  after(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('encrypts and decrypts a string round-trip', () => {
    const plaintext = 'Hello, World!';
    const encrypted = encrypt(plaintext);
    assert.notStrictEqual(encrypted, plaintext);
    assert.ok(encrypted.includes(':'), 'Encrypted format should contain iv:ciphertext');
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, plaintext);
  });

  it('returns empty string for empty input (encrypt)', () => {
    assert.strictEqual(encrypt(''), '');
  });

  it('returns empty string for empty input (decrypt)', () => {
    assert.strictEqual(decrypt(''), '');
  });

  it('produces different ciphertexts for the same input (random IV)', () => {
    const text = 'same-input';
    const a = encrypt(text);
    const b = encrypt(text);
    assert.notStrictEqual(a, b);
  });

  it('handles unicode text', () => {
    const text = '日本語テスト 🎉';
    const encrypted = encrypt(text);
    assert.strictEqual(decrypt(encrypted), text);
  });

  it('handles long text', () => {
    const text = 'x'.repeat(10000);
    const encrypted = encrypt(text);
    assert.strictEqual(decrypt(encrypted), text);
  });

  it('returns empty string when decryption fails (corrupted data)', () => {
    const result = decrypt('not-valid-hex:also-not-hex');
    assert.strictEqual(result, '');
  });
});
