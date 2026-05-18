import {
  forwardRef, Inject, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { createTransport } from 'nodemailer';
import Handlebars from 'handlebars';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplateEntity } from '@/modules/email/entities/email-template.entity';
import { EmailAccountsService } from '@/modules/email/email-accounts.service';
import { EmailAccountEntity } from '@/modules/email/entities/email-account.entity';
import { getBuiltInTemplate } from './templates';

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

interface OutgoingMessage {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface ResolvedAccount {
  entity: EmailAccountEntity;
  from: string;
  /** Short human label of the underlying transport, surfaced in error logs. */
  transportLabel: string;
  send: (msg: OutgoingMessage) => Promise<void>;
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
    // Priority: DB override → built-in file template → caller-provided fallback
    const dbTpl = await this.templates.findOne({ where: { key: opts.templateKey } });
    const builtIn = getBuiltInTemplate(opts.templateKey);

    const webUrl = process.env.PUBLIC_WEB_URL ?? '';
    const globalVars: Record<string, unknown> = {
      logoUrl: `${webUrl}/brand/logo.svg`,
      appName: process.env.APP_NAME ?? 'IWX BuddySplit',
      companyName: 'InfiniteWaveX',
      webUrl,
      year: new Date().getFullYear(),
    };
    const vars: Record<string, unknown> = { ...globalVars, ...opts.variables };

    const subjectSource =
      (dbTpl?.subject && dbTpl.subject.trim()) ||
      builtIn?.subject ||
      opts.fallbackSubject ||
      '';
    const htmlSource =
      (dbTpl?.html && dbTpl.html.trim()) ||
      builtIn?.html ||
      opts.fallbackHtml ||
      '';
    const textSource =
      (dbTpl?.text && dbTpl.text.trim()) ||
      opts.fallbackText ||
      '';

    const subject = render(subjectSource, vars);
    const html = render(htmlSource, vars);
    const text = textSource ? render(textSource, vars) : stripHtml(html);

    if (!html) {
      this.logger.warn(`mail[${opts.templateKey}] skipped → no template content available`);
      return;
    }

    const resolved = await this.resolveAccount(opts.accountId);
    if (!resolved) {
      this.logger.warn(`mail[${opts.templateKey}] skipped → no active email account configured`);
      return;
    }

    try {
      await resolved.send({
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
      this.logger.error(`send[${opts.templateKey}] failed via ${resolved.entity.name} (${resolved.transportLabel}): ${message}`);
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
      await target.send({
        from: target.from,
        to,
        subject: 'IWX BuddySplit · email account test',
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
    // Render (and most managed hosts) sometimes have unreliable IPv6 routing to
    // SMTP relays; forcing IPv4 plus explicit timeouts avoids indefinite hangs
    // surfacing as "Connection timeout" with no further context.
    const commonOpts = {
      family: 4 as const,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    };

    if (entity.provider === 'resend') {
      // Resend uses an HTTPS API (https://api.resend.com/emails) — works on
      // hosts like Render's free tier that block all outbound SMTP traffic.
      const apiKey = String(config.apiKey ?? '').trim();
      if (!apiKey) throw new Error('Resend account is missing apiKey');
      return {
        entity,
        from: entity.fromAddress,
        transportLabel: 'resend:https',
        send: async (msg) => {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: msg.from,
              to: msg.to.split(',').map((s) => s.trim()).filter(Boolean),
              subject: msg.subject,
              html: msg.html,
              text: msg.text,
            }),
          });
          if (!res.ok) {
            const body = await res.text().catch(() => '');
            throw new Error(`Resend API ${res.status}: ${body.slice(0, 500)}`);
          }
        },
      };
    }

    if (entity.provider === 'smtp') {
      const host = String(config.host ?? '').trim();
      const rawPort = Number(config.port ?? 587);
      const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 587;
      // Auto-reconcile secure flag with the chosen port: 465 must be TLS-on-connect,
      // 587/2525/25 are STARTTLS (secure=false). Misconfiguration here is the #1
      // source of "Connection timeout" errors against Gmail/SES/Mailgun.
      const secure = port === 465 ? true : Boolean(config.secure) && port !== 587 && port !== 2525 && port !== 25;
      const user = String(config.user ?? '');
      const pass = String(config.password ?? '');
      const transporter = createTransport({
        host,
        port,
        secure,
        requireTLS: !secure,
        auth: user ? { user, pass } : undefined,
        tls: { servername: host },
        ...commonOpts,
      });
      return {
        entity,
        from: entity.fromAddress,
        transportLabel: `smtp:${host}:${port}`,
        send: async (msg) => { await transporter.sendMail(msg); },
      };
    }

    // gmail_oauth
    const user = extractEmail(entity.fromAddress);
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user,
        clientId: String(config.clientId ?? ''),
        clientSecret: String(config.clientSecret ?? ''),
        refreshToken: String(config.refreshToken ?? ''),
        accessToken: String(config.accessToken ?? '') || undefined,
      },
      ...commonOpts,
    });
    return {
      entity,
      from: entity.fromAddress,
      transportLabel: 'gmail-oauth:smtp.gmail.com:465',
      send: async (msg) => { await transporter.sendMail(msg); },
    };
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
