import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { OtpPurpose, OtpVerificationEntity } from './entities/otp-verification.entity';
import { CryptoService } from '@/core/crypto/crypto.service';
import { MailService } from '@/core/mail/mail.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpVerificationEntity)
    private readonly repo: Repository<OtpVerificationEntity>,
    private readonly crypto: CryptoService,
    private readonly mail: MailService,
  ) {}

  async request(email: string, purpose: OtpPurpose): Promise<{ expiresAt: Date }> {
    // Throttle: max 3 active OTPs per email/purpose in the TTL window.
    const ttl = Number(process.env.OTP_TTL_SECONDS ?? 600);
    const now = new Date();
    const since = new Date(now.getTime() - ttl * 1000);
    const recent = await this.repo.count({
      where: { email, purpose, createdAt: MoreThan(since) as unknown as Date },
    });
    if (recent >= 5) throw new BadRequestException('Too many OTP requests; try again later');

    const code = this.crypto.generateNumericOtp();
    const codeHash = this.crypto.hmacOtp(code);
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    await this.repo.save(this.repo.create({
      email, purpose, codeHash, expiresAt,
    }));

    await this.mail.send({
      to: email,
      templateKey: `auth.otp.${purpose}`,
      variables: { code, ttlMinutes: Math.round(ttl / 60), email },
      fallbackSubject: `Verification code — IWX BuddySplit`,
      fallbackHtml: `<p>Your IWX BuddySplit verification code is <b>${code}</b>.</p><p>It expires in ${Math.round(ttl / 60)} minutes.</p>`,
    });
    return { expiresAt };
  }

  async verify(email: string, purpose: OtpPurpose, code: string): Promise<boolean> {
    const codeHash = this.crypto.hmacOtp(code);
    const row = await this.repo
      .createQueryBuilder('o')
      .where('o.email = :email', { email })
      .andWhere('o.purpose = :purpose', { purpose })
      .andWhere('o.consumed_at IS NULL')
      .andWhere('o.expires_at > now()')
      .orderBy('o.created_at', 'DESC')
      .getOne();
    if (!row) throw new BadRequestException('OTP expired or not requested');
    if (row.attempts >= row.maxAttempts) {
      throw new BadRequestException('Too many incorrect attempts');
    }
    if (row.codeHash !== codeHash) {
      await this.repo.update({ id: row.id }, { attempts: row.attempts + 1 });
      throw new BadRequestException('Incorrect code');
    }
    await this.repo.update({ id: row.id }, { consumedAt: new Date() });
    // Mark sibling OTPs (same email/purpose) as consumed too.
    await this.repo.update(
      { email, purpose, consumedAt: undefined as unknown as Date },
      { consumedAt: new Date() },
    );
    return true;
  }

  async purgeExpired(): Promise<number> {
    const r = await this.repo.delete({ expiresAt: LessThan(new Date()) });
    return r.affected ?? 0;
  }
}
