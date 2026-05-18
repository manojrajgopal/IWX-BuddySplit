import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CryptoService } from '@/core/crypto/crypto.service';
import { EmailAccountEntity } from './entities/email-account.entity';
import {
  EmailAccountCreateDto, EmailAccountUpdateDto,
  smtpConfigSchema, gmailOAuthConfigSchema, resendConfigSchema,
} from './dto/email-account.dto';

/** Listener invoked whenever email accounts change so MailService can refresh. */
export type EmailAccountChangeListener = () => void;

export interface EmailAccountPublic {
  id: string;
  name: string;
  provider: 'smtp' | 'gmail_oauth' | 'resend';
  fromAddress: string;
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Config returned with secrets masked so the admin UI can show structure.
  config: Record<string, string | number | boolean>;
}

@Injectable()
export class EmailAccountsService {
  private listeners: EmailAccountChangeListener[] = [];

  constructor(
    @InjectRepository(EmailAccountEntity) private readonly repo: Repository<EmailAccountEntity>,
    private readonly crypto: CryptoService,
    private readonly ds: DataSource,
  ) {}

  onChange(fn: EmailAccountChangeListener): void { this.listeners.push(fn); }
  private emitChange(): void { for (const l of this.listeners) try { l(); } catch { /* noop */ } }

  async list(): Promise<EmailAccountPublic[]> {
    const rows = await this.repo.find({ order: { createdAt: 'DESC' } });
    return rows.map((r) => this.toPublic(r));
  }

  async get(id: string): Promise<EmailAccountPublic> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Email account not found');
    return this.toPublic(row);
  }

  async create(dto: EmailAccountCreateDto): Promise<EmailAccountPublic> {
    const validated = this.validateConfig(dto.provider, dto.config);
    const entity = this.repo.create({
      name: dto.name,
      provider: dto.provider,
      fromAddress: dto.fromAddress,
      isActive: dto.isActive ?? true,
      isDefault: dto.isDefault ?? false,
      configEncrypted: this.crypto.encryptJson(validated),
    });
    const saved = await this.ds.transaction(async (m) => {
      if (entity.isDefault) {
        await m.update(EmailAccountEntity, { isDefault: true }, { isDefault: false });
      }
      return m.save(entity);
    });
    this.emitChange();
    return this.toPublic(saved);
  }

  async update(id: string, dto: EmailAccountUpdateDto): Promise<EmailAccountPublic> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Email account not found');

    if (dto.name !== undefined) row.name = dto.name;
    if (dto.fromAddress !== undefined) row.fromAddress = dto.fromAddress;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (dto.provider !== undefined) row.provider = dto.provider;

    if (dto.config !== undefined) {
      const provider = dto.provider ?? row.provider;
      const existing = this.crypto.decryptJson<Record<string, unknown>>(row.configEncrypted) ?? {};
      // Merge: empty string in incoming config means "leave as-is" so the admin can edit
      // without re-typing secrets.
      const merged: Record<string, unknown> = { ...existing };
      for (const [k, v] of Object.entries(dto.config)) {
        if (v === '' || v === undefined || v === null) continue;
        merged[k] = v;
      }
      const validated = this.validateConfig(provider, merged);
      row.configEncrypted = this.crypto.encryptJson(validated);
    }

    const saved = await this.ds.transaction(async (m) => {
      if (dto.isDefault === true) {
        await m.update(EmailAccountEntity, { isDefault: true }, { isDefault: false });
        row.isDefault = true;
      } else if (dto.isDefault === false) {
        row.isDefault = false;
      }
      return m.save(row);
    });
    this.emitChange();
    return this.toPublic(saved);
  }

  async remove(id: string): Promise<{ id: string }> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Email account not found');
    await this.repo.remove(row);
    this.emitChange();
    return { id };
  }

  async setDefault(id: string): Promise<EmailAccountPublic> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Email account not found');
    await this.ds.transaction(async (m) => {
      await m.update(EmailAccountEntity, { isDefault: true }, { isDefault: false });
      await m.update(EmailAccountEntity, { id }, { isDefault: true, isActive: true });
    });
    this.emitChange();
    return this.get(id);
  }

  /** Returns the resolved active sending account with decrypted config. */
  async getActiveResolved(): Promise<
    | { entity: EmailAccountEntity; config: Record<string, unknown> }
    | null
  > {
    const def = await this.repo.findOne({ where: { isDefault: true, isActive: true } });
    const chosen = def ?? await this.repo.findOne({ where: { isActive: true }, order: { createdAt: 'ASC' } });
    if (!chosen) return null;
    const config = this.crypto.decryptJson<Record<string, unknown>>(chosen.configEncrypted) ?? {};
    return { entity: chosen, config };
  }

  /** Returns any account by id with decrypted config (active or not). */
  async getResolvedById(
    id: string,
  ): Promise<{ entity: EmailAccountEntity; config: Record<string, unknown> } | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    const config = this.crypto.decryptJson<Record<string, unknown>>(row.configEncrypted) ?? {};
    return { entity: row, config };
  }

  async recordSend(id: string, error: string | null): Promise<void> {
    await this.repo.update({ id }, { lastUsedAt: new Date(), lastError: error });
  }

  private validateConfig(provider: 'smtp' | 'gmail_oauth' | 'resend', cfg: unknown): Record<string, unknown> {
    const schema =
      provider === 'smtp' ? smtpConfigSchema
        : provider === 'gmail_oauth' ? gmailOAuthConfigSchema
          : resendConfigSchema;
    const parsed = schema.safeParse(cfg);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'InvalidEmailConfig',
        issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    return parsed.data as Record<string, unknown>;
  }

  private toPublic(r: EmailAccountEntity): EmailAccountPublic {
    const cfg = this.crypto.decryptJson<Record<string, unknown>>(r.configEncrypted) ?? {};
    return {
      id: r.id,
      name: r.name,
      provider: r.provider,
      fromAddress: r.fromAddress,
      isActive: r.isActive,
      isDefault: r.isDefault,
      lastUsedAt: r.lastUsedAt,
      lastError: r.lastError,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      config: maskConfig(r.provider, cfg),
    };
  }
}

function maskConfig(
  provider: 'smtp' | 'gmail_oauth' | 'resend',
  cfg: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  const mask = (v: unknown): string => {
    const s = String(v ?? '');
    if (!s) return '';
    if (s.length <= 4) return '••••';
    return `${s.slice(0, 2)}••••${s.slice(-2)}`;
  };
  if (provider === 'smtp') {
    out.host = String(cfg.host ?? '');
    out.port = Number(cfg.port ?? 0);
    out.secure = Boolean(cfg.secure);
    out.user = String(cfg.user ?? '');
    out.password = mask(cfg.password);
  } else if (provider === 'gmail_oauth') {
    out.clientId = String(cfg.clientId ?? '');
    out.clientSecret = mask(cfg.clientSecret);
    out.redirectUri = String(cfg.redirectUri ?? '');
    out.refreshToken = mask(cfg.refreshToken);
    out.accessToken = mask(cfg.accessToken);
  } else {
    // resend
    out.apiKey = mask(cfg.apiKey);
  }
  return out;
}
