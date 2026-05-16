import { Global, Module } from '@nestjs/common';
import { AppCache } from './app-cache.service';

@Global()
@Module({
  providers: [AppCache],
  exports: [AppCache],
})
export class CacheModule {}
