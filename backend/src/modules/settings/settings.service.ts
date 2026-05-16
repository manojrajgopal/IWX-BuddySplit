import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SiteSettingEntity } from './entities/site-setting.entity';
import { AppCache } from '@/core/cache/app-cache.service';
import { NotifyBus } from '@/core/database/notify.bus';

const CACHE_TAG = 'cms:settings';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSettingEntity)
    private readonly repo: Repository<SiteSettingEntity>,
    private readonly cache: AppCache,
    private readonly bus: NotifyBus,
  ) {}

  /** Public settings = served unauthenticated to frontend. */
  async getPublic(): Promise<Record<string, unknown>> {
    return this.cache.wrap(`${CACHE_TAG}:public`, [CACHE_TAG], async () => {
      const rows = await this.repo.find({ where: { isPublic: true } });
      const out: Record<string, unknown> = {};
      for (const r of rows) out[r.key] = r.value;
      return out;
    });
  }

  async getMany(keys: string[]): Promise<Record<string, unknown>> {
    if (keys.length === 0) return {};
    const rows = await this.repo.find({ where: { key: In(keys) } });
    const out: Record<string, unknown> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  }

  async getOne(key: string): Promise<unknown> {
    const r = await this.repo.findOne({ where: { key } });
    return r?.value;
  }

  async upsert(key: string, value: unknown, opts: { isPublic?: boolean; groupName?: string | null; updatedBy?: string | null } = {}): Promise<void> {
    await this.repo.upsert(
      {
        key, value: value as never,
        isPublic: opts.isPublic ?? true,
        groupName: opts.groupName ?? null,
        updatedBy: opts.updatedBy ?? null,
      } as SiteSettingEntity,
      ['key'],
    );
    this.cache.invalidateTag(CACHE_TAG);
    await this.bus.publish({ channel: 'cache', event: 'invalidate-tag', payload: { tag: CACHE_TAG } });
    await this.bus.publish({ channel: 'revalidate', event: 'cms.changed', payload: { key } });
  }
}
