import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('Encryption key not configured. Set GOOGLE_TOKEN_ENCRYPTION_KEY environment variable.');
  }
  return crypto.scryptSync(secret, 'salt', 32);
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function encryptTokens(accessToken: string, refreshToken?: string | null): {
  accessTokenCiphertext: string;
  refreshTokenCiphertext: string | null;
} {
  return {
    accessTokenCiphertext: encrypt(accessToken),
    refreshTokenCiphertext: refreshToken ? encrypt(refreshToken) : null,
  };
}

export function decryptTokens(accessTokenCiphertext: string, refreshTokenCiphertext?: string | null): {
  accessToken: string;
  refreshToken: string | null;
} {
  return {
    accessToken: decrypt(accessTokenCiphertext),
    refreshToken: refreshTokenCiphertext ? decrypt(refreshTokenCiphertext) : null,
  };
}
