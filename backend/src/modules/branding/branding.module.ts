import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandingAssetEntity } from './entities/branding-asset.entity';
import { BrandingService } from './branding.service';
import { BrandingController } from './branding.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandingAssetEntity])],
  providers: [BrandingService],
  controllers: [BrandingController],
  exports: [BrandingService],
})
export class BrandingModule {}
