import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionEntity } from './entities/session.entity';
import { UsersService } from '@/modules/users/users.service';
import { OtpService } from '@/modules/otp/otp.service';
import { CryptoService } from '@/core/crypto/crypto.service';
import type {
  LoginDto, RefreshDto, RegisterRequestDto, RegisterVerifyDto,
  ResetPasswordDto, ForgotPasswordDto,
} from './dto/auth.dto';

interface TokenPair { accessToken: string; refreshToken: string; expiresIn: number }

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly crypto: CryptoService,
    private readonly jwt: JwtService,
    @InjectRepository(SessionEntity)
    private readonly sessions: Repository<SessionEntity>,
  ) {}

  async registerRequest(dto: RegisterRequestDto): Promise<{ expiresAt: Date }> {
    return this.otp.request(dto.email.toLowerCase(), 'register');
  }

  async registerVerify(dto: RegisterVerifyDto): Promise<TokenPair & { userId: string }> {
    await this.otp.verify(dto.email.toLowerCase(), 'register', dto.code);
    const passwordHash = await this.crypto.hashPassword(dto.password);
    const user = await this.users.createVerified({
      email: dto.email.toLowerCase(),
      displayName: dto.displayName,
      passwordHash,
      phone: dto.phone ?? null,
    });
    return { ...(await this.issueTokens(user.id, user.email, user.role)), userId: user.id };
  }

  async login(dto: LoginDto, ua?: string, ip?: string): Promise<TokenPair & { userId: string }> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (!user || !user.passwordHash || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.crypto.verifyPassword(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.users.setLastLogin(user.id);
    return { ...(await this.issueTokens(user.id, user.email, user.role, ua, ip)), userId: user.id };
  }

  async refresh(dto: RefreshDto, ua?: string, ip?: string): Promise<TokenPair> {
    let payload: { sub: string; sid: string };
    try {
      payload = await this.jwt.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const hash = this.crypto.hashToken(dto.refreshToken);
    const session = await this.sessions.findOne({ where: { id: payload.sid } });
    if (!session || session.revokedAt || session.refreshTokenHash !== hash ||
        session.expiresAt.getTime() < Date.now() || session.userId !== payload.sub) {
      throw new UnauthorizedException('Session invalid');
    }
    // Rotate: revoke old, issue new.
    await this.sessions.update({ id: session.id }, { revokedAt: new Date() });
    const user = await this.users.require(session.userId);
    return this.issueTokens(user.id, user.email, user.role, ua, ip);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<{ sid: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      await this.sessions.update({ id: payload.sid }, { revokedAt: new Date() });
    } catch { /* ignore — idempotent */ }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ expiresAt: Date | null }> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (!user) return { expiresAt: null }; // do not leak
    const r = await this.otp.request(dto.email.toLowerCase(), 'reset_password');
    return r;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    await this.otp.verify(dto.email.toLowerCase(), 'reset_password', dto.code);
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (!user) throw new UnauthorizedException();
    const hash = await this.crypto.hashPassword(dto.newPassword);
    await this.users.updatePasswordHash(user.id, hash);
    // Invalidate all sessions.
    await this.sessions.update({ userId: user.id }, { revokedAt: new Date() });
  }

  private async issueTokens(
    userId: string, email: string, role: 'user' | 'admin', ua?: string, ip?: string,
  ): Promise<TokenPair> {
    const accessTtl = process.env.JWT_ACCESS_TTL || '15m';
    const refreshTtl = process.env.JWT_REFRESH_TTL || '30d';

    // Create session row first to embed sid.
    const session = await this.sessions.save(this.sessions.create({
      userId,
      refreshTokenHash: 'placeholder',
      userAgent: ua ?? null,
      ip: ip ?? null,
      expiresAt: new Date(Date.now() + ttlToMs(refreshTtl)),
    }));

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: accessTtl },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, sid: session.id },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: refreshTtl },
    );
    await this.sessions.update(
      { id: session.id },
      { refreshTokenHash: this.crypto.hashToken(refreshToken) },
    );
    return { accessToken, refreshToken, expiresIn: ttlToMs(accessTtl) / 1000 };
  }
}

function ttlToMs(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) return 15 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2];
  return n * (u === 's' ? 1000 : u === 'm' ? 60_000 : u === 'h' ? 3_600_000 : 86_400_000);
}
