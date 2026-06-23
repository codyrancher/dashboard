import { webcrypto } from 'crypto';
import { deriveKey, encrypt, decrypt } from '@shell/utils/crypto/encryption';

// JSDOM does not include the Web Crypto API; wire up Node.js's implementation.
Object.defineProperty(global, 'crypto', { value: webcrypto });

describe('encryption utilities', () => {
  describe('deriveKey', () => {
    it('returns an object with the correct algorithm', async() => {
      const key = await deriveKey('test-password');

      expect(key.algorithm.name).toStrictEqual('AES-GCM');
    });

    it('returns a non-extractable key', async() => {
      const key = await deriveKey('test-password');

      expect(key.extractable).toStrictEqual(false);
    });

    it('returns a key with encrypt and decrypt usages', async() => {
      const key = await deriveKey('test-password');

      expect(Array.from(key.usages)).toStrictEqual(['encrypt', 'decrypt']);
    });

    it('produces a different key for a different password', async() => {
      const key1 = await deriveKey('password-one');
      const key2 = await deriveKey('password-two');

      // Keys are non-extractable so we verify indirectly: encrypt with one and
      // attempt to decrypt with the other should fail.
      const encrypted = await encrypt('some text', key1);

      await expect(decrypt(encrypted, key2)).rejects.toThrow();
    });
  });

  describe('encrypt', () => {
    it('returns an object with cipher and iv fields', async() => {
      const key = await deriveKey('test-password');
      const result = await encrypt('hello world', key);

      expect(result).toHaveProperty('cipher');
      expect(result).toHaveProperty('iv');
    });

    it('returns base64-encoded cipher and iv strings', async() => {
      const key = await deriveKey('test-password');
      const result = await encrypt('hello world', key);

      // base64 strings contain only valid base64 characters
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;

      expect(result.cipher).toMatch(base64Regex);
      expect(result.iv).toMatch(base64Regex);
    });

    it('produces a different iv each time (random IV)', async() => {
      const key = await deriveKey('test-password');
      const result1 = await encrypt('hello world', key);
      const result2 = await encrypt('hello world', key);

      // Random IV means the same plaintext produces different ciphertexts
      expect(result1.iv).not.toStrictEqual(result2.iv);
      expect(result1.cipher).not.toStrictEqual(result2.cipher);
    });
  });

  describe('decrypt', () => {
    it('recovers the original plaintext after encrypt/decrypt round trip', async() => {
      const key = await deriveKey('test-password');
      const plaintext = 'hello world';
      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toStrictEqual(plaintext);
    });

    it.each([
      {
        desc:      'empty string',
        plaintext: '',
      },
      {
        desc:      'unicode characters',
        plaintext: 'héllo wörld 🔐',
      },
      {
        desc:      'long string',
        plaintext: 'a'.repeat(10000),
      },
      {
        desc:      'json string',
        plaintext: JSON.stringify({ key: 'value', nested: { arr: [1, 2, 3] } }),
      },
      {
        desc:      'string with special characters',
        plaintext: '!@#$%^&*()_+-=[]{}|;\':",./<>?',
      },
    ])('round-trips correctly for $desc', async({ plaintext }) => {
      const key = await deriveKey('test-password');
      const encrypted = await encrypt(plaintext, key);
      const decrypted = await decrypt(encrypted, key);

      expect(decrypted).toStrictEqual(plaintext);
    });

    it('fails to decrypt with a wrong key', async() => {
      const correctKey = await deriveKey('correct-password');
      const wrongKey = await deriveKey('wrong-password');
      const encrypted = await encrypt('secret', correctKey);

      await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
    });

    it('fails to decrypt with a tampered cipher', async() => {
      const key = await deriveKey('test-password');
      const encrypted = await encrypt('secret', key);

      // Tamper with the cipher by appending extra characters
      const tampered = {
        ...encrypted,
        cipher: `${ encrypted.cipher }AAAA`,
      };

      await expect(decrypt(tampered, key)).rejects.toThrow();
    });
  });
});
