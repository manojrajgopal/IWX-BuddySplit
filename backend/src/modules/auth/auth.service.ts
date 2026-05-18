import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { SessionEntity } from './entities/session.entity';
import { UsersService } from '@/modules/users/users.service';
import { OtpService } from '@/modules/otp/otp.service';
import { CryptoService } from '@/core/crypto/crypto.service';
import { MailService } from '@/core/mail/mail.service';
import { Logger } from '@nestjs/common';
import type { UserEntity } from '@/modules/users/entities/user.entity';
import type {
  GoogleSignInDto,
  LoginDto, RefreshDto, RegisterRequestDto, RegisterVerifyDto,
  ResetPasswordDto, ForgotPasswordDto,
} from './dto/auth.dto';

interface TokenPair { accessToken: string; refreshToken: string; expiresIn: number }

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly crypto: CryptoService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    @InjectRepository(SessionEntity)
    private readonly sessions: Repository<SessionEntity>,
  ) {}

  async registerRequest(dto: RegisterRequestDto): Promise<{ expiresAt: Date }> {
    return this.otp.request(dto.email.toLowerCase(), 'register');
  }

  async registerVerify(
    dto: RegisterVerifyDto, ua?: string, ip?: string,
  ): Promise<TokenPair & { userId: string }> {
    await this.otp.verify(dto.email.toLowerCase(), 'register', dto.code);
    const passwordHash = await this.crypto.hashPassword(dto.password);
    const user = await this.users.createVerified({
      email: dto.email.toLowerCase(),
      displayName: dto.displayName,
      passwordHash,
      phone: dto.phone ?? null,
    });
    // Fire-and-forget welcome email — do not block the response.
    this.sendWelcomeEmail(user, 'Email + Password', ua, ip);
    return { ...(await this.issueTokens(user.id, user.email, user.role, ua, ip)), userId: user.id };
  }

  async login(dto: LoginDto, ua?: string, ip?: string): Promise<TokenPair & { userId: string }> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (!user || !user.passwordHash || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.crypto.verifyPassword(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.users.setLastLogin(user.id);
    // Fire-and-forget sign-in notification — do not block the response.
    this.sendLoginNotification(user, 'Email + Password', ua, ip);
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

  /**
   * Sign in (or register) using a Google ID token from Google Identity Services.
   * Verifies the ID token's signature & audience against GOOGLE_OAUTH_CLIENT_ID,
   * then finds or creates the user and issues our own JWT pair.
   */
  async googleSignIn(
    dto: GoogleSignInDto, ua?: string, ip?: string,
  ): Promise<TokenPair & { userId: string; isNew: boolean }> {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException('Google sign-in is not configured on the server');
    }
    const oauth = new OAuth2Client(clientId);
    let payload: { email?: string; email_verified?: boolean; name?: string; picture?: string; sub?: string } | undefined;
    try {
      const ticket = await oauth.verifyIdToken({ idToken: dto.idToken, audience: clientId });
      payload = ticket.getPayload() ?? undefined;
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }
    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account email is not verified');
    }
    const email = payload.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    const isNew = !existing;
    const user = await this.users.findOrCreateOAuth({
      email,
      displayName: payload.name ?? email.split('@')[0],
      avatarUrl: payload.picture ?? null,
    });
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is disabled');
    }
    await this.users.setLastLogin(user.id);
    if (isNew) {
      this.sendWelcomeEmail(user, 'Google account', ua, ip);
    } else {
      this.sendLoginNotification(user, 'Google account', ua, ip);
    }
    return {
      ...(await this.issueTokens(user.id, user.email, user.role, ua, ip)),
      userId: user.id,
      isNew,
    };
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Auth notification emails — fire-and-forget. Errors are logged but never
     bubble up so a flaky SMTP host can't break login/registration.
     ───────────────────────────────────────────────────────────────────────── */

  private sendWelcomeEmail(
    user: UserEntity, signUpMethod: string, ua?: string, ip?: string,
  ): void {
    this.mail.send({
      to: user.email,
      templateKey: 'auth.register.welcome',
      variables: {
        displayName: user.displayName,
        email: user.email,
        signUpMethod,
        accountCreatedAt: formatTimestamp(user.createdAt ?? new Date()),
        ipAddress: ip ?? 'Unknown',
        userAgent: ua ?? 'Unknown device',
        deviceLabel: parseDeviceLabel(ua),
        location: 'Unknown',
      },
    }).catch((err) => {
      this.logger.warn(`welcome email failed for ${user.email}: ${(err as Error).message}`);
    });
  }

  private sendLoginNotification(
    user: UserEntity, signInMethod: string, ua?: string, ip?: string,
  ): void {
    this.mail.send({
      to: user.email,
      templateKey: 'auth.login.notification',
      variables: {
        displayName: user.displayName,
        email: user.email,
        signInMethod,
        signInAt: formatTimestamp(new Date()),
        ipAddress: ip ?? 'Unknown',
        userAgent: ua ?? 'Unknown device',
        deviceLabel: parseDeviceLabel(ua),
        location: 'Unknown',
        isNewDevice: 'no',
      },
    }).catch((err) => {
      this.logger.warn(`login notification failed for ${user.email}: ${(err as Error).message}`);
    });
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

/** Render a Date as "18 May 2026, 3:42 PM IST" using the server's locale. */
function formatTimestamp(d: Date): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/** Best-effort browser + OS extraction from a User-Agent string. */
function parseDeviceLabel(ua?: string): string {
  if (!ua) return 'Unknown device';
  const browser =
    /Edg\//.test(ua) ? 'Edge' :
    /Chrome\//.test(ua) ? 'Chrome' :
    /Firefox\//.test(ua) ? 'Firefox' :
    /Safari\//.test(ua) ? 'Safari' :
    /OPR\//.test(ua) ? 'Opera' : 'Browser';
  const os =
    /Windows/.test(ua) ? 'Windows' :
    /Android/.test(ua) ? 'Android' :
    /iPhone|iPad|iOS/.test(ua) ? 'iOS' :
    /Mac OS X/.test(ua) ? 'macOS' :
    /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  return `${browser} on ${os}`;
}
