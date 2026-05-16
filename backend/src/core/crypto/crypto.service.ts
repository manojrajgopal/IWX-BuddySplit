import { Injectable } from '@nestjs/common';
import {
  createHash, createHmac, randomBytes,
  createCipheriv, createDecipheriv, scryptSync,
} from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class CryptoService {
  async hashPassword(plain: string): Promise<string> {
    const pepper = process.env.PASSWORD_PEPPER ?? '';
    return argon2.hash(plain + pepper, { type: argon2.argon2id });
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    const pepper = process.env.PASSWORD_PEPPER ?? '';
    try {
      return await argon2.verify(hash, plain + pepper);
    } catch {
      return false;
    }
  }

  hmacOtp(code: string): string {
    const secret = process.env.OTP_HMAC_SECRET ?? '';
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateNumericOtp(length = Number(process.env.OTP_LENGTH ?? 6)): string {
    const max = 10 ** length;
    // Cryptographically secure via rejection sampling.
    let n = 0;
    do {
      n = Number('0x' + randomBytes(4).toString('hex')) % max;
    } while (n < 10 ** (length - 1)); // ensures no leading zeros
    return n.toString().padStart(length, '0');
  }

  generateUrlToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }

  // ── AES-256-GCM symmetric encryption for at-rest secrets ────────────────
  private encKey(): Buffer {
    const secret = process.env.ENC_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'dev-only-secret-change-me';
    return scryptSync(secret, 'iwx-buddysplit:enc:v1', 32);
  }

  encryptJson(value: unknown): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encKey(), iv);
    const plain = Buffer.from(JSON.stringify(value ?? null), 'utf8');
    const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
  }

  decryptJson<T = unknown>(payload: string | null | undefined): T | null {
    if (!payload) return null;
    const parts = payload.split(':');
    if (parts.length !== 4 || parts[0] !== 'v1') return null;
    try {
      const iv = Buffer.from(parts[1], 'base64');
      const tag = Buffer.from(parts[2], 'base64');
      const enc = Buffer.from(parts[3], 'base64');
      const decipher = createDecipheriv('aes-256-gcm', this.encKey(), iv);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
      return JSON.parse(plain) as T;
    } catch {
      return null;
    }
  }
}
