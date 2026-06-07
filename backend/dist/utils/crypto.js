"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-cbc';
// Ensure the encryption key is exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = process.env.JWT_SECRET;
const IV_LENGTH = 16;
const encrypt = (text) => {
    if (!text)
        return '';
    // Derive a 32-byte key from our JWT_SECRET
    const key = crypto_1.default.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};
exports.encrypt = encrypt;
const decrypt = (text) => {
    if (!text)
        return '';
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = crypto_1.default.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    catch (error) {
        console.error('[Crypto] Decryption failed:', error);
        return '';
    }
};
exports.decrypt = decrypt;
