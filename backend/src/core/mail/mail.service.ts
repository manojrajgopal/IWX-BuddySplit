import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import Handlebars from 'handlebars';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplateEntity } from '@/modules/email/entities/email-template.entity';

interface SendOptions {
  to: string | string[];
  templateKey: string;
  variables?: Record<string, unknown>;
  // Fallback inline if template missing in DB:
  fallbackSubject?: string;
  fallbackHtml?: string;
  fallbackText?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(
    @InjectRepository(EmailTemplateEntity)
    private readonly templates: Repository<EmailTemplateEntity>,
  ) {}

  onModuleInit(): void {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }

  async send(opts: SendOptions): Promise<void> {
    const tpl = await this.templates.findOne({ where: { key: opts.templateKey } });
    const vars = opts.variables ?? {};
    const subject = render(tpl?.subject ?? opts.fallbackSubject ?? '', vars);
    const html = render(tpl?.html ?? opts.fallbackHtml ?? '', vars);
    const text = render(tpl?.text ?? opts.fallbackText ?? stripHtml(html), vars);

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
      subject,
      html,
      text,
    });
    this.logger.log(`sent[${opts.templateKey}] → ${opts.to}`);
  }
}

function render(source: string, vars: Record<string, unknown>): string {
  if (!source) return '';
  return Handlebars.compile(source, { noEscape: false })(vars);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
