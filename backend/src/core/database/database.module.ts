import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '@/database/data-source';
import { NotifyBus } from './notify.bus';

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions)],
  providers: [NotifyBus],
  exports: [TypeOrmModule, NotifyBus],
})
export class DatabaseModule {}
