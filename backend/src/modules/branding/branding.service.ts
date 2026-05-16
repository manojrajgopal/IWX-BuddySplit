import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandingAssetEntity } from './entities/branding-asset.entity';
import { AppCache } from '@/core/cache/app-cache.service';

const TAG = 'cms:branding';

@Injectable()
export class BrandingService {
  constructor(
    @InjectRepository(BrandingAssetEntity)
    private readonly repo: Repository<BrandingAssetEntity>,
    private readonly cache: AppCache,
  ) {}

  async all(): Promise<Record<string, BrandingAssetEntity>> {
    return this.cache.wrap(`${TAG}:all`, [TAG], async () => {
      const rows = await this.repo.find();
      const out: Record<string, BrandingAssetEntity> = {};
      for (const r of rows) out[r.key] = r;
      return out;
    });
  }

  async upsert(key: string, asset: Partial<BrandingAssetEntity>): Promise<void> {
    await this.repo.upsert({ key, ...asset } as BrandingAssetEntity, ['key']);
    this.cache.invalidateTag(TAG);
  }
}
