import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-replace-in-production';
const ALGORITHM = 'aes-256-gcm';

export const encryptData = (text: string): string => {
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(64);
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 2145, 32, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const result = Buffer.concat([salt, iv, authTag, encrypted]);
    return result.toString('base64');
};

export const decryptData = (encryptedData: string): string => {
    const buffer = Buffer.from(encryptedData, 'base64');

    const salt = buffer.subarray(0, 64);
    const iv = buffer.subarray(64, 80);
    const authTag = buffer.subarray(80, 96);
    const encrypted = buffer.subarray(96);
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 2145, 32, 'sha512');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
};