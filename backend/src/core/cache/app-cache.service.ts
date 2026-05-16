import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

/**
 * In-process cache. Cross-instance invalidation happens via the Postgres
 * NOTIFY listener (see `core/database/notify.bus.ts`). No Redis required.
 *
 * Use cache tags (e.g. `ws:${workspaceId}`) so we can invalidate everything
 * touching a workspace in one call.
 */
@Injectable()
export class AppCache {
  private readonly store: LRUCache<string, unknown>;
  private readonly tagIndex = new Map<string, Set<string>>(); // tag → set of keys

  constructor() {
    const max = Number(process.env.LRU_MAX_ITEMS ?? 5000);
    const ttl = Number(process.env.LRU_TTL_MS ?? 60_000);
    this.store = new LRUCache({ max, ttl, allowStale: false, updateAgeOnGet: false });
  }

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, value: T, tags: string[] = [], ttlMs?: number): void {
    this.store.set(key, value as unknown as object, ttlMs ? { ttl: ttlMs } : undefined);
    for (const t of tags) {
      let bucket = this.tagIndex.get(t);
      if (!bucket) {
        bucket = new Set();
        this.tagIndex.set(t, bucket);
      }
      bucket.add(key);
    }
  }

  async wrap<T>(
    key: string,
    tags: string[],
    factory: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await factory();
    this.set(key, value, tags, ttlMs);
    return value;
  }

  invalidateTag(tag: string): number {
    const bucket = this.tagIndex.get(tag);
    if (!bucket) return 0;
    let removed = 0;
    for (const k of bucket) {
      if (this.store.delete(k)) removed += 1;
    }
    this.tagIndex.delete(tag);
    return removed;
  }

  invalidateKey(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }
}
