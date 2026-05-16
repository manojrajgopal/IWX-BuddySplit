import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { AppCache } from '@/core/cache/app-cache.service';

export interface NotifyMessage {
  channel: 'rt' | 'cache' | 'revalidate';
  event: string;
  payload: unknown;
}

type Handler = (msg: NotifyMessage) => void;

/**
 * Cross-instance event bus using Postgres LISTEN/NOTIFY.
 *
 * Channels:
 *   - `cache`     — cache invalidation broadcasts.
 *   - `rt`        — realtime events to forward to socket.io.
 *   - `revalidate`— hints for Next.js to revalidate cache tags.
 */
@Injectable()
export class NotifyBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotifyBus.name);
  private client: Client;
  private readonly handlers = new Set<Handler>();

  constructor(private readonly cache: AppCache) {}

  async onModuleInit(): Promise<void> {
    this.client = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
    await this.client.connect();

    this.client.on('notification', (n) => {
      if (!n.payload) return;
      try {
        const parsed = JSON.parse(n.payload) as NotifyMessage;
        // Built-in: cache channel auto-invalidates by tag.
        if (parsed.channel === 'cache' && parsed.event === 'invalidate-tag') {
          const tag = String((parsed.payload as { tag?: string })?.tag ?? '');
          if (tag) this.cache.invalidateTag(tag);
        }
        for (const h of this.handlers) {
          try { h(parsed); } catch (e) { this.logger.warn(`handler error: ${(e as Error).message}`); }
        }
      } catch (e) {
        this.logger.warn(`bad NOTIFY payload: ${(e as Error).message}`);
      }
    });

    await this.client.query('LISTEN rt');
    await this.client.query('LISTEN cache');
    await this.client.query('LISTEN revalidate');
    this.logger.log('NotifyBus listening on rt, cache, revalidate');
  }

  async onModuleDestroy(): Promise<void> {
    try { await this.client?.end(); } catch { /* ignore */ }
  }

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async publish(msg: NotifyMessage): Promise<void> {
    const safe = JSON.stringify(msg).replace(/'/g, "''");
    await this.client.query(`NOTIFY ${msg.channel}, '${safe}'`);
  }
}
