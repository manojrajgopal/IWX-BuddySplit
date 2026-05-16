import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateEntity } from '@/modules/email/entities/email-template.entity';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplateEntity])],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
