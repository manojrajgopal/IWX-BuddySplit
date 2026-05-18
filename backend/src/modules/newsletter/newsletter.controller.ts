import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { z } from 'zod';
import { MailService } from '@/core/mail/mail.service';
import { Public } from '@/common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

const SubscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  source: z.string().trim().max(80).optional(),
});
type SubscribeDto = z.infer<typeof SubscribeSchema>;

@Controller({ path: 'newsletter', version: '1' })
export class NewsletterController {
  private readonly logger = new Logger(NewsletterController.name);
  // In-memory de-dup window (per process). Persisting subscribers is left for a future migration.
  private readonly recent = new Map<string, number>();
  private readonly windowMs = 60_000;

  constructor(private readonly mail: MailService) {}

  @Public()
  @HttpCode(200)
  @Post('subscribe')
  async subscribe(
    @Body(new ZodValidationPipe(SubscribeSchema)) dto: SubscribeDto,
  ): Promise<{ ok: true; email: string }> {
    const key = dto.email;
    const now = Date.now();
    const last = this.recent.get(key) ?? 0;
    if (now - last < this.windowMs) {
      return { ok: true, email: key };
    }
    this.recent.set(key, now);

    // Fire-and-forget: don't block the response on SMTP latency.
    void this.mail
      .send({
        to: dto.email,
        templateKey: 'newsletter.welcome',
        variables: { email: dto.email, source: dto.source ?? 'home' },
      })
      .catch((err) => this.logger.warn(`newsletter mail failed for ${key}: ${(err as Error).message}`));

    this.logger.log(`newsletter subscribe → ${key} (source=${dto.source ?? 'home'})`);
    return { ok: true, email: key };
  }
}
