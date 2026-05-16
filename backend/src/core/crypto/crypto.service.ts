import { Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';
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
}
