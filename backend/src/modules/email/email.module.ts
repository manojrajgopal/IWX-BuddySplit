import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateEntity } from './entities/email-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplateEntity])],
  exports: [TypeOrmModule],
})
export class EmailModule {}
