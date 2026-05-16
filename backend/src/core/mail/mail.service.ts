import {
  forwardRef, Inject, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import Handlebars from 'handlebars';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplateEntity } from '@/modules/email/entities/email-template.entity';
import { EmailAccountsService } from '@/modules/email/email-accounts.service';
import { EmailAccountEntity } from '@/modules/email/entities/email-account.entity';

interface SendOptions {
  to: string | string[];
  templateKey: string;
  variables?: Record<string, unknown>;
  fallbackSubject?: string;
  fallbackHtml?: string;
  fallbackText?: string;
  /** Override the active account by id (admin can pick which sender to use). */
  accountId?: string;
}

interface ResolvedAccount {
  entity: EmailAccountEntity;
  transporter: Transporter;
  from: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private cache = new Map<string, ResolvedAccount>();

  constructor(
    @InjectRepository(EmailTemplateEntity)
    private readonly templates: Repository<EmailTemplateEntity>,
    @Inject(forwardRef(() => EmailAccountsService))
    private readonly accounts: EmailAccountsService,
  ) {
    this.accounts.onChange(() => this.cache.clear());
  }

  async send(opts: SendOptions): Promise<void> {
    const tpl = await this.templates.findOne({ where: { key: opts.templateKey } });
    const vars = opts.variables ?? {};
    const subject = render(tpl?.subject ?? opts.fallbackSubject ?? '', vars);
    const html = render(tpl?.html ?? opts.fallbackHtml ?? '', vars);
    const text = render(tpl?.text ?? opts.fallbackText ?? stripHtml(html), vars);

    const resolved = await this.resolveAccount(opts.accountId);
    if (!resolved) {
      this.logger.warn(`mail[${opts.templateKey}] skipped → no active email account configured`);
      return;
    }

    try {
      await resolved.transporter.sendMail({
        from: resolved.from,
        to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
        subject, html, text,
      });
      await this.accounts.recordSend(resolved.entity.id, null);
      this.logger.log(`sent[${opts.templateKey}] via ${resolved.entity.name} → ${opts.to}`);
    } catch (err) {
      const message = (err as Error).message;
      await this.accounts.recordSend(resolved.entity.id, message);
      this.cache.delete(resolved.entity.id);
      throw err;
    }
  }

  /** Send a test email using a specific account (used by admin UI). */
  async sendTest(accountId: string, to: string): Promise<void> {
    if (!to) throw new NotFoundException('Recipient required for test send');
    const resolved = await this.accounts.getActiveResolved();
    let target: ResolvedAccount | null = null;
    if (resolved && resolved.entity.id === accountId) {
      target = await this.getOrBuild(resolved.entity, resolved.config);
    } else {
      // Force-load specific account even if not active.
      const acc = await this.accounts.get(accountId).catch(() => null);
      if (!acc) throw new NotFoundException('Email account not found');
      // We need raw decrypted config; getActiveResolved doesn't expose arbitrary accounts.
      const raw = await this.accounts.getResolvedById(accountId);
      if (!raw) throw new NotFoundException('Email account not found');
      target = await this.getOrBuild(raw.entity, raw.config);
    }
    if (!target) throw new NotFoundException('Email account not resolvable');
    try {
      await target.transporter.sendMail({
        from: target.from,
        to,
        subject: 'IWX-BuddySplit · email account test',
        text: `This is a test message from email account "${target.entity.name}".`,
        html: `<p>This is a test message from email account <b>${escapeHtml(target.entity.name)}</b>.</p>`,
      });
      await this.accounts.recordSend(target.entity.id, null);
    } catch (err) {
      const message = (err as Error).message;
      await this.accounts.recordSend(target.entity.id, message);
      this.cache.delete(target.entity.id);
      throw err;
    }
  }

  private async resolveAccount(accountId?: string): Promise<ResolvedAccount | null> {
    if (accountId) {
      const raw = await this.accounts.getResolvedById(accountId);
      if (raw) return this.getOrBuild(raw.entity, raw.config);
    }
    const active = await this.accounts.getActiveResolved();
    if (!active) return null;
    return this.getOrBuild(active.entity, active.config);
  }

  private async getOrBuild(
    entity: EmailAccountEntity,
    config: Record<string, unknown>,
  ): Promise<ResolvedAccount> {
    const cached = this.cache.get(entity.id);
    if (cached) return cached;
    const built = await this.buildTransporter(entity, config);
    this.cache.set(entity.id, built);
    return built;
  }

  private async buildTransporter(
    entity: EmailAccountEntity,
    config: Record<string, unknown>,
  ): Promise<ResolvedAccount> {
    let transporter: Transporter;
    if (entity.provider === 'smtp') {
      const host = String(config.host ?? '');
      const port = Number(config.port ?? 587);
      const secure = Boolean(config.secure);
      const user = String(config.user ?? '');
      const pass = String(config.password ?? '');
      transporter = createTransport({
        host, port, secure,
        auth: user ? { user, pass } : undefined,
      });
    } else {
      const user = extractEmail(entity.fromAddress);
      transporter = createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user,
          clientId: String(config.clientId ?? ''),
          clientSecret: String(config.clientSecret ?? ''),
          refreshToken: String(config.refreshToken ?? ''),
          accessToken: String(config.accessToken ?? '') || undefined,
        },
      });
    }
    return { entity, transporter, from: entity.fromAddress };
  }
}

function render(source: string, vars: Record<string, unknown>): string {
  if (!source) return '';
  return Handlebars.compile(source, { noEscape: false })(vars);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function extractEmail(addr: string): string {
  const m = addr.match(/<([^>]+)>/);
  return (m ? m[1] : addr).trim();
}
