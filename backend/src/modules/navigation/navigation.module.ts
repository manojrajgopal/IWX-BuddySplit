import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NavigationItemEntity } from './entities/navigation-item.entity';
import { NavigationService } from './navigation.service';
import { NavigationController } from './navigation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NavigationItemEntity])],
  providers: [NavigationService],
  controllers: [NavigationController],
  exports: [NavigationService],
})
export class NavigationModule {}
