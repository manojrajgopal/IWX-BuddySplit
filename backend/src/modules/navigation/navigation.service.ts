import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NavigationItemEntity } from './entities/navigation-item.entity';
import { AppCache } from '@/core/cache/app-cache.service';

const TAG = 'cms:nav';

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(NavigationItemEntity)
    private readonly repo: Repository<NavigationItemEntity>,
    private readonly cache: AppCache,
  ) {}

  list(location: string): Promise<NavigationItemEntity[]> {
    return this.cache.wrap(`${TAG}:${location}`, [TAG], () =>
      this.repo.find({ where: { location, visible: true }, order: { sortOrder: 'ASC' } }),
    );
  }
}
