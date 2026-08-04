import crypto from 'crypto';
import { env } from '../config/env';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
  exp: number;
}

const TOKEN_SECRET = env.authTokenSecret;
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const HASH_ALGORITHM = 'sha256';

function base64UrlEncode(value: Buffer): string {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Buffer {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(data: string): string {
  return crypto.createHmac(HASH_ALGORITHM, TOKEN_SECRET).update(data).digest('base64url');
}

export function signAuthToken(payload: Omit<AuthTokenPayload, 'exp'>): string {
  const tokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(tokenPayload), 'utf8'));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const parts = token.split('.');

  if (parts.length !== 2) {
    throw new Error('Invalid token format');
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload);

  if (!crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'))) {
    throw new Error('Invalid token signature');
  }

  const payloadJson = base64UrlDecode(encodedPayload).toString('utf8');
  const payload = JSON.parse(payloadJson) as AuthTokenPayload;

  if (typeof payload.userId !== 'number' || typeof payload.email !== 'string') {
    throw new Error('Invalid token payload');
  }

  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token has expired');
  }

  return payload;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH) as Buffer;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey);
}
